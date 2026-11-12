import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

test('local server serves assets, hides project files and proxies authenticated requests',async()=>{
 let received;
 const upstream=http.createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;received={method:req.method,url:req.url,authorization:req.headers.authorization,key:req.headers['idempotency-key'],body:JSON.parse(body)};res.writeHead(201,{'Content-Type':'application/json'});res.end('{"id":"new-payment"}');});
 await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0',API_URL:`http://127.0.0.1:${upstream.address().port}`},stdio:['ignore','pipe','pipe'],windowsHide:true});
 try{
  const port=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('server startup timed out')),5000);child.once('error',reject);child.stdout.on('data',chunk=>{const match=chunk.toString().match(/localhost:(\d+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});});
  const base=`http://127.0.0.1:${port}`;
  const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/CAMPUS/);
  const asset=await fetch(base+'/assets/anya.jpg');assert.equal(asset.status,200);assert.equal(asset.headers.get('content-type'),'image/jpeg');
  for(const path of ['/package.json','/.env','/assets/..%2fpackage.json','/src/..%2fserver.mjs'])assert.equal((await fetch(base+path)).status,404,path);
  const response=await fetch(base+'/api/payments',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer integration-token','Idempotency-Key':'integration-key'},body:JSON.stringify({kind:'PREMIUM'})});
  assert.equal(response.status,201);assert.deepEqual(await response.json(),{id:'new-payment'});
  assert.deepEqual(received,{method:'POST',url:'/payments',authorization:'Bearer integration-token',key:'integration-key',body:{kind:'PREMIUM'}});
 }finally{child.kill();await new Promise(resolve=>upstream.close(resolve));}
});
