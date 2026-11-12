// Explicit local fixtures. Never writes to a remote or production database.
const { ConfigModule } = require('@nestjs/config');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
 await ConfigModule.forRoot({envFilePath:'.env'});
 const url = new URL(process.env.DATABASE_URL || '');
 if (process.env.NODE_ENV === 'production' || !['localhost','127.0.0.1'].includes(url.hostname) || url.pathname !== '/campus') throw new Error('Seed разрешён только в локальной базе campus');
 const users = [
  ['admin','Организатор','ADMIN','/assets/mark.jpg','2002-05-10','ИРИТ-РтФ'],
  ['anna','Аня','STUDENT','/assets/anya.jpg','2004-08-14','Дизайн · 3 курс'],
  ['mark','Марк','STUDENT','/assets/mark.jpg','2003-03-10','ИРИТ-РтФ · 4 курс'],
  ['lena','Лена','STUDENT','/assets/lena.jpg','2003-01-25','Психология · 3 курс'],
 ];
 const created = {};
 for (const [key,name,role,photo,birthDate,institute] of users) {
  const user = await db.user.upsert({where:{universityEmail:`audit.${key}@urfu.me`},update:{},create:{universityEmail:`audit.${key}@urfu.me`,birthDate:new Date(birthDate),isVerified:true,role}});
  created[key]=user.id;
  await db.profile.upsert({where:{userId:user.id},update:{},create:{userId:user.id,name,university:'УрФУ',institute,goal:'DATING',about:'Концерты, кофе и хорошие разговоры. Встретимся после пар?'}});
  for(const name of ['кино','концерты','кофе']) {const interest=await db.interest.upsert({where:{name},update:{},create:{name}});await db.profileInterest.upsert({where:{userId_interestId:{userId:user.id,interestId:interest.id}},update:{},create:{userId:user.id,interestId:interest.id}});}
  if(!await db.photo.count({where:{userId:user.id}}))await db.photo.create({data:{userId:user.id,storageKey:photo,position:0}});
 }
 let partner=await db.partner.findFirst({where:{name:'CAMPUS · локальная проверка'}});
 partner ||= await db.partner.create({data:{name:'CAMPUS · локальная проверка',address:'Внутренний двор УрФУ, ул. Мира, 19'}});
 for(const [title,category,price,capacity,posterUrl,days] of [['Инди-вечер во дворе','Концерты',45000,60,'/assets/concert.jpg',9],['Кофе-знакомство для студентов','Встречи',25000,25,'/assets/coffee.jpg',11],['Вечеринка «Старт семестра»','Вечеринки',60000,100,'/assets/party.jpg',17]]){
  if(!await db.event.findFirst({where:{title,partnerId:partner.id}}))await db.event.create({data:{title,category,price,capacity,posterUrl,partnerId:partner.id,description:'Локальное событие для проверки CAMPUS. Живое общение и свои люди рядом.',startsAt:new Date(Date.now()+days*86400000)}});
 }
 // Anna has liked the organizer: testing the reverse like creates a real match.
 await db.like.upsert({where:{fromUserId_toUserId:{fromUserId:created.anna,toUserId:created.admin}},update:{},create:{fromUserId:created.anna,toUserId:created.admin,isLike:true}});
 console.log('Локальные аккаунты: audit.admin@urfu.me, audit.anna@urfu.me, audit.mark@urfu.me, audit.lena@urfu.me. Вход обычным кодом из лога API.');
}
main().finally(()=>db.$disconnect()).catch(e=>{console.error(e);process.exitCode=1;});
