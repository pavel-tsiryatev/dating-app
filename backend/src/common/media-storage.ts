import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Хранилище загруженных фото.
 *
 * Если заданы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY — файлы лежат в Supabase Storage
 * (бакет SUPABASE_BUCKET, по умолчанию `photos`, публичный на чтение по прямой ссылке).
 * Иначе — на диске в MEDIA_DIR, как раньше (разработка, тесты, Docker без Supabase).
 *
 * Клиенты об этом не знают: в БД и в ответах API ключ всегда `/api/media/<uuid>.<ext>`,
 * а GET /media/:name либо отдаёт файл с диска, либо перенаправляет в Supabase.
 * Ключ сервисной роли используется только на сервере и в клиенты не попадает.
 */
export type ImageExt = 'jpg' | 'png' | 'webp';

const MIME: Record<ImageExt, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
export const mimeOf = (name: string) => MIME[name.split('.').pop() as ImageExt] ?? 'application/octet-stream';

const mediaDir = () => resolve(process.env.MEDIA_DIR || '.local/uploads');

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const bucket = process.env.SUPABASE_BUCKET || 'photos';
  return {
    object: (name: string) => `${url}/storage/v1/object/${bucket}/${name}`,
    publicUrl: (name: string) => `${url}/storage/v1/object/public/${bucket}/${name}`,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  };
}

export const usesSupabase = () => supabase() !== null;

async function check(res: Response, action: string) {
  if (res.ok) return;
  const body = await res.text().catch(() => '');
  throw new Error(`Supabase Storage: не удалось ${action} (${res.status}) ${body.slice(0, 200)}`);
}

/** Сохраняет файл под новым уникальным именем. */
export async function putMedia(name: string, data: Buffer): Promise<void> {
  const sb = supabase();
  if (!sb) {
    await mkdir(mediaDir(), { recursive: true });
    await writeFile(resolve(mediaDir(), name), data, { flag: 'wx' });
    return;
  }
  const res = await fetch(sb.object(name), {
    method: 'POST',
    headers: { ...sb.headers, 'Content-Type': mimeOf(name), 'x-upsert': 'false', 'Cache-Control': 'max-age=86400' },
    body: new Uint8Array(data),
  });
  await check(res, 'загрузить файл');
}

/** Удаляет файл; отсутствие файла не ошибка. */
export async function removeMedia(name: string): Promise<void> {
  const sb = supabase();
  if (!sb) {
    await unlink(resolve(mediaDir(), name)).catch(() => undefined);
    return;
  }
  const res = await fetch(sb.object(name), { method: 'DELETE', headers: sb.headers });
  if (res.status !== 404 && res.status !== 400) await check(res, 'удалить файл');
}

/** Где взять файл для GET /media/:name: прямая ссылка Supabase или содержимое с диска (null — нет файла). */
export async function locateMedia(name: string): Promise<{ redirect: string } | { data: Buffer } | null> {
  const sb = supabase();
  if (sb) return { redirect: sb.publicUrl(name) };
  try {
    return { data: await readFile(resolve(mediaDir(), name)) };
  } catch {
    return null;
  }
}
