"""Все диаграммы модели CAMPUS. Каждая функция возвращает SVG-строку."""
from svglib import *  # noqa: F401,F403
from svglib import (SVG, Box, idef0_box, staircase, stub_top, stub_bottom, link, dfd_process, dfd_entity,
                    dfd_store, uow, junction, elab, actor, usecase, class_box, sequence, MUTED, TEXT, BOX,
                    HL_FILL, HL_STROKE, LINE, tw)


# ============================================================ Дерево задач
# Уровень 1 — направления (ствол), уровень 2 — функции, уровень 3 — задачи.
# (код, название, хранилище или None, [задачи третьего уровня])
TREE = [
    ("1", "Сообщество студентов", "блок A1 · допуск и доверие", [
        ("11", "Регистрация и вход", "D1.1", []),
        ("12", "Подтверждение статуса студента", "D1.1", []),
        ("13", "Заполнение анкеты", "D1.2, D1.3", []),
        ("14", "Модерация", None, [
            ("141", "Приём жалоб и блокировок", "D1.4, D1.5"),
            ("142", "Рассмотрение жалобы", "D1.4"),
            ("143", "Применение решения", "D1.1"),
        ]),
    ]),
    ("2", "Знакомства и встречи", "блок A2 · ценность для студента", [
        ("21", "Формирование ленты", "чтение D1.2, D2.1", []),
        ("22", "Лайки и совпадения", "D2.1", []),
        ("23", "Переписка", "D2.2", []),
        ("24", "Согласование встречи", "D2.3", []),
        ("25", "Мероприятия", None, [
            ("251", "Согласование с партнёром", "D2.4"),
            ("252", "Публикация мероприятия", "D2.5"),
            ("253", "Запись участников", "D2.6"),
            ("254", "Отметка входа по QR", "D2.6"),
        ]),
    ]),
    ("3", "Оплата и отчётность", "блок A3 · обеспечение", [
        ("31", "Создание платежа", "D3.1", []),
        ("32", "Проверка оплаты", "D3.1, D2.6, D3.2", []),
        ("33", "Формирование отчётов", "чтение D1–D3", []),
    ]),
]


def _tree_box(s, x, y, w, code, name, note, size=10.5, bold=600):
    lines = name.split("\n")
    h = 22 + 13 * len(lines)
    b = Box(x, y, w, h)
    s.rect(b.x, b.y, b.w, b.h, stroke=BOX, rx=4)
    s.text(b.x + 7, b.y + 15, f"{code} {lines[0]}", size=size, weight=bold)
    for k, ln in enumerate(lines[1:], 1):
        s.text(b.x + 7 + tw(code + " ", size), b.y + 15 + 13 * k, ln, size=size, weight=bold)
    s.text(b.x + 7, b.b - 7, note, size=9, fill=MUTED)
    return b


def tree():
    W = 900
    s = SVG(W, 640, "Дерево растёт от ствола: цель → три направления → функции → задачи",
            "Дерево задач: 0 — цель сервиса → 1…3 — направления (блоки A1–A3) → 11…33 — функции → 141…254 — задачи")
    root = Box(300, 6, 300, 48)
    s.rect(root.x, root.y, root.w, root.h, fill=HL_FILL, stroke=HL_STROKE, sw=1.6, rx=6)
    s.text(root.cx, root.y + 21, "0. Сервис знакомств CAMPUS", size=13, weight=700, anchor="middle")
    s.text(root.cx, root.y + 37, "цель: помочь студентам знакомиться и встречаться", size=10, anchor="middle", fill=MUTED)
    colw, gap = 286, 14
    x0 = (W - (3 * colw + 2 * gap)) / 2
    ybar, ybr = 82, 98
    # ствол: одна линия от корня, от неё — три направления
    s.line([(root.cx, root.b), (root.cx, ybar)], arrow=False, color=HL_STROKE, sw=3)
    s.line([(x0 + colw / 2, ybar), (x0 + 2 * (colw + gap) + colw / 2, ybar)], arrow=False, color=HL_STROKE, sw=3)
    bottom = 0
    for i, (num, name, sub, funcs) in enumerate(TREE):
        bx = x0 + i * (colw + gap)
        br = Box(bx, ybr, colw, 46)
        s.line([(br.cx, ybar), (br.cx, ybr)], arrow=False, color=HL_STROKE, sw=2.2)
        s.rect(br.x, br.y, br.w, br.h, fill="#f7f5f0", stroke="#8f897f", sw=1.4, rx=5)
        s.text(br.cx, br.y + 19, f"{num}. {name}", size=12, weight=700, anchor="middle")
        s.text(br.cx, br.b - 9, sub, size=9.5, anchor="middle", fill=MUTED)
        spine = bx + 12
        y = br.b + 14
        last = None
        for code, fname, store, tasks in funcs:
            note = f"→ {store}" if store else f"декомпозиция A{code} · {len(tasks)} задачи"
            fb = _tree_box(s, bx + 24, y, colw - 24, code, fname, note)
            s.line([(spine, fb.y + 15), (fb.x, fb.y + 15)], arrow=False, color=BOX)
            last = fb.y + 15
            y = fb.b + 8
            if tasks:
                sub_spine = fb.x + 14
                sub_last = None
                for tcode, tname, tstore in tasks:
                    tb = _tree_box(s, fb.x + 28, y, fb.w - 28, tcode, tname, f"→ {tstore}", size=10, bold=400)
                    s.line([(sub_spine, tb.y + 15), (tb.x, tb.y + 15)], arrow=False, color=BOX)
                    sub_last = tb.y + 15
                    y = tb.b + 6
                s.line([(sub_spine, fb.b), (sub_spine, sub_last)], arrow=False, color=BOX)
                y += 4
        s.line([(spine, br.b), (spine, last)], arrow=False, color=BOX)
        bottom = max(bottom, y)
    s.h = bottom + 4
    return s.render()


# ============================================================ IDEF0 A-0

def a_minus_0():
    s = SVG(900, 300, "Сервис превращает данные и действия студентов в знакомства, мероприятия и отчёты",
            "IDEF0 · контекстная диаграмма A-0")
    b = Box(340, 100, 230, 104)
    idef0_box(s, b, "Обеспечить работу\nсервиса знакомств\nCAMPUS", "A0", hl=True, size=13)
    ins = ["I1 Данные студента", "I2 Действия студентов", "I3 Предложения партнёров",
           "I4 Уведомления платёжного сервиса"]
    for k, t in enumerate(ins):
        y = b.y + 18 + k * 23
        s.line([(10, y), (b.x, y)])
        s.text(14, y - 5, t, size=11)
    outs = ["O1 Совпадения, переписка, встречи", "O2 Мероприятия и билеты", "O3 Уведомления",
            "O4 Отчёты команде сервиса"]
    for k, t in enumerate(outs):
        y = b.y + 18 + k * 23
        s.line([(b.r, y), (890, y)])
        s.text(b.r + 8, y - 5, t, size=11)
    # управление
    s.text(190, 16, "C1 Правила сервиса и модерации", size=11, anchor="middle")
    s.line([(190, 22), (190, 60), (395, 60), (395, b.y)])
    s.text(455, 16, "C2 152-ФЗ «О персональных данных»", size=11, anchor="middle")
    s.line([(455, 22), (455, b.y)])
    s.text(720, 16, "C3 Тарифы и условия оплаты", size=11, anchor="middle")
    s.line([(720, 22), (720, 60), (515, 60), (515, b.y)])
    # механизмы
    s.text(190, 296, "M1 Модератор", size=11, anchor="middle")
    s.line([(190, 282), (190, 248), (395, 248), (395, b.b)])
    s.text(455, 296, "M2 Организатор мероприятий", size=11, anchor="middle")
    s.line([(455, 282), (455, b.b)])
    s.text(720, 296, "M3 Сервер CAMPUS (API, БД) и клиенты", size=11, anchor="middle")
    s.line([(720, 282), (720, 248), (515, 248), (515, b.b)])
    s.h = 304
    return s.render()


# ============================================================ IDEF0 A0

def a0():
    s = SVG(1000, 560, "Жалобы и статус оплаты возвращаются в предыдущие направления",
            "IDEF0 · декомпозиция A0 на три направления, обратные связи A2 → A1 (жалобы) и A3 → A2 (статус оплаты)")
    names = ["Вести\nсообщество\nстудентов", "Организовать\nзнакомства\nи встречи", "Принимать оплату\nи вести\nотчётность"]
    B = staircase(3, 150, 92, 245, 150, 178, 92)
    for i, b in enumerate(B):
        idef0_box(s, b, names[i], f"A{i + 1}", hl=(i == 1), size=12)
    # входы с границы
    y1 = B[0].L(0.3)[1]
    s.line([(10, y1), B[0].L(0.3)]); s.text(14, y1 - 5, "I1 Данные студента", size=10.5)
    y2 = B[1].L(0.32)[1]
    s.line([(10, y2), B[1].L(0.32)]); s.text(14, y2 - 5, "I2 Действия студентов", size=10.5)
    y2b = B[2].L(0.62)[1]
    s.dot(40, y2)
    s.line([(40, y2), (40, y2b), B[2].L(0.62)])
    s.text(B[2].x - 8, y2b - 5, "покупка Premium", size=10, anchor="end", fill=MUTED)
    y3 = B[1].L(0.68)[1]
    s.line([(60, y3), B[1].L(0.68)]); s.text(64, y3 - 5, "I3 Предложения партнёров", size=10.5)
    y4 = B[2].L(0.86)[1]
    s.line([(60, y4), B[2].L(0.86)]); s.text(64, y4 - 5, "I4 Уведомления платёжного сервиса", size=10.5)
    yt = B[2].L(0.32)[1]
    s.line([(600, yt), B[2].L(0.32)])
    s.text(594, yt + 3.5, "(сводные данные D1–D2)", size=9.5, anchor="end", fill=MUTED)
    # прямые связи
    link(s, B[0], B[1], "Анкеты и статусы", fa=0.55, fb=0.14)
    link(s, B[1], B[2], "Заказ билета", fa=0.55, fb=0.14, lab_pos=(B[1].r + 40, B[1].b + 18))
    # обратная связь по входу: жалобы и блокировки A2 → A1 (под блоками)
    x, y = B[1].R(0.86)
    lane, low, back = B[1].r + 14, B[1].b + 66, B[0].x - 22
    s.line([(x, y), (lane, y), (lane, low), (back, low), (back, B[0].L(0.8)[1]), B[0].L(0.8)])
    s.text(back + 8, low - 6, "Жалобы и блокировки (обратная связь)", size=10, fill=MUTED)
    # обратная связь по управлению: статус оплаты A3 → A2 (над блоками)
    x, y = B[2].R(0.3)
    lane2, top = 952, B[1].y - 34
    xt = B[1].T(0.78)[0]
    s.line([(x, y), (lane2, y), (lane2, top), (xt, top), (xt, B[1].y)])
    s.text(xt + 6, top - 5, "Статус оплаты (билет, Premium)", size=10, fill=MUTED)
    # управление и механизмы
    stub_top(s, B[0], 0.25, "C1"); stub_top(s, B[0], 0.5, "C2")
    stub_top(s, B[1], 0.3, "C1")
    stub_top(s, B[2], 0.3, "C3"); stub_top(s, B[2], 0.55, "C2")
    stub_bottom(s, B[0], 0.25, "M1"); stub_bottom(s, B[0], 0.5, "M3")
    stub_bottom(s, B[1], 0.25, "M2"); stub_bottom(s, B[1], 0.5, "M3")
    stub_bottom(s, B[2], 0.35, "M3")
    # выходы на границу
    for bi, f, t in [(0, 0.22, "O3 Уведомления о решении"), (1, 0.14, "O1 Совпадения, переписка, встречи"),
                     (1, 0.36, "O2 Мероприятия и билеты"), (2, 0.62, "O3 Уведомления об оплате"),
                     (2, 0.86, "O4 Отчёты")]:
        x, y = B[bi].R(f)
        s.line([(x, y), (990, y)])
        s.text(985, y - 5, t, size=10.5, anchor="end")
    s.h = 545
    return s.render()


# ============================================================ IDEF0 декомпозиции второго уровня

def decomp(sp):
    s = SVG(sp.get("W", 900), sp.get("H", 420), sp["title"], sp["sub"])
    p = dict(x0=170, y0=62, dx=165, dy=96, bw=132, bh=62)
    p.update(sp.get("geo", {}))
    B = staircase(len(sp["blocks"]), p["x0"], p["y0"], p["dx"], p["dy"], p["bw"], p["bh"])
    for b, (name, code, hl) in zip(B, sp["blocks"]):
        idef0_box(s, b, name, code, hl=hl)
    for a, b, label, fa, fb in sp.get("links", []):
        link(s, B[a], B[b], label, fa=fa, fb=fb)
    for label, targets, xs in sp.get("ins", []):
        (b0, f0) = targets[0]
        y0 = B[b0].L(f0)[1]
        s.line([(xs, y0), B[b0].L(f0)])
        s.text(xs + 4, y0 - 5, label, size=10.5)
        if len(targets) > 1:
            bus = xs + 40
            ylast = B[targets[-1][0]].L(targets[-1][1])[1]
            s.dot(bus, y0)
            s.line([(bus, y0), (bus, ylast), B[targets[-1][0]].L(targets[-1][1])])
            for bi, f, *lab in targets[1:]:
                yy = B[bi].L(f)[1]
                if (bi, f) != targets[-1][:2]:
                    s.dot(bus, yy)
                    s.line([(bus, yy), B[bi].L(f)])
                if lab:
                    s.text(B[bi].x - 6, yy - 5, lab[0], size=10, anchor="end", fill=MUTED)
    for bi, items in sp.get("ctrl", {}).items():
        for f, label in items:
            stub_top(s, B[bi], f, label)
    for bi, items in sp.get("mech", {}).items():
        fs = [0.2] if len(items) == 1 else [0.12, 0.27]
        for f, (_, label) in zip(fs, items):
            stub_bottom(s, B[bi], f, label)
    for bi, f, label in sp.get("outs", []):
        x, y = B[bi].R(f)
        s.line([(x, y), (s.w - 10, y)])
        s.text(s.w - 14, y - 5, label, size=10.5, anchor="end")
    for j, fa, i, fb, label, ytop in sp.get("fb", []):
        x, y = B[j].R(fa)
        lane = B[j].r + 9
        xt, yt = B[i].T(fb)
        s.line([(x, y), (lane, y), (lane, ytop), (xt, ytop), (xt, yt)])
        s.text(xt + 6, ytop - 5, label, size=10, fill=MUTED)
    s.h = sp.get("H", 420)
    return s.render()


A1 = dict(
    title="В ленту попадает только подтверждённый студент; решение модератора возвращается ко входу",
    sub="IDEF0 · декомпозиция A1 «Вести сообщество студентов»", H=480, W=1000,
    geo=dict(y0=78),
    blocks=[("Зарегистрировать\nи авторизовать", "A11", False), ("Подтвердить\nстатус студента", "A12", True),
            ("Заполнить\nанкету", "A13", False), ("Модерировать\nсообщество", "A14", False)],
    links=[(0, 1, "Учётная запись", 0.5, 0.3), (1, 2, "Отметка «студент»", 0.5, 0.3)],
    ins=[("I1 Данные студента", [(0, 0.5), (1, 0.75, "почта вуза, код"), (2, 0.75, "фото, интересы, цель")], 10),
         ("I2 Жалобы и блокировки (из A2)", [(3, 0.5)], 10)],
    ctrl={0: [(0.3, "C1"), (0.55, "C2")], 1: [(0.55, "C2")], 2: [(0.55, "C1")], 3: [(0.3, "C1"), (0.55, "C2")]},
    mech={0: [(0.3, "M2")], 1: [(0.3, "M2")], 2: [(0.3, "M2")], 3: [(0.2, "M1"), (0.3, "M2")]},
    outs=[(2, 0.4, "O1 Анкеты и статусы (в A2)"), (3, 0.6, "O2 Уведомления о решении")],
    fb=[(3, 0.12, 0, 0.75, "Решение модерации: статус пользователя (блокировка закрывает вход)", 30)],
)

A14 = dict(
    title="Личная блокировка действует сразу, решение по жалобе принимает только модератор",
    sub="IDEF0 · декомпозиция A14 «Модерировать сообщество»", H=395,
    blocks=[("Принять жалобу\nили блокировку", "A141", False), ("Рассмотреть\nжалобу", "A142", True),
            ("Применить\nрешение", "A143", False)],
    links=[(0, 1, "Жалоба в очереди", 0.5, 0.3), (1, 2, "Решение", 0.5, 0.3)],
    ins=[("I1 Жалобы и блокировки (из A2)", [(0, 0.5)], 10)],
    ctrl={0: [(0.55, "C1")], 1: [(0.4, "C1"), (0.7, "C2")], 2: [(0.55, "C1")]},
    mech={0: [(0.3, "M2")], 1: [(0.3, "M1")], 2: [(0.3, "M2")]},
    outs=[(0, 0.2, "O1 Скрытие анкеты (≥ 3 жалоб), блокировка"), (2, 0.35, "O2 Решение модерации (в A11, A2)"),
          (2, 0.7, "O3 Уведомления участникам")],
)

A2 = dict(
    title="Лента не показывает оценённые анкеты, чат открывается только после совпадения",
    sub="IDEF0 · декомпозиция A2 «Организовать знакомства и встречи»", H=600, W=1000,
    geo=dict(x0=150, dx=145, bw=125, y0=78, dy=94),
    blocks=[("Сформировать\nленту", "A21", False), ("Обработать\nлайки", "A22", True),
            ("Вести\nпереписку", "A23", False), ("Согласовать\nвстречу", "A24", False),
            ("Проводить\nмероприятия", "A25", False)],
    links=[(0, 1, "Лента анкет", 0.5, 0.3), (1, 2, "Совпадение", 0.5, 0.3), (2, 3, "Переписка", 0.5, 0.3)],
    ins=[("I1 Анкеты (из A1)", [(0, 0.5)], 10),
         ("I2 Действия студента", [(1, 0.75), (2, 0.75, "сообщение"), (3, 0.75, "предложение встречи"),
                                   (4, 0.7, "заявка на участие")], 10),
         ("I3 Предложения партнёров", [(4, 0.3)], 60)],
    ctrl={0: [(0.2, "C1"), (0.45, "C2")], 1: [(0.3, "C1"), (0.6, "C3")], 2: [(0.5, "C1")], 3: [(0.5, "C1")],
          4: [(0.3, "C1"), (0.6, "C3")]},
    mech={0: [(0.3, "M2")], 1: [(0.3, "M2")], 2: [(0.3, "M2")], 3: [(0.3, "M2")], 4: [(0.2, "M1"), (0.3, "M2")]},
    outs=[(2, 0.2, "O2 Жалобы и блокировки (в A1)"), (3, 0.4, "O1 Совпадения, переписка, встречи"),
          (4, 0.25, "O3 Заказ билета (в A3)"), (4, 0.6, "O4 Билеты, афиша")],
    fb=[(1, 0.12, 0, 0.75, "Оценённые анкеты (не показывать повторно)", 30)],
)

A25 = dict(
    title="Место закрепляется только после оплаты, а вход по QR-билету отмечается один раз",
    sub="IDEF0 · декомпозиция A25 «Проводить мероприятия»", H=470, W=1000,
    blocks=[("Согласовать\nс партнёром", "A251", False), ("Опубликовать\nмероприятие", "A252", False),
            ("Записать\nучастников", "A253", True), ("Отметить вход\nпо билету", "A254", False)],
    links=[(0, 1, "Условия площадки", 0.5, 0.3), (1, 2, "Мероприятие", 0.5, 0.3), (2, 3, "Билет (QR)", 0.62, 0.3)],
    ins=[("I1 Предложения партнёров", [(0, 0.5)], 10), ("I2 Заявки студентов", [(2, 0.8)], 10)],
    ctrl={0: [(0.55, "C1")], 1: [(0.55, "C1")], 2: [(0.35, "C1"), (0.7, "C2")], 3: [(0.55, "C1")]},
    mech={0: [(0.3, "M1")], 1: [(0.25, "M1"), (0.5, "M2")], 2: [(0.3, "M2")], 3: [(0.25, "M1"), (0.5, "M2")]},
    outs=[(1, 0.2, "O2 Афиша мероприятий"), (2, 0.25, "O1 Заказ билета (в A3)"),
          (3, 0.45, "O3 Отметки входа, списки")],
)

A3 = dict(
    title="Только подтверждённая платёжным сервисом оплата меняет статус билета и Premium",
    sub="IDEF0 · декомпозиция A3 «Принимать оплату и вести отчётность»", H=395,
    blocks=[("Создать\nплатёж", "A31", False), ("Проверить\nоплату", "A32", True),
            ("Сформировать\nотчёты", "A33", False)],
    geo=dict(bh=70),
    links=[(0, 1, "Платёж «ожидает»", 0.5, 0.3), (1, 2, "Оплаченные платежи", 0.72, 0.3)],
    ins=[("I1 Заказ билета (из A25)", [(0, 0.35)], 10), ("I2 Покупка Premium", [(0, 0.7)], 10),
         ("I3 Уведомление платёжного сервиса", [(1, 0.75)], 10),
         ("(I4 Сводные данные из D1–D2)", [(2, 0.75)], 10)],
    ctrl={0: [(0.3, "C1")], 1: [(0.3, "C1")], 2: [(0.55, "C2")]},
    mech={0: [(0.3, "M1")], 1: [(0.3, "M1")], 2: [(0.3, "M1")]},
    outs=[(1, 0.18, "O1 Статус оплаты (в A2)"), (1, 0.45, "O2 Уведомления об оплате"),
          (2, 0.4, "O3 Отчёты")],
    fb=[(1, 0.05, 0, 0.75, "Ошибка оплаты: повторить", 30)],
)


def a1(): return decomp(A1)
def a14(): return decomp(A14)
def a2(): return decomp(A2)
def a25(): return decomp(A25)
def a3(): return decomp(A3)


# ============================================================ IDEF1X / UML-классы
# (имя IDEF1X, имя класса UML, PK, атрибуты IDEF1X, атрибуты UML, зависимая, подсветка)
ENT = {
    "INT": ("ИНТЕРЕС", "Интерес", ["interest_id"], ["name"], ["+название: String"], False, False),
    "PI": ("АНКЕТА_ИНТЕРЕС", None, ["user_id (FK)", "interest_id (FK)"], [], None, True, False),
    "PRO": ("АНКЕТА", "Анкета", ["user_id (FK)"],
            ["name", "university", "institute", "goal", "about", "hide_from_institute", "is_visible"],
            ["+имя: String", "+вуз: String", "+институт: String", "+цель: Цель",
             "+скрытьОтИнститута: Boolean", "+видна: Boolean"], True, False),
    "PH": ("ФОТО", "Фото", ["photo_id"], ["user_id (FK)", "storage_key", "position"],
           ["+ключХранилища: String", "+порядок: int"], False, False),
    "REP": ("ЖАЛОБА", "Жалоба", ["report_id"],
            ["author_id (FK)", "target_id (FK)", "moderator_id (FK)", "reason", "status", "decision", "created_at"],
            ["+причина: String", "+статус: Новая | Скрыта | Закрыта", "+решение: Решение", "+создана: DateTime"],
            False, False),
    "LIKE": ("ЛАЙК", "Лайк", ["from_user_id (FK)", "to_user_id (FK)"], ["is_like", "created_at"],
             ["+нравится: Boolean", "+создан: DateTime"], True, False),
    "USER": ("ПОЛЬЗОВАТЕЛЬ", "Пользователь", ["user_id"], ["university_email", "birth_date", "is_verified",
                                                          "role", "status", "consent_at", "telegram_id"],
             ["+почтаВуза: String", "+датаРождения: Date", "+подтверждён: Boolean",
              "+роль: Студент | Модератор | Админ",
              "+статус: Активен | Скрыт | Блок"], False, True),
    "PAY": ("ПЛАТЁЖ", "Платёж", ["payment_id"],
            ["user_id (FK)", "kind", "amount", "status", "provider_payment_id", "idempotency_key", "paid_at"],
            ["+вид: Билет | Premium", "+сумма: Money", "+статус: Ожидает | Оплачен | Ошибка",
             "+ключИдемпотентности: String"], False, True),
    "MSG": ("СООБЩЕНИЕ", "Сообщение", ["message_id"], ["match_id (FK)", "sender_id (FK)", "client_id", "text", "sent_at"],
            ["+текст: String", "+отправлено: DateTime"], False, False),
    "MATCH": ("СОВПАДЕНИЕ", "Совпадение", ["match_id"], ["user_a_id (FK)", "user_b_id (FK)", "created_at"],
              ["+создано: DateTime"], False, False),
    "TICK": ("БИЛЕТ", "Билет", ["event_id (FK)", "user_id (FK)"], ["payment_id (FK)", "status", "reserved_until", "pass_token",
                                                       "checked_in_at"],
             ["+статус: Бронь | Оплачен | Снят", "+броньДо: DateTime", "+кодQR: String", "+вход: DateTime"], True, False),
    "SUB": ("ПОДПИСКА", "ПодпискаPremium", ["subscription_id"], ["payment_id (FK)", "starts_at", "ends_at"],
            ["+начало: Date", "+окончание: Date"], False, False),
    "MEET": ("ВСТРЕЧА", "Встреча", ["meeting_id"],
             ["match_id (FK)", "proposer_id (FK)", "place", "meet_at", "status"],
             ["+место: String", "+время: DateTime", "+статус: СтатусВстречи"], False, False),
    "EV": ("МЕРОПРИЯТИЕ", "Мероприятие", ["event_id"], ["partner_id (FK)", "title", "starts_at", "capacity", "price",
                                                  "category", "published"],
           ["+название: String", "+начало: DateTime", "+вместимость: int", "+цена: Money", "+опубликовано: Boolean"], False, False),
    "BLOCK": ("БЛОКИРОВКА", "Блокировка", ["blocker_id (FK)", "blocked_id (FK)"], [], [], True, False),
    "PART": ("ПАРТНЁР", "Партнёр", ["partner_id"], ["name", "address", "terms"],
             ["+название: String", "+адрес: String", "+условия: String"], False, False),
}

GRID = [["INT", "PI", "PRO", "PH"], ["REP", "LIKE", "USER", "PAY"], ["MSG", "MATCH", "TICK", "SUB"],
        ["BLOCK", "MEET", "EV", "PART"]]


def _layout(uml):
    cols = [14, 252, 490, 728]
    w = 205
    E = {}
    y = 22 if not uml else 6
    for row in GRID:
        hmax = 0
        for c, k in enumerate(row):
            if not k or (uml and ENT[k][1] is None):
                continue
            e = ENT[k]
            if uml:
                h = 20 + 8 + 14 * len(e[4])
            else:
                h = 16 + 14 * len(e[2]) + 14 * max(1, len(e[3]))
            E[k] = Box(cols[c], y, w, h)
            hmax = max(hmax, h)
        y += hmax + (62 if not uml else 58)
    return E, y


def _gap_below(E, k):
    return E[k].b + 26


def er(uml=False):
    E, H = _layout(uml)
    if uml:
        s = SVG(950, H + 30, "Пользователь — центральный класс: от него зависят анкета, знакомства и оплаты",
                "UML 2.5 · диаграмма классов предметной области")
    else:
        s = SVG(950, H + 30, "Все знакомства и оплаты сходятся на сущности ПОЛЬЗОВАТЕЛЬ",
                "IDEF1X · логическая модель данных (уровень ключей), 16 сущностей → 16 таблиц PostgreSQL")
    g = lambda k: E[k]

    def hz(a, b, off=18):
        A, Bx = E[a], E[b]
        y = max(A.y, Bx.y) + off
        if A.x < Bx.x:
            return [(A.r, y), (Bx.x, y)]
        return [(A.x, y), (Bx.r, y)]
    # связи: (родитель, ребёнок, точки, идентифицирующая, кратн. родителя, кратн. ребёнка, ромб-композиция)
    yg12 = (g("PRO").b + g("USER").y) / 2 if "PRO" in E else 0
    yg23 = max(g("USER").b, g("PAY").b, g("LIKE").b, g("REP").b) + 22
    yg23b = yg23 + 12
    rels = [
        ("USER", "PRO", [g("USER").T(0.5), g("PRO").B(0.5)], True, "1", "0..1", True),
        ("USER", "LIKE", hz("USER", "LIKE"), True, "1", "0..*", False),
        ("USER", "PAY", hz("USER", "PAY"), False, "1", "0..*", False),
        ("USER", "TICK", [g("USER").B(0.5), g("TICK").T(0.5)], True, "1", "0..*", False),
        ("USER", "REP", [g("USER").B(0.1), (g("USER").B(0.1)[0], yg23), (g("REP").B(0.5)[0], yg23),
                         g("REP").B(0.5)], False, "1", "0..*", False),
        ("USER", "MATCH", [g("USER").B(0.28), (g("USER").B(0.28)[0], yg23b), (g("MATCH").T(0.75)[0], yg23b),
                           g("MATCH").T(0.75)], False, "1", "0..*", False),
        ("PAY", "TICK", [g("PAY").B(0.15), (g("PAY").B(0.15)[0], yg23), (g("TICK").T(0.85)[0], yg23),
                         g("TICK").T(0.85)], False, "1", "0..1", False),
        ("PAY", "SUB", [g("PAY").B(0.55), g("SUB").T(0.55)], False, "1", "0..1", False),
        ("MATCH", "MSG", hz("MATCH", "MSG"), False, "1", "0..*", True),
        ("MATCH", "MEET", [g("MATCH").B(0.5), g("MEET").T(0.5)], False, "1", "0..*", False),
        ("EV", "TICK", [g("EV").T(0.5), g("TICK").B(0.5)], True, "1", "0..*", False),
        ("PART", "EV", hz("PART", "EV"), False, "1", "0..*", False),
        ("PRO", "PH", hz("PRO", "PH"), False, "1", "1..6", True),
        ("USER", "BLOCK", [g("USER").T(0.1), (g("USER").T(0.1)[0], yg12), (6, yg12), (6, g("BLOCK").y - 30),
                           (g("BLOCK").T(0.9)[0], g("BLOCK").y - 30), g("BLOCK").T(0.9)], True, "1", "0..*", False),
    ]
    if uml:
        rels.append(("PRO", "INT", hz("PRO", "INT"), False, "0..*", "3..10", False))
    else:
        rels += [
            ("PRO", "PI", hz("PRO", "PI"), True, "", "", False),
            ("INT", "PI", hz("INT", "PI"), True, "", "", False),
        ]
    for a, b, pts, ident, m1, m2, comp in rels:
        if uml:
            s.line(pts, arrow=False, color="#8f897f")
            if comp:
                (x0, y0), (x1, y1) = pts[0], pts[1]
                dx, dy = (x1 - x0), (y1 - y0)
                L = (dx * dx + dy * dy) ** 0.5
                ux, uy = dx / L, dy / L
                px, py = -uy, ux
                d = [(x0, y0), (x0 + ux * 8 + px * 5, y0 + uy * 8 + py * 5), (x0 + ux * 16, y0 + uy * 16),
                     (x0 + ux * 8 - px * 5, y0 + uy * 8 - py * 5)]
                s.raw('<path d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in d) + ' z" fill="#7a746b"/>')
            for (p, q), m in [((pts[0], pts[1]), m1), ((pts[-1], pts[-2]), m2)]:
                dx, dy = q[0] - p[0], q[1] - p[1]
                if abs(dx) > abs(dy):
                    tx, ty = p[0] + (4 if dx > 0 else -4), p[1] - 5
                    an = "start" if dx > 0 else "end"
                else:
                    tx, ty = p[0] + 5, p[1] + (14 if dy > 0 else -6)
                    an = "start"
                s.text(tx, ty, m, size=9.5, anchor=an, fill=MUTED)
        else:
            s.line(pts, arrow=False, dash=None if ident else "5 4", color="#8f897f")
            s.dot(*pts[-1], r=3.6, color="#8f897f")
    for k, b in E.items():
        e = ENT[k]
        if uml:
            class_box(s, b.x, b.y, b.w, e[1], e[4], hl=e[6])
        else:
            class_box(s, b.x, b.y, b.w, e[0], e[3], pk=e[2], hl=e[6], rounded=e[5])
    if not uml:
        lx, ly = 22, g("BLOCK").b + 18
        for i, t in enumerate(["Над чертой — первичный ключ", "(FK) — внешний ключ",
                               "Сплошная линия — идентифицирующая связь", "Пунктир — неидентифицирующая",
                               "● — сторона «много»", "Скруглённые углы — зависимые сущности"]):
            s.text(lx, ly + i * 15, t, size=10, fill=MUTED)
    else:
        lx, ly = 22, g("BLOCK").b + 18
        for i, t in enumerate(["◆ — композиция (часть не живёт", "   без целого)",
                               "Числа у концов связей — кратность", "+ — открытый атрибут, после «:» — тип",
                               "Перечисления (A | B) в коде становятся Enum"]):
            s.text(lx, ly + i * 15, t, size=10, fill=MUTED)
    return s.render()


def idef1x(): return er(False)
def classes(): return er(True)


# ============================================================ DFD

def _lab(s, x, y, t, anchor="start"):
    s.text(x, y, t, size=9.5, anchor=anchor, fill=MUTED)


def dfd0():
    s = SVG(960, 420, "Студент работает со всеми направлениями, а данные между ними передаются через хранилища",
            "DFD · процессы первого уровня (нотация Гейна–Сарсона), хранилища показаны укрупнённо")
    st = Box(20, 175, 110, 70)
    dfd_entity(s, st, "Студент")
    names = ["Сообщество\nстудентов", "Знакомства\nи встречи", "Оплата\nи отчётность"]
    P = [Box(270, 30 + 140 * i, 170, 70) for i in range(3)]
    for i, b in enumerate(P):
        dfd_process(s, b, str(i + 1), names[i], hl=(i == 1))
    snames = ["Сообщество: пользователи, анкеты, жалобы", "Знакомства и мероприятия", "Платежи и подписки"]
    D = [Box(500, 50 + 140 * i, 250, 30) for i in range(3)]
    for i, b in enumerate(D):
        dfd_store(s, b, f"D{i + 1}", snames[i])
    mod = Box(800, 20, 130, 46); dfd_entity(s, mod, "Модератор")
    team = Box(800, 160, 130, 46); dfd_entity(s, team, "Команда CAMPUS")
    part = Box(800, 226, 130, 46); dfd_entity(s, part, "Партнёр")
    pay = Box(800, 304, 130, 50); dfd_entity(s, pay, "Платёжный\nсервис")
    # студент ↔ процессы
    s.line([(130, 188), (150, 188), (150, 65), (270, 65)], start_arrow=True); _lab(s, 158, 60, "данные, анкета, жалоба / статус")
    s.line([(130, 210), (270, 210)], start_arrow=True); _lab(s, 156, 204, "лайки, чат, заявки")
    s.line([(130, 232), (150, 232), (150, 345), (270, 345)], start_arrow=True); _lab(s, 158, 340, "оплата / статус")
    # процесс ↔ своё хранилище
    for i, t in enumerate(["запись", "запись", "запись"]):
        y = P[i].cy
        s.line([(P[i].r, y), (D[i].x, y)], start_arrow=True)
        _lab(s, 470, y - 5, t, "middle")
    # процесс 2 читает анкеты и блокировки из D1
    s.line([(560, 80), (560, 120), (410, 120), (410, 170)]); _lab(s, 568, 116, "анкеты, блокировки")
    # процесс 2 передаёт жалобы в процесс 1
    s.line([(300, 170), (300, 100)]); _lab(s, 294, 140, "жалоба", "end")
    # процессы 2 и 3: заказ билета / статус оплаты
    s.line([(320, 240), (320, 310)]); _lab(s, 314, 278, "заказ билета", "end")
    s.line([(390, 310), (390, 240)]); _lab(s, 396, 278, "статус оплаты")
    # процесс 3 читает D1, D2 для отчётов
    s.line([(700, 220), (700, 286), (440, 286), (440, 310)], dash="4 3"); _lab(s, 694, 280, "сводные данные D1–D2", "end")
    # внешние сущности справа
    s.line([(P[0].r, 40), (mod.x, 40)], start_arrow=True); _lab(s, 795, 35, "жалоба / решение", "end")
    s.line([(P[1].r, 180), (team.x, 180)], start_arrow=True); _lab(s, 795, 175, "мероприятие / отметка входа", "end")
    s.line([(P[1].r, 232), (775, 232), (775, 249), (part.x, 249)], start_arrow=True); _lab(s, 770, 245, "условия / участники", "end")
    s.line([(P[2].r, 318), (pay.x, 318)], start_arrow=True); _lab(s, 795, 313, "платёж / уведомление", "end")
    s.line([(P[2].r, 392), (950, 392), (950, 183), (team.r, 183)]); _lab(s, 795, 387, "отчёты", "end")
    s.h = 405
    return s.render()


def _ext_top(s, b, proc, f, label, two=False, lab_dx=6):
    x = proc.T(f)[0]
    s.line([(x, b.b), (x, proc.y)], start_arrow=two)
    _lab(s, x + lab_dx, (b.b + proc.y) / 2 + 3, label)


def _store_link(s, proc, f, store, label, mode="both", lab_dx=6):
    x = proc.B(f)[0]
    if mode == "both":
        s.line([(x, proc.b), (x, store.y)], start_arrow=True)
    elif mode == "in":   # процесс пишет
        s.line([(x, proc.b), (x, store.y)])
    else:                # процесс читает
        s.line([(x, store.y), (x, proc.b)])
    _lab(s, x + lab_dx, (proc.b + store.y) / 2 + 3, label)


def _chain(s, a, b, label):
    s.line([a.R(0.5), b.L(0.5)])
    _lab(s, (a.r + b.x) / 2, a.cy - 6, label, "middle")


def dfd1():
    s = SVG(960, 345, "Блокировка действует сразу, а статус пользователя меняет только решение модератора",
            "DFD · декомпозиция процесса 1 «Сообщество студентов»")
    st = Box(20, 8, 120, 56); dfd_entity(s, st, "Студент")
    P = [Box(165 + 180 * i, 140, 130, 66) for i in range(3)] + [Box(735, 140, 130, 66)]
    for b, n, nm in zip(P, ["11", "12", "13", "14"], ["Регистрация\nи вход", "Подтверждение\nстатуса", "Заполнение\nанкеты",
                                                     "Модерация"]):
        dfd_process(s, b, n, nm, hl=(n == "12"))
    for i, (y, t, two) in enumerate([(52, "дата рождения, согласие, почта / сессия", True),
                                     (36, "код из письма / отметка", True),
                                     (20, "фото, интересы, цель", False)]):
        x = P[i].T(0.5)[0]
        s.line([(st.r, y), (x, y), (x, P[i].y)], start_arrow=two)
        _lab(s, st.r + 10, y - 4, t)
    st2 = Box(760, 8, 90, 46); dfd_entity(s, st2, "Студент")
    s.line([(st2.x + 14, st2.b), (st2.x, st2.b - 14)], arrow=False, color=BOX)
    x = P[3].T(0.4)[0]
    s.line([(x, st2.b), (x, P[3].y)]); _lab(s, x - 6, 120, "жалоба, блокировка", "end")
    mod = Box(862, 8, 92, 46); dfd_entity(s, mod, "Модератор")
    x = P[3].T(0.95)[0]
    s.line([(x, mod.b), (x, P[3].y)], start_arrow=True); _lab(s, x + 6, 100, "решение")
    d22 = Box(600, 82, 110, 30); dfd_store(s, d22, "D2.2", "Сообщения")
    x = P[3].T(0.12)[0]
    s.line([(d22.r, d22.cy), (x, d22.cy), (x, P[3].y)])
    _chain(s, P[0], P[1], "аккаунт")
    _chain(s, P[1], P[2], "отметка")
    D11 = Box(160, 268, 320, 30); dfd_store(s, D11, "D1.1", "Пользователи")
    D12 = Box(490, 268, 95, 30); dfd_store(s, D12, "D1.2", "Анкеты")
    D13 = Box(595, 268, 90, 30); dfd_store(s, D13, "D1.3", "Фото")
    D14 = Box(705, 268, 95, 30); dfd_store(s, D14, "D1.4", "Жалобы")
    D15 = Box(810, 268, 120, 30); dfd_store(s, D15, "D1.5", "Блокировки")
    _store_link(s, P[0], 0.5, D11, "запись, статус")
    _store_link(s, P[1], 0.5, D11, "is_verified", "in")
    _store_link(s, P[2], 0.12, D12, "анкета, интересы", "in", lab_dx=-6)
    _store_link(s, P[2], 0.82, D13, "фото", "in")
    _store_link(s, P[3], 0.2, D14, "жалоба, решение", "both", lab_dx=-6)
    _store_link(s, P[3], 0.85, D15, "блокировка", "in")
    # решение модератора меняет статус в D1.1
    x = 805
    s.line([(x, P[3].b), (x, 318), (420, 318), (420, D11.b)]); _lab(s, 600, 314, "статус пользователя (решение модератора)", "middle")
    s.h = 330
    out = s.render()
    for t in ("анкета, интересы", "жалоба, решение"):
        out = out.replace(f">{t}<", f' text-anchor="end">{t}<', 1)
    return out


def dfd2():
    s = SVG(1000, 345, "Лента читает анкеты, блокировки и уже поставленные оценки; лимит лайков снимает Premium",
            "DFD · декомпозиция процесса 2 «Знакомства и встречи»")
    st = Box(14, 6, 116, 76); dfd_entity(s, st, "Студент")
    P = [Box(140 + 150 * i, 140, 120, 66) for i in range(5)]
    for b, n, nm in zip(P, ["21", "22", "23", "24", "25"], ["Формирование\nленты", "Лайки\nи совпадения", "Переписка",
                                                           "Согласование\nвстречи", "Мероприятия"]):
        dfd_process(s, b, n, nm, hl=(n == "22"))
    rows = [(76, "лента анкет", "out"), (62, "лайк / совпадение", "both"), (48, "сообщения, жалоба", "both"),
            (34, "предложение / ответ", "both"), (20, "заявка / билет, QR", "both")]
    for i, (y, t, mode) in enumerate(rows):
        x = P[i].T(0.5)[0]
        if mode == "out":
            s.line([(x, P[i].y), (x, y), (st.r, y)])
        else:
            s.line([(st.r, y), (x, y), (x, P[i].y)], start_arrow=True)
        _lab(s, st.r + 10, y - 4, t)
    team = Box(892, 110, 100, 46); dfd_entity(s, team, "Команда\nCAMPUS")
    part = Box(892, 186, 100, 46); dfd_entity(s, part, "Партнёр")
    s.line([(P[4].r, 150), (team.x, 150)], start_arrow=True); _lab(s, P[4].r + 4, 145, "событие")
    s.line([(P[4].r, 198), (part.x, 198)], start_arrow=True); _lab(s, P[4].r + 4, 193, "условия")
    _chain(s, P[0], P[1], "лента")
    _chain(s, P[1], P[2], "пара")
    _chain(s, P[2], P[3], "чат")
    D = [Box(130, 268, 115, 30), Box(250, 268, 115, 30), Box(370, 268, 100, 30), Box(475, 268, 105, 30),
         Box(585, 268, 95, 30), Box(690, 268, 190, 30)]
    for b, n, nm in zip(D, ["D1", "D2.1", "D3.2", "D2.2", "D2.3", "D2.4–6"],
                        ["Анкеты, блок.", "Лайки, пары", "Подписки", "Сообщения", "Встречи", "Мероприятия, билеты"]):
        dfd_store(s, b, n, nm)
    _store_link(s, P[0], 0.4, D[0], "анкеты", "out", lab_dx=-6)
    _store_link(s, P[0], 0.97, D[1], "оценки", "out")
    _store_link(s, P[1], 0.3, D[1], "лайк", "both", lab_dx=-6)
    _store_link(s, P[1], 0.85, D[2], "Premium", "out")
    _store_link(s, P[2], 0.5, D[3], "текст", "both")
    _store_link(s, P[3], 0.3, D[4], "встреча", "both")
    _store_link(s, P[4], 0.5, D[5], "бронь, вход", "both")
    s.h = 310
    out = s.render()
    for t in ("анкеты", "лайк"):
        out = out.replace(f">{t}<", f' text-anchor="end">{t}<', 1)
    return out


def dfd3():
    s = SVG(900, 345, "Платёж создаётся до оплаты, а подтверждается только уведомлением сервиса",
            "DFD · декомпозиция процесса 3 «Оплата и отчётность»")
    P = [Box(170 + 230 * i, 140, 150, 66) for i in range(3)]
    for b, n, nm in zip(P, ["31", "32", "33"], ["Создание\nплатежа", "Проверка\nоплаты", "Формирование\nотчётов"]):
        dfd_process(s, b, n, nm, hl=(n == "32"))
    st = Box(150, 20, 110, 50); dfd_entity(s, st, "Студент")
    ps = Box(330, 20, 150, 50); dfd_entity(s, ps, "Платёжный\nсервис")
    tm = Box(640, 20, 130, 50); dfd_entity(s, tm, "Команда\nCAMPUS")
    x = P[0].T(0.2)[0]
    s.line([(x, st.b), (x, P[0].y)], start_arrow=True); _lab(s, x - 6, 108, "покупка / ссылка", "end")
    x = P[0].T(0.85)[0]
    s.line([(x, P[0].y), (x, 100), (ps.x + 30, 100), (ps.x + 30, ps.b)]); _lab(s, x + 6, 96, "создать платёж")
    x = P[1].T(0.25)[0]
    s.line([(ps.x + 120, ps.b), (ps.x + 120, 100), (x, 100), (x, P[1].y)]); _lab(s, x + 6, 125, "уведомление (webhook)")
    x = P[2].T(0.5)[0]
    s.line([(x, P[2].y), (x, tm.b)]); _lab(s, x + 6, 108, "отчёты за период")
    s.line([(10, P[0].cy), (P[0].x, P[0].cy)]); _lab(s, 14, P[0].cy - 6, "заказ билета (из 2)")
    _chain(s, P[0], P[1], "платёж")
    _chain(s, P[1], P[2], "оплаченные")
    D = [Box(160, 268, 250, 30), Box(420, 268, 100, 30), Box(530, 268, 95, 30), Box(670, 268, 190, 30)]
    for b, n, nm in zip(D, ["D3.1", "D2.6", "D3.2", "D1–D2"], ["Платежи", "Билеты", "Подписки", "чтение"]):
        dfd_store(s, b, n, nm)
    _store_link(s, P[0], 0.5, D[0], "платёж", "in")
    _store_link(s, P[1], 0.05, D[0], "статус", "both", lab_dx=-6)
    _store_link(s, P[1], 0.5, D[1], "билет", "in")
    _store_link(s, P[1], 0.95, D[2], "Premium", "in")
    s.line([(380, 298), (380, 318), (650, 318), (650, P[2].b)]); _lab(s, 644, 240, "платежи", "end")
    _store_link(s, P[2], 0.7, D[3], "агрегаты", "out")
    s.h = 325
    return s.render().replace('>статус<', ' text-anchor="end">статус<', 1)


# ============================================================ IDEF3

U_W, U_H = 88, 56


def _u(s, x, y, name, num, hl=False):
    b = Box(x, y, U_W, U_H)
    uow(s, b, name, num, hl)
    return b


def _j(s, x, y, kind, label, side):
    return junction(s, x, y, kind, label, side)


def idef3_reg():
    s = SVG(820, 300, "Анкета публикуется только после проверки возраста и почты вуза",
            "IDEF3 · сценарий С1 «Регистрация и подтверждение» · блоки A11–A13")
    Y = 80
    jy = Y + U_H / 2 - 13 - 9
    u1 = _u(s, 8, Y, "Указать дату\nрождения", "1.1")
    j1 = _j(s, 112, jy, "X", "J1", "right")
    u3 = _u(s, 150, Y, "Ввести\nпочту вуза", "1.3")
    j2 = _j(s, 254, jy, "X", "J2", "left")
    u4 = _u(s, 292, Y, "Отправить\nкод", "1.4")
    u5 = _u(s, 396, Y, "Проверить\nкод", "1.5", hl=True)
    j3 = _j(s, 500, jy, "X", "J3", "right")
    j4 = _j(s, 536, jy, "&", "J4", "right")
    u6 = _u(s, 576, 14, "Загрузить\nфото", "1.6")
    u7 = _u(s, 576, 146, "Выбрать\nинтересы", "1.7")
    j5 = _j(s, 682, jy, "&", "J5", "left")
    u8 = _u(s, 720, Y, "Опубликовать\nанкету", "1.8")
    u2 = _u(s, 150, 214, "Отказать\n(младше 18)", "1.2")
    cy = Y + (U_H - 18) / 2
    s.line([(0, cy), (u1.x, cy)])
    for a, b in [(u1, j1), (j1, u3), (u3, j2), (j2, u4), (u4, u5), (u5, j3), (j3, j4), (j5, u8)]:
        s.line([(a.r, cy), (b.x, cy)])
    s.line([(j4.r, cy), (j4.r + 8, cy), (j4.r + 8, u6.y + 19), (u6.x, u6.y + 19)])
    s.line([(j4.r + 8, cy), (j4.r + 8, u7.y + 19), (u7.x, u7.y + 19)])
    s.line([(u6.r, u6.y + 19), (j5.x - 8, u6.y + 19), (j5.x - 8, cy), (j5.x, cy)])
    s.line([(u7.r, u7.y + 19), (j5.x - 8, u7.y + 19), (j5.x - 8, cy)], arrow=False)
    s.line([(u8.r, cy), (816, cy)])
    s.line([(j1.cx, j1.b), (j1.cx, u2.y + 19), (u2.x, u2.y + 19)])
    s.text(j1.cx - 4, u2.y + 12, "младше 18", size=9.5, anchor="end", fill=MUTED)
    s.line([(j3.cx, j3.b), (j3.cx, 196), (j2.cx, 196), (j2.cx, j2.b)])
    s.text(j3.cx - 6, 191, "код неверный: отправить заново (≤ 3 раз)", size=9.5, anchor="end", fill=MUTED)
    eb = Box(254, 238, 300, 40)
    elab(s, eb, "ELAB / Код живёт 10 минут; хранится только\nего хеш; после 3 ошибок — пауза 15 минут")
    s.line([(j3.r - 4, j3.b), (j3.r - 4, 258), (eb.r, 258)], arrow=False, dash="3 3", color=BOX)
    s.h = 290
    return s.render()


def idef3_like():
    s = SVG(820, 300, "Совпадение возникает только при взаимном лайке, иначе студент возвращается к ленте",
            "IDEF3 · сценарий С2 «Знакомство» · блоки A21–A24")
    Y = 96
    jy = Y + U_H / 2 - 13 - 9
    cy = Y + (U_H - 18) / 2
    j0 = _j(s, 6, jy, "X", "J0", "left")
    u1 = _u(s, 42, Y, "Показать\nанкету", "2.1")
    j1 = _j(s, 144, jy, "X", "J1", "right")
    u2 = _u(s, 180, Y, "Проверить\nлимит", "2.2")
    j2 = _j(s, 282, jy, "X", "J2", "right")
    u4 = _u(s, 318, Y, "Сохранить\nлайк", "2.4", hl=True)
    j3 = _j(s, 420, jy, "X", "J3", "right")
    u5 = _u(s, 456, Y, "Создать\nсовпадение", "2.5")
    j4 = _j(s, 558, jy, "&", "J4", "right")
    u6 = _u(s, 596, 30, "Уведомить\nобоих", "2.6")
    u7 = _u(s, 596, 162, "Открыть\nчат", "2.7")
    j5 = _j(s, 702, jy, "&", "J5", "left")
    u8 = _u(s, 738, Y, "Предложить\nвстречу", "2.8")
    u3 = _u(s, 180, 222, "Предложить\nPremium", "2.3")
    for a, b in [(j0, u1), (u1, j1), (j1, u2), (u2, j2), (j2, u4), (u4, j3), (j3, u5), (u5, j4), (j5, u8)]:
        s.line([(a.r, cy), (b.x, cy)])
    s.line([(j4.r, cy), (j4.r + 8, cy), (j4.r + 8, u6.y + 19), (u6.x, u6.y + 19)])
    s.line([(j4.r + 8, cy), (j4.r + 8, u7.y + 19), (u7.x, u7.y + 19)])
    s.line([(u6.r, u6.y + 19), (j5.x - 8, u6.y + 19), (j5.x - 8, cy), (j5.x, cy)])
    s.line([(u7.r, u7.y + 19), (j5.x - 8, u7.y + 19), (j5.x - 8, cy)], arrow=False)
    s.line([(j1.cx, j1.y), (j1.cx, 62), (j0.cx, 62)], arrow=False)
    s.line([(j3.cx, j3.y), (j3.cx, 40), (j0.cx, 40), (j0.cx, j0.y)])
    s.dot(j0.cx, 62)
    s.text(j1.cx - 6, 57, "пропустить", size=9.5, anchor="end", fill=MUTED)
    s.text(j3.cx - 6, 35, "нет ответного лайка → следующая анкета", size=9.5, anchor="end", fill=MUTED)
    s.line([(j2.cx, j2.b), (j2.cx, u3.y + 19), (u3.r, u3.y + 19)])
    s.text(j2.cx + 6, u3.y + 12, "лимит исчерпан", size=9.5, fill=MUTED)
    eb = Box(440, 238, 300, 40)
    elab(s, eb, "ELAB / Бесплатно — 30 лайков в сутки;\nс Premium лимита нет (статус из D3.2)")
    s.line([(j2.r - 4, j2.b), (j2.r - 4, 258), (440, 258)], arrow=False, dash="3 3", color=BOX)
    s.h = 290
    return s.render()


def idef3_pay():
    s = SVG(820, 300, "Билет подтверждается только после уведомления платёжного сервиса",
            "IDEF3 · сценарий С5 «Покупка билета» · блоки A253, A31, A32")
    Y = 96
    jy = Y + U_H / 2 - 13 - 9
    cy = Y + (U_H - 18) / 2
    u1 = _u(s, 8, Y, "Записаться\nна событие", "5.1")
    j1 = _j(s, 110, jy, "X", "J1", "right")
    u3 = _u(s, 146, Y, "Забронировать\nместо", "5.3")
    u4 = _u(s, 248, Y, "Создать\nплатёж", "5.4")
    j0 = _j(s, 350, jy, "X", "J2", "left")
    u5 = _u(s, 386, Y, "Оплатить", "5.5")
    j2 = _j(s, 488, jy, "X", "J3", "right")
    u6 = _u(s, 532, Y, "Проверить\nуведомление", "5.6", hl=True)
    u7 = _u(s, 634, Y, "Подтвердить\nбилет", "5.7")
    u2 = _u(s, 146, 222, "Сообщить\n«мест нет»", "5.2")
    u9 = _u(s, 532, 222, "Снять\nбронь", "5.8")
    s.line([(0, cy), (u1.x, cy)])
    for a, b in [(u1, j1), (j1, u3), (u3, u4), (u4, j0), (j0, u5), (u5, j2), (j2, u6), (u6, u7)]:
        s.line([(a.r, cy), (b.x, cy)])
    s.line([(u7.r, cy), (816, cy)])
    s.line([(j1.cx, j1.b), (j1.cx, u2.y + 19), (u2.x, u2.y + 19)])
    s.text(j1.cx - 4, u2.y + 12, "мест нет", size=9.5, anchor="end", fill=MUTED)
    s.line([(j2.cx, j2.b), (j2.cx, u9.y + 19), (u9.x, u9.y + 19)])
    s.text(j2.cx - 4, u9.y + 12, "30 минут без оплаты", size=9.5, anchor="end", fill=MUTED)
    s.line([(j2.cx, j2.y), (j2.cx, 50), (j0.cx, 50), (j0.cx, j0.y)])
    s.text(j2.cx - 6, 45, "ошибка оплаты: повторить", size=9.5, anchor="end", fill=MUTED)
    eb = Box(640, 190, 175, 66)
    elab(s, eb, "ELAB / Повторное уведомле-\nние с тем же id платежа\nне создаёт второй билет\n(ключ идемпотентности)")
    s.line([(u6.r, u6.b - 4), (640, 200)], arrow=False, dash="3 3", color=BOX)
    s.h = 290
    return s.render()


# ============================================================ UML: варианты использования

def usecases():
    s = SVG(960, 600, "Студент — главный актёр; оплата всегда включает проверку платёжным сервисом",
            "UML 2.5 · диаграмма вариантов использования")
    s.rect(160, 8, 650, 556, fill="none", stroke="#b3ada3", rx=4)
    s.text(172, 26, "Сервис CAMPUS", size=11, weight=700)
    L = 300
    left = [("Войти по почте вуза", 60), ("Подтвердить\nстатус студента", 112), ("Заполнить анкету", 164),
            ("Смотреть ленту\nи ставить лайки", 226), ("Переписываться", 296), ("Пожаловаться\nили заблокировать", 352),
            ("Записаться\nна мероприятие", 420), ("Купить Premium", 494)]
    for name, y in left:
        usecase(s, L, y, name, rx=78, ry=22, hl=name.startswith("Смотреть"))
    # студент
    actor(s, 70, 250, "Студент")
    for name, y in left:
        s.line([(84, 278), (L - 78, y)], arrow=False, color="#b3ada3")
    M = 520
    usecase(s, M, 226, "Проверить\nлимит лайков", rx=70, ry=22)
    usecase(s, M, 296, "Предложить встречу", rx=70, ry=22)
    usecase(s, M, 457, "Оплатить", rx=62, ry=20, hl=True)
    R = 712
    usecase(s, R, 70, "Снять неоплаченные\nброни", rx=82, ry=22)
    usecase(s, R, 170, "Рассмотреть жалобу", rx=82, ry=22)
    usecase(s, R, 240, "Заблокировать\nпользователя", rx=82, ry=22)
    usecase(s, R, 340, "Опубликовать\nмероприятие", rx=82, ry=22)
    usecase(s, R, 410, "Отметить вход\nпо QR-билету", rx=82, ry=22)
    usecase(s, R, 480, "Посмотреть отчёты", rx=82, ry=22)

    def dep(p, q, t):
        s.line([p, q], dash="5 4", open_head=True)
        s.text((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 5, t, size=9, anchor="middle", fill=MUTED)

    dep((L + 78, 226), (M - 70, 226), "«include»")
    dep((M - 70, 296), (L + 78, 296), "«extend»")
    dep((L + 70, 430), (M - 50, 446), "«include»")
    dep((L + 72, 490), (M - 52, 468), "«include»")
    dep((R, 218), (R, 192), "«extend»")
    # актёры справа
    actor(s, 890, 52, "Таймер", label_pos="below")
    s.line([(878, 72), (R + 82, 70)], arrow=False, color="#b3ada3")
    actor(s, 890, 170, "Модератор")
    s.line([(878, 190), (R + 82, 170)], arrow=False, color="#b3ada3")
    actor(s, 890, 390, "Команда\nCAMPUS")
    for y in (340, 410, 480):
        s.line([(878, 410), (R + 82, y)], arrow=False, color="#b3ada3")
    actor(s, M, 580, "", label_pos="none")
    s.text(M + 18, 606, "Платёжный сервис", size=10.5, weight=700)
    s.line([(M, 477), (M, 573)], arrow=False, color="#b3ada3")
    s.h = 628
    return s.render()


# ============================================================ UML: последовательности

def seq_like():
    parts = ["Студент", ":Клиент", "*:API знакомств", ":Лимиты", ":БД", ":Уведомления"]
    msgs = [
        (0, 1, "лайк", "call"),
        (1, 2, "POST /likes {to}", "call"),
        (2, 3, "canLike(user)", "call"),
        (3, 2, "true (осталось 12)", "ret"),
        (2, 4, "INSERT лайк", "call"),
        (2, 4, "SELECT встречный лайк", "call"),
        (4, 2, "найден / не найден", "ret"),
        (2, 4, "INSERT совпадение", "call"),
        (2, 5, "notify(оба участника)", "call"),
        (2, 1, "200 {match: true}", "ret"),
        (2, 1, "200 {match: false}", "ret"),
    ]
    frames = [("alt", "[встречный лайк найден]", 7, 10, 10, "[не найден]")]
    s = sequence("Совпадение создаётся в той же транзакции, где найден встречный лайк",
                 "UML 2.5 · диаграмма последовательности · сценарий С2, блок A22", parts, msgs, frames, w=820)
    return s.render()


def seq_verify():
    parts = ["Студент", ":Клиент", "*:API пользователей", ":Redis (коды)", ":Почта (SMTP)", ":БД"]
    msgs = [
        (0, 1, "почта вуза", "call"),
        (1, 2, "POST /auth/email/request", "call"),
        (2, 2, "домен вуза?", "self"),
        (2, 3, "SET хеш кода, TTL 10 мин", "call"),
        (2, 4, "отправить код", "call"),
        (2, 1, "202 {sent: true}", "ret"),
        (0, 1, "ввод кода", "call"),
        (1, 2, "POST /auth/email/verify", "call"),
        (2, 3, "GET хеш, INCR попытки", "call"),
        (3, 2, "хеш, попытка 1 из 3", "ret"),
        (2, 5, "INSERT / UPDATE users: is_verified", "call"),
        (2, 1, "200 {accessToken}", "ret"),
        (2, 1, "422 «неверный код», осталось 2", "ret"),
    ]
    frames = [("alt", "[код совпал и не истёк]", 10, 12, 12, "[неверный или истёк]")]
    s = sequence("Вход и отметка «студент» — по одному одноразовому коду из письма",
                 "UML 2.5 · диаграмма последовательности · сценарий С1, блоки A11 и A12", parts, msgs, frames, w=820)
    return s.render()


def seq_pay():
    parts = ["Студент", ":Клиент", ":API мероприятий", "*:API оплаты", ":Платёжный сервис", ":БД"]
    msgs = [
        (0, 1, "«Забронировать место»", "call"),
        (1, 2, "POST /events/:id/tickets", "call"),
        (2, 5, "INSERT билет: бронь до +30 мин", "call"),
        (2, 1, "201 бронь", "ret"),
        (0, 1, "«Перейти к оплате»", "call"),
        (1, 3, "POST /payments + Idempotency-Key", "call"),
        (3, 5, "INSERT платёж «ожидает»", "call"),
        (3, 4, "создать платёж", "call"),
        (4, 3, "ссылка на оплату", "ret"),
        (3, 1, "201 + ссылка", "ret"),
        (0, 4, "оплата по ссылке", "call"),
        (4, 3, "POST /payments/webhook", "call"),
        (3, 5, "UPDATE платёж и билет = оплачен", "call"),
        (3, 5, "UPDATE платёж = ошибка", "call"),
        (3, 4, "200 OK", "ret"),
    ]
    frames = [("alt", "[успех и платёж ещё не обработан]", 12, 13, 13, "[ошибка оплаты]")]
    s = sequence("Статус билета меняется только по уведомлению платёжного сервиса",
                 "UML 2.5 · диаграмма последовательности · сценарий С5, блоки A253 и A32", parts, msgs, frames,
                 w=820)
    return s.render()
