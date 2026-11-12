import { mkdir, cp, copyFile } from 'node:fs/promises';
await mkdir(new URL('dist/',import.meta.url),{recursive:true});
for(const dir of ['src','assets']) await cp(new URL(dir,import.meta.url),new URL(`dist/${dir}`,import.meta.url),{recursive:true});
await copyFile(new URL('index.html',import.meta.url),new URL('dist/index.html',import.meta.url));
console.log('Built dist/. Static hosting requires /api reverse proxy to NestJS.');
