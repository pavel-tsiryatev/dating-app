import assert from 'node:assert/strict';
import { test } from 'node:test';
import { priority, reportNumber } from '../src/lib/moderation.ts';
import { age, chatTime, compactMoney, money, nameCase, normalizeApiUrl, plural, remaining } from '../src/lib/text.ts';

test('деньги в рублях из копеек', () => {
  assert.match(money(45000), /^450\s₽$/);
  assert.match(money(1245000), /^12\s450\s₽$/);
  assert.equal(compactMoney(1245000), '12,5 тыс ₽');
  assert.equal(compactMoney(100000000), '1 млн ₽');
  assert.match(compactMoney(450000), /^4\s500\s₽$/);
});

test('склонение имён для «Написать Ане» и «Вы с Аней»', () => {
  const cases: [string, string, string][] = [
    ['Аня', 'Ане', 'Аней'], ['Лена', 'Лене', 'Леной'], ['Марк', 'Марку', 'Марком'], ['Ольга', 'Ольге', 'Ольгой'],
    ['Саша', 'Саше', 'Сашей'], ['Мария', 'Марии', 'Марией'], ['Андрей', 'Андрею', 'Андреем'],
  ];
  for (const [name, dative, instrumental] of cases) {
    assert.equal(nameCase(name, 'dative'), dative);
    assert.equal(nameCase(name, 'instrumental'), instrumental);
  }
  assert.equal(nameCase('Alex', 'dative'), 'Alex');
});

test('возраст, таймер брони и множественное число', () => {
  assert.equal(age('2004-08-14', new Date('2026-08-13')), 21);
  assert.equal(age('2004-08-14', new Date('2026-08-14')), 22);
  assert.equal(remaining(new Date(1_000_000 + 1_782_000).toISOString(), 1_000_000), '29:42');
  assert.equal(remaining(new Date(0).toISOString(), 1_000_000), '00:00');
  assert.equal(plural(1, 'место', 'места', 'мест'), 'место');
  assert.equal(plural(32, 'место', 'места', 'мест'), 'места');
  assert.equal(plural(11, 'место', 'места', 'мест'), 'мест');
});

test('время в списке чатов', () => {
  const now = new Date('2026-11-12T15:00:00');
  assert.equal(chatTime('2026-11-12T14:24:00', now), '14:24');
  assert.equal(chatTime('2026-11-11T09:00:00', now), 'Вчера');
});

test('адрес сервера', () => {
  assert.equal(normalizeApiUrl(' 192.168.1.10:3000/ '), 'http://192.168.1.10:3000');
  assert.equal(normalizeApiUrl('https://api.campus.ru'), 'https://api.campus.ru');
  assert.equal(normalizeApiUrl(''), '');
});

test('приоритет и номер жалобы', () => {
  assert.equal(priority('Оскорбления: грубое общение').label, 'Высокий');
  assert.equal(priority('Чужие фото').label, 'Средний');
  assert.equal(priority('Спам').label, 'Низкий');
  assert.equal(reportNumber('3f6c9a10-0000-0000-0000-000000000000'), '#3F6C');
});
