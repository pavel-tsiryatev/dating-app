import { people, demoEvents } from './data.js';
export class ApiError extends Error { constructor(message,status,code) {super(message);this.status=status;this.code=code;} }
export class CampusAPI {
  constructor({demo=false,base='/api',token='',onUnauthorized=()=>{}}={}) {this.demo=demo;this.base=base;this.token=token;this.onUnauthorized=onUnauthorized;this.resetDemo();}
  resetDemo() {
    this.me={id:'demo-me',role:'ADMIN',universityEmail:'student@urfu.me',birthDate:'2004-08-14',isVerified:true,profile:{name:'Саша',university:'УрФУ',institute:'ИРИТ-РтФ · 3 курс',goal:'DATING',about:'Музыка, кофе и хорошие разговоры. Ищу компанию на концерт после пар.',interests:['Кино','Концерты','Кофе'],photos:[{id:'my-photo',storageKey:'/assets/mark.jpg'}],hideFromInstitute:false}};
    this.feed=[...people];this.events=demoEvents();this.matches=[{id:'demo-match',user:{id:people[0].userId,name:'Аня',status:'ACTIVE'},lastMessage:{text:'Тогда на концерт после пар? 🎶'}}];
    this.messages=[{id:'m1',senderId:'demo-anya',text:'Привет! Как прошли пары? 😊',sentAt:new Date().toISOString()},{id:'m2',senderId:'demo-me',text:'Привет! Выжил 😄 Не хочешь сходить на концерт в пятницу?',sentAt:new Date().toISOString()},{id:'m3',senderId:'demo-anya',text:'О, звучит отлично! Я как раз хотела выбраться. Во сколько начинается?',sentAt:new Date().toISOString()}];
    this.partners=[{id:'demo-partner',name:'Студсовет УрФУ',address:'Екатеринбург, Мира 19'}];this.tickets=[];this.payments=[];this.meetings=[];this.reports=[{id:'demo-report',targetId:'demo-ilya',reason:'Неприемлемые сообщения и навязчивое поведение',status:'OPEN',createdAt:new Date().toISOString(),target:{profile:{name:'Илья'},status:'ACTIVE'}}];
  }
  async request(path,{method='GET',body,key}={}) {
    if(this.demo) return structuredClone(this.mock(path,method,body,key));
    const multipart=typeof FormData!=='undefined' && body instanceof FormData;
    let response;
    try {response=await fetch(this.base+path,{method,headers:{...(body&&!multipart?{'Content-Type':'application/json'}:{}),...(this.token?{Authorization:`Bearer ${this.token}`} :{}),...(key?{'Idempotency-Key':key}:{})},body:multipart?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(18000)});}
    catch {throw new ApiError('Не удалось связаться с сервером. Проверь подключение и запуск бэкенда.',0);}
    const data=response.status===204?null:await response.json().catch(()=>({message:'Сервер вернул неожиданный ответ'}));
    if(!response.ok) {if(response.status===401)this.onUnauthorized();throw new ApiError(Array.isArray(data?.message)?data.message.join('. '):data?.message || `Ошибка ${response.status}`,response.status,data?.code);}
    return data;
  }
  mock(path,method,body={},key) {
    const [route,query='']=path.split('?');const parts=route.split('/').filter(Boolean);
    if(route==='/auth/email/request')return {sent:true};
    if(route==='/auth/email/verify'){if(body.code!=='123456')throw new ApiError('Демо-код: 123456',422);return {accessToken:'demo',isNew:true};}
    if(route==='/profile') {
      if(method==='DELETE'){this.resetDemo();return null;}
      if(method==='PUT')this.me.profile={...this.me.profile,...body};return this.me;
    }
    if(route==='/profile/photos' && method==='POST'){if(this.me.profile.photos.length>=6)throw new ApiError('Не больше 6 фото',400);const photo={id:crypto.randomUUID(),storageKey:body.storageKey};this.me.profile.photos.push(photo);return photo;}
    if(parts[0]==='profile' && parts[1]==='photos' && method==='DELETE'){this.me.profile.photos=this.me.profile.photos.filter(p=>p.id!==parts[2]);return null;}
    if(route==='/feed')return this.feed;
    if(route==='/likes'){this.feed=this.feed.filter(p=>p.userId!==body.toUserId);if(!body.isLike)return {match:false,matchId:null};let match=this.matches.find(m=>m.user.id===body.toUserId);if(!match){const p=people.find(p=>p.userId===body.toUserId);match={id:crypto.randomUUID(),user:{id:p.userId,name:p.name,status:'ACTIVE'},lastMessage:null};this.matches.push(match);}return {match:true,matchId:match.id};}
    if(route==='/matches')return this.matches;
    if(parts[0]==='matches' && parts[2]==='messages'){if(method==='POST'){const same=this.messages.find(m=>m.clientId===body.clientId);if(same)return same;const m={...body,id:crypto.randomUUID(),matchId:parts[1],senderId:this.me.id,sentAt:new Date().toISOString()};this.messages.push(m);const match=this.matches.find(m=>m.id===parts[1]);if(match)match.lastMessage=m;return m;}return this.messages.filter(m=>!m.matchId || m.matchId===parts[1]);}
    if(parts[0]==='matches' && parts[2]==='meetings'){const m={...body,id:crypto.randomUUID(),proposerId:this.me.id,matchId:parts[1],status:'PROPOSED'};this.meetings.push(m);return m;}
    if(parts[0]==='meetings'){const m=this.meetings.find(m=>m.id===parts[1]);if(!m)throw new ApiError('Встреча не найдена',404);Object.assign(m,body);return m;}
    if(route==='/events')return this.events;
    if(route==='/tickets')return this.tickets;
    if(parts[0]==='events' && parts[2]==='tickets'){const event=this.events.find(e=>e.id===parts[1]);if(!event?.freeSeats)throw new ApiError('Мест нет',409);let t=this.tickets.find(t=>t.eventId===event.id);if(t?.status==='PAID')throw new ApiError('Вы уже записаны',409);if(!t){t={eventId:event.id,userId:this.me.id,event,status:'RESERVED',reservedUntil:new Date(Date.now()+1800000).toISOString()};this.tickets.push(t);event.freeSeats--;}return t;}
    if(route==='/payments'&&method==='GET')return this.payments;
    if(route==='/payments'){let p=this.payments.find(p=>p.idempotencyKey===key);if(!p){p={id:crypto.randomUUID(),kind:body.kind,amount:body.kind==='PREMIUM'?34900:this.events.find(e=>e.id===body.eventId).price,status:'PENDING',idempotencyKey:key,confirmationUrl:null,eventId:body.eventId};this.payments.push(p);}return p;}
    if(route==='/reports' && method==='POST'){const report={...body,id:crypto.randomUUID(),status:'OPEN',createdAt:new Date().toISOString()};this.reports.push(report);return report;}
    if(route==='/admin/reports')return this.reports.filter(r=>r.status==='OPEN');
    if(parts[0]==='admin' && parts[1]==='reports' && parts[3]==='decision'){const r=this.reports.find(r=>r.id===parts[2]);Object.assign(r,{status:'CLOSED',decision:body.decision});return {targetId:r.targetId,decision:body.decision,status:body.decision==='BLOCKED'?'BLOCKED':'ACTIVE'};}
    if(route==='/admin/partners'&&method==='GET')return this.partners;
    if(route==='/admin/partners'){const partner={...body,id:crypto.randomUUID()};this.partners.push(partner);return partner;}
    if(parts[0]==='admin'&&parts[1]==='events'&&parts[2]&&method==='PATCH'){const event=this.events.find(e=>e.id===parts[2]);Object.assign(event,body);return event;}
    if(route==='/admin/events'){const event={...body,id:crypto.randomUUID(),freeSeats:body.capacity,partner:{name:'Новый партнёр',address:'Екатеринбург'}};this.events.push(event);return event;}
    if(route==='/admin/stats'){const q=new URLSearchParams(query);return {from:q.get('from'),to:q.get('to'),newUsers:248,matches:86,meetingsAccepted:42,ticketsPaid:70,premiumBought:15,revenueKopecks:1245000};}
    throw new ApiError('Этот метод пока недоступен',404);
  }
  finishDemoPayment(status) {if(!this.demo)return;const p=this.payments.at(-1);if(!p)return;p.status=status;if(status==='SUCCEEDED'){const t=this.tickets.find(t=>t.eventId===p.eventId);if(t)t.status='PAID';}return p;}
}
