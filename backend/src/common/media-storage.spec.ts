import { createServer, IncomingMessage, Server } from 'http';
import { AddressInfo } from 'net';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { locateMedia, putMedia, removeMedia, usesSupabase } from './media-storage';

const NAME = '0b0f8d52-6e0e-4c1b-9a51-6a3f6f0c1d2e.png';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const read = (req: IncomingMessage) =>
  new Promise<Buffer>((ok) => { const c: Buffer[] = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });

describe('media-storage', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; });

  it('без Supabase хранит файлы на диске', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'media-'));
    delete process.env.SUPABASE_URL;
    process.env.MEDIA_DIR = dir;
    expect(usesSupabase()).toBe(false);
    await putMedia(NAME, PNG);
    expect(await locateMedia(NAME)).toEqual({ data: PNG });
    await removeMedia(NAME);
    expect(await locateMedia(NAME)).toBeNull();
    await rm(dir, { recursive: true });
  });

  describe('с Supabase', () => {
    let server: Server;
    const calls: { method?: string; url?: string; auth?: string; type?: string; body: Buffer }[] = [];
    let status = 200;
    beforeAll(async () => {
      server = createServer(async (req, res) => {
        calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, type: req.headers['content-type'], body: await read(req) });
        res.writeHead(status, { 'Content-Type': 'application/json' }).end('{}');
      });
      await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
    });
    afterAll(() => new Promise<void>((ok) => server.close(() => ok())));
    beforeEach(() => {
      calls.length = 0; status = 200;
      process.env.SUPABASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      delete process.env.SUPABASE_BUCKET;
    });

    it('загружает в бакет photos с ключом сервиса и типом файла', async () => {
      await putMedia(NAME, PNG);
      expect(calls).toEqual([{ method: 'POST', url: `/storage/v1/object/photos/${NAME}`, auth: 'Bearer service-key', type: 'image/png', body: PNG }]);
    });

    it('отдаёт публичную ссылку, а удаление идёт в тот же объект', async () => {
      const base = process.env.SUPABASE_URL!.replace(/\/$/, '');
      expect(await locateMedia(NAME)).toEqual({ redirect: `${base}/storage/v1/object/public/photos/${NAME}` });
      await removeMedia(NAME);
      expect(calls[0]).toMatchObject({ method: 'DELETE', url: `/storage/v1/object/photos/${NAME}` });
    });

    it('ошибку загрузки не проглатывает, отсутствие файла при удалении — не ошибка', async () => {
      status = 403;
      await expect(putMedia(NAME, PNG)).rejects.toThrow('403');
      status = 404;
      await expect(removeMedia(NAME)).resolves.toBeUndefined();
    });
  });
});
