const photo = name => `/assets/${name}.jpg`;
export const interests = ['Кино','Концерты','Кофе','Путешествия','Музыка','Спорт','Настолки','Искусство','Технологии','Книги','Походы','Игры'];
export const goals = { DATING:'Знакомства и отношения', FRIENDS:'Новые друзья', ACTIVITIES:'Совместные активности' };
export const people = [
 {userId:'demo-anya',name:'Аня',age:22,university:'УрФУ',institute:'Дизайн · 3 курс',goal:'DATING',about:'Дизайн, кофе и хорошие разговоры. Люблю концерты, путешествия и спонтанные планы.',interests:['Кино','Концерты','Кофе'],common:3,photos:[{storageKey:photo('anya')}],quote:'Пойдём на концерт после пар?'},
 {userId:'demo-mark',name:'Марк',age:23,university:'УрФУ',institute:'ИРИТ-РтФ · 4 курс',goal:'DATING',about:'Люблю технологии, городские прогулки и живые концерты. Ищу близкого по вайбу человека — для общения, свиданий и всего, что между ними.',interests:['Музыка','Игры','Кино','Спорт','Путешествия'],common:2,photos:[{storageKey:photo('mark')}]},
 {userId:'demo-lena',name:'Лена',age:23,university:'УрФУ',institute:'Психология · 3 курс',goal:'FRIENDS',about:'Собираю маленькие радости. Пойдём за кофе и обсудим последнюю прочитанную книгу?',interests:['Книги','Кофе','Кино'],common:2,photos:[{storageKey:photo('lena')}]},
 {userId:'demo-ilya',name:'Илья',age:25,university:'УрФУ',institute:'ИТ · 4 курс',goal:'ACTIVITIES',about:'Настолки в пятницу, походы на выходных. Всегда рад новой компании.',interests:['Настолки','Походы','Технологии'],common:1,photos:[{storageKey:photo('ilya')}]}
];
export function demoEvents() {const future=(days,hour)=>{const d=new Date();d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return d.toISOString();};return [
 {id:'demo-concert',title:'Инди-вечер во дворе',startsAt:future(9,19),price:45000,capacity:60,freeSeats:32,category:'Концерты',image:photo('concert'),partner:{name:'Студсовет УрФУ',address:'Внутренний двор УрФУ, ул. Мира, 19'},description:'Живой концерт, локальные группы, лаунж-зона и новые знакомства. Встретимся после пар!'},
 {id:'demo-coffee',title:'Кофе-знакомство для студентов',startsAt:future(11,18),price:25000,capacity:25,freeSeats:12,category:'Встречи',image:photo('coffee'),partner:{name:'Кофейня «Смена»',address:'Екатеринбург, ул. Ленина, 25'},description:'Кофе, уют и разговоры с теми, кто тоже ищет своих людей.'},
 {id:'demo-party',title:'Вечеринка «Старт семестра»',startsAt:future(17,22),price:60000,capacity:400,freeSeats:0,category:'Вечеринки',image:photo('party'),partner:{name:'Клуб «Цех»',address:'Екатеринбург, ул. Ленина, 54'},description:'DJ-сеты, танцы и специальное меню для студентов.'}
];}
export const groups = [
 ['Вход и подтверждение',['welcome','birth','university','email','code','verified']],
 ['Анкета и настройки',['edit-profile','photos','interests','profile','settings','privacy']],
 ['Знакомства и симпатии',['feed','person','filters','match','matches','empty']],
 ['Чаты и безопасность',['chats','chat','meeting','meeting-card','report','report-sent']],
 ['События и билеты',['events','event','reservation','tickets','ticket','sold-out']],
 ['Оплата и Premium',['premium','checkout','payment-pending','payment-success','payment-failed','expired']],
 ['Модерация и управление',['reports','report-detail','decision','manage-events','edit-event','stats']]
];
export const titles = Object.fromEntries(groups.flatMap(([,routes])=>routes.map((r,i)=>[r,{
 welcome:'Добро пожаловать',birth:'Дата рождения',university:'Твой университет',email:'Почта вуза',code:'Код из письма',verified:'Статус подтверждён','edit-profile':'Расскажи о себе',photos:'Добавь фото',interests:'Что вас сблизит?',profile:'Мой профиль',settings:'Настройки',privacy:'Приватность',feed:'Знакомства',person:'Анкета',filters:'Фильтры',match:'Это взаимно!',matches:'Симпатии',empty:'Пока все, но ненадолго',chats:'Чаты',chat:'Переписка',meeting:'Предложить встречу','meeting-card':'Встреча в переписке',report:'Что случилось?','report-sent':'Жалоба отправлена',events:'События',event:'О событии',reservation:'Место ждёт тебя',tickets:'Мои билеты',ticket:'Твой билет','sold-out':'Все места заняты',premium:'CAMPUS Premium',checkout:'Оплата заказа','payment-pending':'Проверяем оплату','payment-success':'Готово, ты идёшь!','payment-failed':'Оплата не прошла',expired:'Время брони вышло',reports:'Жалобы пользователей','report-detail':'Рассмотрение жалобы',decision:'Принять решение','manage-events':'Управление событиями','edit-event':'Новое событие',stats:'Отчёты команды'
 }[r]])));
