import {
  ageOn, canLike, FREE_LIKES_PER_DAY, hashCode, isAdult, isUniversityEmail, orderPair, premiumPeriod,
  startOfLocalDay,
} from './rules';

describe('бизнес-правила', () => {
  const now = new Date('2026-11-12T10:00:00Z');

  it('возраст считается с учётом дня рождения', () => {
    expect(ageOn(new Date('2008-11-12'), now)).toBe(18);
    expect(ageOn(new Date('2008-11-13'), now)).toBe(17);
    expect(isAdult(new Date('2008-11-13'), now)).toBe(false);
    expect(isAdult(new Date('2000-01-01'), now)).toBe(true);
    expect(isAdult(new Date('1850-01-01'), now)).toBe(false);
    expect(isAdult(new Date('invalid'), now)).toBe(false);
  });

  it('принимает только почту вуза, включая поддомены', () => {
    const d = ['urfu.ru', 'urfu.me'];
    expect(isUniversityEmail('ivan@urfu.me', d)).toBe(true);
    expect(isUniversityEmail('ivan@student.urfu.ru', d)).toBe(true);
    expect(isUniversityEmail('ivan@gmail.com', d)).toBe(false);
    expect(isUniversityEmail('ivan@noturfu.ru', d)).toBe(false);
    expect(isUniversityEmail('bad', d)).toBe(false);
  });

  it('лимит лайков снимается Premium', () => {
    expect(canLike(FREE_LIKES_PER_DAY - 1, false)).toBe(true);
    expect(canLike(FREE_LIKES_PER_DAY, false)).toBe(false);
    expect(canLike(1000, true)).toBe(true);
  });

  it('сутки начинаются в полночь по Екатеринбургу', () => {
    expect(startOfLocalDay(new Date('2026-11-12T10:00:00Z')).toISOString()).toBe('2026-11-11T19:00:00.000Z');
    expect(startOfLocalDay(new Date('2026-11-12T20:00:00Z')).toISOString()).toBe('2026-11-12T19:00:00.000Z');
  });

  it('пара совпадения упорядочена', () => {
    expect(orderPair('b', 'a')).toEqual(['a', 'b']);
    expect(orderPair('a', 'b')).toEqual(['a', 'b']);
  });

  it('хеш кода зависит от почты и не совпадает с кодом', () => {
    const h = hashCode('A@urfu.me', '123456', 's');
    expect(h).toBe(hashCode('a@urfu.me', '123456', 's'));
    expect(h).not.toContain('123456');
    expect(h).not.toBe(hashCode('b@urfu.me', '123456', 's'));
  });

  it('Premium продлевается от конца действующей подписки', () => {
    const p1 = premiumPeriod(null, now);
    expect(p1.startsAt).toEqual(now);
    const end = new Date('2026-11-20T00:00:00Z');
    const p2 = premiumPeriod(end, now);
    expect(p2.startsAt).toEqual(end);
    expect(p2.endsAt.getTime() - end.getTime()).toBe(30 * 24 * 3600_000);
  });
});
