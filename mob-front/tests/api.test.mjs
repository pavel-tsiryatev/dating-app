import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { CampusAPI, ApiError } from '../src/api.js';
import { age, remaining, safeImage, safePaymentUrl, esc, encodeMeeting, decodeMeeting } from '../src/utils.js';
import { groups } from '../src/data.js';

test('18+ boundary uses full birthday, not just year',()=>{
 assert.equal(age('2008-11-13',new Date(2026,10,12)),17);
 assert.equal(age('2008-11-12',new Date(2026,10,12)),18);
 assert.equal(age('invalid'),0);
});
test('reservation expires exactly at deadline and never goes negative',()=>{
 assert.equal(remaining('2026-11-12T12:30:00Z',Date.parse('2026-11-12T12:00:00Z')),'30:00');
 assert.equal(remaining('2026-11-12T12:00:00Z',Date.parse('2026-11-12T12:01:00Z')),'00:00');
});
test('untrusted text and URLs cannot create executable markup',()=>{
 assert.equal(safePaymentUrl('javascript:alert(1)'),null);
 assert.equal(safeImage('data:image/svg+xml,<svg onload=alert(1)>'),'');
 assert.equal(safeImage('internal/storage/key'),'');
 assert.equal(safeImage('/assets/anya.jpg'),'/assets/anya.jpg');
 assert.equal(esc('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
test('all seven reference groups have six unique screens',()=>{
 assert.equal(groups.length,7);assert.ok(groups.every(([,routes])=>routes.length===6));
 assert.equal(new Set(groups.flatMap(([,r])=>r)).size,42);
});
test('meeting cards survive serialization in existing message text and reject invalid shapes',()=>{
 const m={id:'meeting-id',place:'Кофейня у корпуса',meetAt:'2026-12-01T13:00:00Z'};
 assert.deepEqual(decodeMeeting(encodeMeeting(m)),{type:'meeting',...m});
 assert.equal(decodeMeeting('CAMPUS::{broken'),null);
 assert.equal(decodeMeeting('CAMPUS::'+JSON.stringify({...m,type:'meeting',meetAt:'bad'})),null);
 assert.equal(decodeMeeting('Привет'),null);
});
test('demo like creates a match; pass removes profile; clientId prevents duplicate messages',async()=>{
 const api=new CampusAPI({demo:true});
 const feed=await api.request('/feed');
 await api.request('/likes',{method:'POST',body:{toUserId:feed[1].userId,isLike:false}});
 assert.equal((await api.request('/feed')).length,3);
 const like=await api.request('/likes',{method:'POST',body:{toUserId:feed[0].userId,isLike:true}});
 assert.equal(like.match,true);
 const path=`/matches/${like.matchId}/messages`,options={method:'POST',body:{clientId:'retry-key',text:'Привет'}};
 const a=await api.request(path,options),b=await api.request(path,options);
 assert.equal(a.id,b.id);assert.equal((await api.request(path)).filter(m=>m.clientId==='retry-key').length,1);
});
test('booking → idempotent payment → confirmed ticket; sold out rejects reservation',async()=>{
 const api=new CampusAPI({demo:true});const events=await api.request('/events');
 await assert.rejects(()=>api.request(`/events/${events[2].id}/tickets`,{method:'POST'}),/Мест нет/);
 const ticket=await api.request(`/events/${events[0].id}/tickets`,{method:'POST'});
 assert.equal(ticket.status,'RESERVED');
 const options={method:'POST',key:'checkout-key',body:{kind:'TICKET',eventId:events[0].id}};
 const a=await api.request('/payments',options),b=await api.request('/payments',options);
 assert.equal(a.id,b.id);assert.equal(a.amount,45000);
 api.finishDemoPayment('SUCCEEDED');assert.equal((await api.request('/tickets'))[0].status,'PAID');
});
test('live adapter sends exact DTO, JWT and idempotency headers; handles 204 and validation errors',async()=>{
 const received=[];let unauthorized=false;
 const server=http.createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  received.push({url:req.url,method:req.method,headers:req.headers,body:raw?JSON.parse(raw):null});
  if(req.url==='/profile'&&req.method==='DELETE'){res.writeHead(204);res.end();return;}
  if(req.url==='/bad'){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({message:['Первое','Второе']}));return;}
  if(req.url==='/expired'){res.writeHead(401);res.end('{}');return;}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:'payment',status:'PENDING'}));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {const api=new CampusAPI({base:`http://127.0.0.1:${server.address().port}`,token:'test-token',onUnauthorized:()=>{unauthorized=true;}});
  await api.request('/payments',{method:'POST',body:{kind:'TICKET',eventId:'event-id'},key:'stable-key'});
  assert.equal(received[0].headers.authorization,'Bearer test-token');assert.equal(received[0].headers['idempotency-key'],'stable-key');
  assert.deepEqual(received[0].body,{kind:'TICKET',eventId:'event-id'});
  assert.equal(await api.request('/profile',{method:'DELETE'}),null);
  await assert.rejects(()=>api.request('/bad'),error=>error instanceof ApiError&&error.status===400&&error.message==='Первое. Второе');
  await assert.rejects(()=>api.request('/expired'));assert.equal(unauthorized,true);
 }finally {await new Promise(resolve=>server.close(resolve));}
});
