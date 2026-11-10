"""Все диаграммы модели CAMPUS. Каждая функция возвращает SVG-строку."""
from svglib import *  # noqa: F401,F403
from svglib import (SVG, Box, idef0_box, staircase, stub_top, stub_bottom, link, dfd_process, dfd_entity,
                    dfd_store, uow, junction, elab, actor, usecase, class_box, sequence, MUTED, TEXT, BOX,
                    HL_FILL, HL_STROKE, LINE, tw)


# ============================================================ Дерево задач
TREE = [
    ("1", "Работа с пользователями", "блок A1", [
        ("11", "Регистрация и вход", "D1.1"),
        ("12", "Подтверждение\nстатуса студента", "D1.1"),
        ("13", "Заполнение анкеты", "D1.2"),
    ]),
    ("2", "Подбор и знакомства", "блок A2", [
        ("21", "Формирование ленты", "чтение D1.2"),
        ("22", "Лайки и совпадения", "D2.1"),
        ("23", "Переписка", "D2.2"),
        ("24", "Согласование встречи", "D2.3"),
    ]),
    ("3", "Безопасность\nи модерация", "блок A3", [
        ("31", "Приём жалоб", "D3"),
        ("32", "Рассмотрение жалобы", "D3"),
        ("33", "Применение решения", "D1.1"),
    ]),
    ("4", "Мероприятия", "блок A4", [
        ("41", "Согласование\nс партнёром", "D4.1"),
        ("42", "Публикация\nмероприятия", "D4.2"),
        ("43", "Запись участников", "D4.3"),
    ]),
    ("5", "Оплата\nи отчётность", "блок A5", [
        ("51", "Создание платежа", "D5.1"),
        ("52", "Проверка оплаты", "D5.1, D4.3, D5.2"),
        ("53", "Формирование\nотчётов", "чтение D1–D5"),
    ]),
]


def tree():
    W = 900
    s = SVG(W, 420, "Пять ветвей деятельности совпадают с блоками A1–A5 модели IDEF0",
            "Дерево задач: 0 — деятельность сервиса → 1…5 — ветви → 11…53 — листья (у каждого листа своё хранилище)")
    root = Box(300, 6, 300, 48)
    s.rect(root.x, root.y, root.w, root.h, fill=HL_FILL, stroke=HL_STROKE, sw=1.6, rx=6)
    s.text(root.cx, root.y + 21, "0. Сервис знакомств CAMPUS", size=13, weight=700, anchor="middle")
    s.text(root.cx, root.y + 37, "знакомства и совместные активности студентов", size=10, anchor="middle", fill=MUTED)
    colw, gap = 172, 10
    x0 = (W - (5 * colw + 4 * gap)) / 2
    ybr = 92
    s.line([(root.cx, root.b), (root.cx, 74)], arrow=False, color=BOX)
    s.line([(x0 + colw / 2, 74), (x0 + 4 * (colw + gap) + colw / 2, 74)], arrow=False, color=BOX)
    for i, (num, name, blk, leaves) in enumerate(TREE):
        bx = x0 + i * (colw + gap)
        br = Box(bx, ybr, colw, 50)
        s.line([(br.cx, 74), (br.cx, ybr)], arrow=False, color=BOX)
        s.rect(br.x, br.y, br.w, br.h, stroke="#a8a297", sw=1.2, rx=5)
        nm = f"{num}. {name}"
        lines = nm.split("\n")
        if len(lines) == 1:
            s.text(br.cx, br.y + 22, nm, size=11.5, weight=700, anchor="middle")
        else:
            s.text(br.cx, br.y + 17, lines[0], size=11.5, weight=700, anchor="middle")
            s.text(br.cx, br.y + 31, lines[1], size=11.5, weight=700, anchor="middle")
        s.text(br.cx, br.b - 6, blk, size=9.5, anchor="middle", fill=MUTED)
        ly = br.b + 14
        xl = bx + 12
        last_mid = None
        for code, lname, store in leaves:
            nl = lname.count("\n") + 1
            h = 22 + 13 * nl
            lb = Box(bx + 22, ly, colw - 22, h)
            s.rect(lb.x, lb.y, lb.w, lb.h, stroke=BOX, rx=4)
            first = f"{code} " + lname.split("\n")[0]
            s.text(lb.x + 7, lb.y + 15, first, size=10.5, weight=600)
            if nl > 1:
                s.text(lb.x + 23, lb.y + 28, lname.split("\n")[1], size=10.5, weight=600)
            s.text(lb.x + 7, lb.b - 7, "→ " + store, size=9, fill=MUTED)
            s.line([(xl, lb.cy), (lb.x, lb.cy)], arrow=False, color=BOX)
            last_mid = lb.cy
            ly = lb.b + 9
        s.line([(xl, br.b), (xl, last_mid)], arrow=False, color=BOX)
    s.h = 372
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
    s.text(720, 296, "M3 Сервер приложения (Mini App, API, БД)", size=11, anchor="middle")
    s.line([(720, 282), (720, 248), (515, 248), (515, b.b)])
    s.h = 304
    return s.render()


# ============================================================ IDEF0 A0

def a0():
    s = SVG(1000, 600, "Решения модерации и статус оплаты возвращаются в предыдущие блоки",
            "IDEF0 · декомпозиция A0 на пять функций, две петли обратной связи (A3 → A1, A2 и A5 → A2, A4)")
    names = ["Управлять\nпользователями", "Организовать\nзнакомства", "Обеспечивать\nбезопасность",
             "Проводить\nмероприятия", "Принимать\nи проверять оплату"]
    B = staircase(5, 120, 70, 150, 100, 128, 64)
    for i, b in enumerate(B):
        idef0_box(s, b, names[i], f"A{i + 1}", hl=(i == 4))
    # входы с границы
    s.line([(10, B[0].L(0.5)[1]), B[0].L(0.5)]); s.text(14, B[0].L(0.5)[1] - 5, "I1 Данные студента", size=10.5)
    yI2 = B[1].L(0.7)[1]
    s.line([(10, yI2), B[1].L(0.7)]); s.text(14, yI2 - 5, "I2 Действия студентов", size=10.5)
    y4 = B[3].L(0.72)[1]; y5 = B[4].L(0.55)[1]
    s.dot(40, yI2)
    s.line([(40, yI2), (40, y5), B[4].L(0.55)])
    s.dot(40, y4)
    s.line([(40, y4), B[3].L(0.72)])
    s.text(B[3].x - 8, y4 - 5, "заявки на участие", size=10, anchor="end", fill=MUTED)
    s.text(B[4].x - 8, y5 - 5, "покупка Premium", size=10, anchor="end", fill=MUTED)
    y3 = B[3].L(0.32)[1]
    s.line([(60, y3), B[3].L(0.32)]); s.text(64, y3 - 5, "I3 Предложения партнёров", size=10.5)
    y6 = B[4].L(0.85)[1]
    s.line([(60, y6), B[4].L(0.85)]); s.text(64, y6 - 5, "I4 Уведомления платёжного сервиса", size=10.5)
    yt = B[4].L(0.7)[1]
    s.line([(560, yt), B[4].L(0.7)])
    s.text(554, yt + 3.5, "(сводные данные A1–A4 из хранилищ D1–D4)", size=9.5, anchor="end", fill=MUTED)
    # связи между блоками
    link(s, B[0], B[1], "Анкета, статус", fb=0.3)
    link(s, B[1], B[2], "Жалобы", fa=0.55, fb=0.5)
    link(s, B[3], B[4], "Заказ билета", fa=0.5, fb=0.25)
    # управление с границы
    stub_top(s, B[0], 0.22, "C1"); stub_top(s, B[0], 0.47, "C2")
    stub_top(s, B[1], 0.2, "C1")
    stub_top(s, B[2], 0.3, "C1"); stub_top(s, B[2], 0.6, "C2")
    stub_top(s, B[3], 0.3, "C1")
    stub_top(s, B[4], 0.35, "C3"); stub_top(s, B[4], 0.65, "C2")
    # механизмы
    stub_bottom(s, B[0], 0.3, "M3"); stub_bottom(s, B[1], 0.3, "M3")
    stub_bottom(s, B[2], 0.25, "M1"); stub_bottom(s, B[2], 0.5, "M3")
    stub_bottom(s, B[3], 0.2, "M2"); stub_bottom(s, B[3], 0.42, "M3")
    stub_bottom(s, B[4], 0.3, "M3")
    # выходы на границу
    for bi, f, t in [(1, 0.22, "O1 Совпадения, переписка, встречи"), (2, 0.78, "O3 Уведомления о решении"),
                     (3, 0.2, "O2 Мероприятия и билеты"), (4, 0.6, "O3 Уведомления об оплате"), (4, 0.85, "O4 Отчёты")]:
        x, y = B[bi].R(f)
        s.line([(x, y), (990, y)])
        s.text(985, y - 5, t, size=10.5, anchor="end")
    # петля: решение модерации A3 -> A1, A2
    x, y = B[2].R(0.3)
    lane = 575
    yA1 = 26; yA2 = 138
    s.line([(x, y), (lane, y), (lane, yA1), (B[0].T(0.8)[0], yA1), B[0].T(0.8)])
    s.dot(lane, yA2)
    s.line([(lane, yA2), (B[1].T(0.5)[0], yA2), B[1].T(0.5)])
    s.text(B[0].T(0.8)[0] + 8, yA1 - 5, "Решение модерации (статус пользователя)", size=10, fill=MUTED)
    # петля: статус оплаты A5 -> A4, A2
    x, y = B[4].R(0.3)
    lane2 = 880
    yA2b = 150
    yA4 = 338
    s.line([(x, y), (lane2, y), (lane2, yA2b), (B[1].T(0.82)[0], yA2b), B[1].T(0.82)])
    s.dot(lane2, yA4)
    s.line([(lane2, yA4), (B[3].T(0.72)[0], yA4), B[3].T(0.72)])
    s.text(lane2 - 6, yA2b - 5, "Статус оплаты (Premium)", size=10, anchor="end", fill=MUTED)
    s.text(lane2 - 6, yA4 - 5, "Статус оплаты (билет)", size=10, anchor="end", fill=MUTED)
    s.h = 575
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
    title="Студент попадает в ленту только после подтверждения статуса и заполнения анкеты",
    sub="IDEF0 · декомпозиция A1 «Управлять пользователями»", H=395,
    blocks=[("Зарегистрировать\nи авторизовать", "A11", False), ("Подтвердить\nстатус студента", "A12", True),
            ("Заполнить\nанкету", "A13", False)],
    links=[(0, 1, "Учётная запись", 0.5, 0.3), (1, 2, "Отметка «студент»", 0.5, 0.3)],
    ins=[("I1 Данные студента", [(0, 0.5), (1, 0.75, "почта вуза, код"), (2, 0.75, "фото, интересы, цель")], 10)],
    ctrl={0: [(0.3, "C1"), (0.55, "C2"), (0.8, "C3")], 1: [(0.55, "C2")], 2: [(0.55, "C1")]},
    mech={0: [(0.3, "M1")], 1: [(0.3, "M1")], 2: [(0.3, "M1")]},
    outs=[(0, 0.2, "O2 Статус пользователя"), (2, 0.4, "O1 Анкета")],
)

A2 = dict(
    title="Лента учитывает уже оценённые анкеты, а чат открывается только после совпадения",
    sub="IDEF0 · декомпозиция A2 «Организовать знакомства»", H=500, W=960,
    geo=dict(x0=170, dx=150, y0=78),
    blocks=[("Сформировать\nленту", "A21", False), ("Обработать\nлайки", "A22", True),
            ("Вести\nпереписку", "A23", False), ("Согласовать\nвстречу", "A24", False)],
    links=[(0, 1, "Лента анкет", 0.5, 0.3), (1, 2, "Совпадение", 0.5, 0.3), (2, 3, "Переписка", 0.5, 0.3)],
    ins=[("I1 Анкеты (из A1)", [(0, 0.5)], 10),
         ("I2 Действия студента", [(1, 0.75), (2, 0.75, "сообщение"), (3, 0.75, "предложение встречи")], 10)],
    ctrl={0: [(0.2, "C1"), (0.45, "C2")], 1: [(0.3, "C1"), (0.6, "C3")], 2: [(0.5, "C1")], 3: [(0.5, "C1")]},
    mech={i: [(0.3, "M1")] for i in range(4)},
    outs=[(2, 0.2, "O2 Жалобы (в A3)"), (3, 0.4, "O1 Совпадения, переписка, встречи")],
    fb=[(1, 0.12, 0, 0.75, "Оценённые анкеты (не показывать повторно)", 30)],
)

A3 = dict(
    title="Решение по жалобе принимает модератор, система только скрывает анкету до проверки",
    sub="IDEF0 · декомпозиция A3 «Обеспечивать безопасность»", H=395,
    blocks=[("Принять\nжалобу", "A31", False), ("Рассмотреть\nжалобу", "A32", True),
            ("Применить\nрешение", "A33", False)],
    links=[(0, 1, "Жалоба в очереди", 0.5, 0.3), (1, 2, "Решение", 0.5, 0.3)],
    ins=[("I1 Жалобы (из A2)", [(0, 0.5)], 10)],
    ctrl={0: [(0.55, "C1")], 1: [(0.4, "C1"), (0.7, "C2")], 2: [(0.55, "C1")]},
    mech={0: [(0.3, "M2")], 1: [(0.3, "M1")], 2: [(0.3, "M2")]},
    outs=[(0, 0.2, "O1 Скрытие анкеты (≥ 3 жалоб)"), (2, 0.35, "O1 Решение модерации (в A1, A2)"),
          (2, 0.7, "O2 Уведомления участникам")],
)

A4 = dict(
    title="Место в списке участников закрепляется только после подтверждения оплаты",
    sub="IDEF0 · декомпозиция A4 «Проводить мероприятия»", H=395,
    blocks=[("Согласовать\nс партнёром", "A41", False), ("Опубликовать\nмероприятие", "A42", False),
            ("Записать\nучастников", "A43", True)],
    links=[(0, 1, "Условия площадки", 0.5, 0.3), (1, 2, "Мероприятие", 0.5, 0.3)],
    ins=[("I1 Предложения партнёров", [(0, 0.5)], 10), ("I2 Заявки студентов", [(2, 0.75)], 10)],
    ctrl={0: [(0.55, "C1")], 1: [(0.55, "C1")], 2: [(0.35, "C1"), (0.7, "C2")]},
    mech={0: [(0.3, "M1")], 1: [(0.25, "M1"), (0.5, "M2")], 2: [(0.3, "M2")]},
    outs=[(1, 0.2, "O2 Афиша мероприятий"), (2, 0.3, "O1 Заказ билета (в A5)"),
          (2, 0.7, "O2 Билеты и списки участников")],
)

A5 = dict(
    title="Только подтверждённая платёжным сервисом оплата меняет статус билета и Premium",
    sub="IDEF0 · декомпозиция A5 «Принимать и проверять оплату»", H=395,
    blocks=[("Создать\nплатёж", "A51", False), ("Проверить\nоплату", "A52", True),
            ("Сформировать\nотчёты", "A53", False)],
    geo=dict(bh=70),
    links=[(0, 1, "Платёж «ожидает»", 0.5, 0.3), (1, 2, "Оплаченные платежи", 0.72, 0.3)],
    ins=[("I1 Заказ билета (из A4)", [(0, 0.35)], 10), ("I2 Покупка Premium", [(0, 0.7)], 10),
         ("I3 Уведомление платёжного сервиса", [(1, 0.75)], 10),
         ("(I4 Сводные данные из D1–D4)", [(2, 0.75)], 10)],
    ctrl={0: [(0.3, "C1")], 1: [(0.3, "C1")], 2: [(0.55, "C2")]},
    mech={0: [(0.3, "M1")], 1: [(0.3, "M1")], 2: [(0.3, "M1")]},
    outs=[(1, 0.18, "O1 Статус оплаты (в A2, A4)"), (1, 0.45, "O2 Уведомления об оплате"),
          (2, 0.4, "O3 Отчёты")],
    fb=[(1, 0.05, 0, 0.75, "Ошибка оплаты: повторить", 30)],
)


def a1(): return decomp(A1)
def a2(): return decomp(A2)
def a3(): return decomp(A3)
def a4(): return decomp(A4)
def a5(): return decomp(A5)


# ============================================================ IDEF1X / UML-классы
# (имя IDEF1X, имя класса UML, PK, атрибуты IDEF1X, атрибуты UML, зависимая, подсветка)
ENT = {
    "INT": ("ИНТЕРЕС", "Интерес", ["interest_id"], ["name"], ["+название: String"], False, False),
    "PI": ("АНКЕТА_ИНТЕРЕС", None, ["user_id (FK)", "interest_id (FK)"], [], None, True, False),
    "PRO": ("АНКЕТА", "Анкета", ["user_id (FK)"],
            ["name", "university", "institute", "goal", "about", "hide_from_institute"],
            ["+имя: String", "+вуз: String", "+институт: String", "+цель: Цель",
             "+скрытьОтИнститута: Boolean"], True, False),
    "PH": ("ФОТО", "Фото", ["photo_id"], ["user_id (FK)", "storage_key", "position"],
           ["+ключХранилища: String", "+порядок: int"], False, False),
    "REP": ("ЖАЛОБА", "Жалоба", ["report_id"],
            ["author_id (FK)", "target_id (FK)", "moderator_id (FK)", "reason", "status", "decision", "created_at"],
            ["+причина: String", "+статус: Новая | Скрыта | Закрыта", "+решение: Решение", "+создана: DateTime"],
            False, False),
    "LIKE": ("ЛАЙК", "Лайк", ["from_user_id (FK)", "to_user_id (FK)"], ["is_like", "created_at"],
             ["+нравится: Boolean", "+создан: DateTime"], True, False),
    "USER": ("ПОЛЬЗОВАТЕЛЬ", "Пользователь", ["user_id"], ["telegram_id", "birth_date", "university_email",
                                                          "is_verified", "role", "status", "created_at"],
             ["+telegramId: long", "+датаРождения: Date", "+почтаВуза: String", "+подтверждён: Boolean",
              "+роль: Студент | Модератор | Админ",
              "+статус: Активен | Скрыт | Блок"], False, True),
    "PAY": ("ПЛАТЁЖ", "Платёж", ["payment_id"],
            ["user_id (FK)", "kind", "amount", "status", "provider_payment_id", "idempotency_key", "paid_at"],
            ["+вид: Билет | Premium", "+сумма: Money", "+статус: Ожидает | Оплачен | Ошибка",
             "+ключИдемпотентности: String"], False, True),
    "MSG": ("СООБЩЕНИЕ", "Сообщение", ["message_id"], ["match_id (FK)", "sender_id (FK)", "text", "sent_at"],
            ["+текст: String", "+отправлено: DateTime"], False, False),
    "MATCH": ("СОВПАДЕНИЕ", "Совпадение", ["match_id"], ["user_a_id (FK)", "user_b_id (FK)", "created_at"],
              ["+создано: DateTime"], False, False),
    "TICK": ("БИЛЕТ", "Билет", ["event_id (FK)", "user_id (FK)"], ["payment_id (FK)", "status", "reserved_until"],
             ["+статус: Бронь | Оплачен | Снят", "+броньДо: DateTime"], True, False),
    "SUB": ("ПОДПИСКА", "ПодпискаPremium", ["subscription_id"], ["payment_id (FK)", "starts_at", "ends_at"],
            ["+начало: Date", "+окончание: Date"], False, False),
    "MEET": ("ВСТРЕЧА", "Встреча", ["meeting_id"],
             ["match_id (FK)", "proposer_id (FK)", "place", "meet_at", "status"],
             ["+место: String", "+время: DateTime", "+статус: СтатусВстречи"], False, False),
    "EV": ("МЕРОПРИЯТИЕ", "Мероприятие", ["event_id"], ["partner_id (FK)", "title", "starts_at", "capacity", "price"],
           ["+название: String", "+начало: DateTime", "+вместимость: int", "+цена: Money"], False, False),
    "PART": ("ПАРТНЁР", "Партнёр", ["partner_id"], ["name", "address", "terms"],
             ["+название: String", "+адрес: String", "+условия: String"], False, False),
}

GRID = [["INT", "PI", "PRO", "PH"], ["REP", "LIKE", "USER", "PAY"], ["MSG", "MATCH", "TICK", "SUB"],
        [None, "MEET", "EV", "PART"]]


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
        s = SVG(950, H - 40, "Пользователь — центральный класс: от него зависят анкета, знакомства и оплаты",
                "UML 2.5 · диаграмма классов предметной области")
    else:
        s = SVG(950, H - 40, "Все знакомства и оплаты сходятся на сущности ПОЛЬЗОВАТЕЛЬ",
                "IDEF1X · логическая модель данных (уровень ключей), 15 сущностей → 15 таблиц PostgreSQL")
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
        lx, ly = 22, g("MEET").y + 4
        for i, t in enumerate(["Над чертой — первичный ключ", "(FK) — внешний ключ",
                               "Сплошная линия — идентифицирующая связь", "Пунктир — неидентифицирующая",
                               "● — сторона «много»", "Скруглённые углы — зависимые сущности"]):
            s.text(lx, ly + i * 15, t, size=10, fill=MUTED)
    else:
        lx, ly = 22, g("MEET").y + 4
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
    s = SVG(960, 545, "Студент работает со всеми процессами, а данные между ними передаются через хранилища",
            "DFD · процессы первого уровня (нотация Гейна–Сарсона), хранилища показаны укрупнённо")
    st = Box(20, 215, 110, 60)
    dfd_entity(s, st, "Студент")
    names = ["Управление\nпользователями", "Подбор\nи знакомства", "Безопасность\nи модерация", "Мероприятия",
             "Оплата\nи отчётность"]
    P = [Box(270, 20 + 110 * i, 150, 64) for i in range(5)]
    for i, b in enumerate(P):
        dfd_process(s, b, str(i + 1), names[i], hl=(i == 1))
    snames = ["Пользователи и анкеты", "Знакомства", "Жалобы", "Мероприятия и билеты", "Платежи и подписки"]
    D = [Box(500, 37 + 110 * i, 210, 30) for i in range(5)]
    for i, b in enumerate(D):
        dfd_store(s, b, f"D{i + 1}", snames[i])
    mod = Box(800, 225, 130, 50); dfd_entity(s, mod, "Модератор")
    team = Box(800, 330, 130, 50); dfd_entity(s, team, "Команда CAMPUS")
    part = Box(800, 392, 130, 46); dfd_entity(s, part, "Партнёр")
    pay = Box(800, 490, 130, 50); dfd_entity(s, pay, "Платёжный\nсервис")
    # студент
    s.line([(130, 222), (150, 222), (150, 52), (270, 52)]); _lab(s, 158, 47, "данные, анкета")
    s.line([(130, 234), (170, 234), (170, 162), (270, 162)], start_arrow=True); _lab(s, 178, 157, "лайки / лента, чат")
    s.line([(130, 246), (270, 246)], start_arrow=True); _lab(s, 178, 241, "жалоба / решение")
    s.line([(130, 258), (170, 258), (170, 382), (270, 382)], start_arrow=True); _lab(s, 178, 377, "заявка / билет")
    s.line([(130, 270), (150, 270), (150, 492), (270, 492)], start_arrow=True); _lab(s, 158, 487, "оплата Premium")
    # процесс <-> хранилище
    for i, t in enumerate(["запись", "лайки, чат", "жалобы", "брони", "платежи"]):
        y = P[i].cy
        s.line([(P[i].r, y), (D[i].x, y)], start_arrow=True)
        _lab(s, 460, y - 5, t, "middle")
    s.line([(520, 67), (520, 100), (400, 100), (400, 130)]); _lab(s, 528, 96, "анкеты")
    # статус пользователя P3 -> D1
    s.line([(420, 242), (735, 242), (735, 52), (D[0].r, 52)]); _lab(s, 440, 237, "статус пользователя")
    s.line([(420, 250), (800, 250)], start_arrow=True); _lab(s, 795, 245, "жалоба / решение", "end")
    # мероприятия
    s.line([(800, 357.5), (420, 357.5)]); _lab(s, 795, 352, "мероприятие", "end")
    s.line([(420, 407.6), (800, 407.6)], start_arrow=True); _lab(s, 795, 402, "условия / участники", "end")
    s.line([(315, 414), (315, 460)]); _lab(s, 309, 441, "заказ билета", "end")
    s.line([(375, 460), (375, 414)]); _lab(s, 381, 441, "статус оплаты")
    # оплата
    s.line([(420, 465), (945, 465), (945, 355), (team.r, 355)]); _lab(s, 795, 460, "отчёты", "end")
    s.line([(420, 516), (800, 516)], start_arrow=True); _lab(s, 795, 511, "платёж / уведомление", "end")
    s.h = 545
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
    s = SVG(900, 330, "Отметка «студент» ставится в той же записи пользователя, что и вход",
            "DFD · декомпозиция процесса 1 «Управление пользователями»")
    st = Box(20, 8, 130, 56); dfd_entity(s, st, "Студент")
    tg = Box(20, 150, 110, 46); dfd_entity(s, tg, "Telegram")
    P = [Box(190 + 230 * i, 140, 140, 66) for i in range(3)]
    for b, n, nm in zip(P, ["11", "12", "13"], ["Регистрация\nи вход", "Подтверждение\nстатуса студента",
                                               "Заполнение\nанкеты"]):
        dfd_process(s, b, n, nm, hl=(n == "12"))
    for i, (y, t, two) in enumerate([(52, "дата рождения, согласие на ПДн / сессия", True),
                                     (36, "почта вуза / одноразовый код", True),
                                     (20, "фото, интересы, цель знакомства", False)]):
        x = P[i].T(0.5)[0]
        s.line([(st.r, y), (x, y), (x, P[i].y)], start_arrow=two)
        _lab(s, st.r + 10, y - 4, t)
    s.line([tg.R(0.5), (P[0].x, tg.cy)]); _lab(s, tg.r + 4, tg.cy - 6, "initData")
    _chain(s, P[0], P[1], "учётная запись")
    _chain(s, P[1], P[2], "отметка")
    D11 = Box(180, 268, 400, 30); dfd_store(s, D11, "D1.1", "Пользователи")
    D12 = Box(610, 268, 130, 30); dfd_store(s, D12, "D1.2", "Анкеты")
    D13 = Box(750, 268, 140, 30); dfd_store(s, D13, "D1.3", "Фото (S3)")
    _store_link(s, P[0], 0.5, D11, "запись, статус")
    _store_link(s, P[1], 0.5, D11, "is_verified", "in")
    _store_link(s, P[2], 0.3, D12, "анкета, интересы", "in", lab_dx=-6)
    _store_link(s, P[2], 0.92, D13, "фото", "in")
    s.h = 305
    return s.render().replace(
        f'>анкета, интересы<', f' text-anchor="end">анкета, интересы<', 0)


def dfd2():
    s = SVG(900, 330, "Лента читает анкеты и уже поставленные оценки, лимит лайков — подписки",
            "DFD · декомпозиция процесса 2 «Подбор и знакомства»")
    st = Box(20, 6, 130, 70); dfd_entity(s, st, "Студент")
    P = [Box(185 + 180 * i, 140, 125, 66) for i in range(4)]
    for b, n, nm in zip(P, ["21", "22", "23", "24"], ["Формирование\nленты", "Лайки\nи совпадения", "Переписка",
                                                     "Согласование\nвстречи"]):
        dfd_process(s, b, n, nm, hl=(n == "22"))
    rows = [(66, "лента анкет", "out"), (51, "лайк / совпадение", "both"), (36, "сообщения", "both"),
            (21, "предложение / ответ", "both")]
    for i, (y, t, mode) in enumerate(rows):
        x = P[i].T(0.5)[0]
        if mode == "out":
            s.line([(x, P[i].y), (x, y), (st.r, y)])
        else:
            s.line([(st.r, y), (x, y), (x, P[i].y)], start_arrow=True)
        _lab(s, st.r + 10, y - 4, t)
    _chain(s, P[0], P[1], "лента")
    _chain(s, P[1], P[2], "совпадение")
    _chain(s, P[2], P[3], "переписка")
    D = [Box(140, 268, 140, 30), Box(290, 268, 170, 30), Box(470, 268, 110, 30), Box(590, 268, 120, 30),
         Box(720, 268, 160, 30)]
    for b, n, nm in zip(D, ["D1.2", "D2.1", "D5.2", "D2.2", "D2.3"],
                        ["Анкеты", "Лайки и совпадения", "Подписки", "Сообщения", "Встречи"]):
        dfd_store(s, b, n, nm)
    _store_link(s, P[0], 0.3, D[0], "анкеты", "out", lab_dx=-6)
    _store_link(s, P[0], 0.95, D[1], "оценки", "out")
    _store_link(s, P[1], 0.45, D[1], "лайк", "both")
    _store_link(s, P[1], 0.93, D[2], "Premium", "out")
    _store_link(s, P[2], 0.75, D[3], "текст", "both")
    _store_link(s, P[3], 0.5, D[4], "встреча", "both")
    s.h = 305
    return s.render().replace('>анкеты<', ' text-anchor="end">анкеты<', 1)


def dfd3():
    s = SVG(900, 330, "Модератор видит только переписку, на которую пожаловались",
            "DFD · декомпозиция процесса 3 «Безопасность и модерация»")
    P = [Box(170 + 210 * i, 140, 150, 66) for i in range(3)]
    for b, n, nm in zip(P, ["31", "32", "33"], ["Приём\nжалоб", "Рассмотрение\nжалобы", "Применение\nрешения"]):
        dfd_process(s, b, n, nm, hl=(n == "32"))
    e1 = Box(185, 20, 120, 50); dfd_entity(s, e1, "Студент")
    e2 = Box(395, 20, 120, 50); dfd_entity(s, e2, "Модератор")
    e3 = Box(605, 20, 120, 50); dfd_entity(s, e3, "Студент")
    s.line([(e3.x + 14, e3.b), (e3.x, e3.b - 14)], arrow=False, color=BOX)  # отметка дубля
    _ext_top(s, e1, P[0], 0.5, "жалоба (причина, на кого)")
    _ext_top(s, e2, P[1], 0.5, "жалоба / решение", two=True)
    s.line([P[2].T(0.5), (P[2].T(0.5)[0], e3.b)]); _lab(s, P[2].T(0.5)[0] + 6, 108, "уведомление о решении")
    _chain(s, P[0], P[1], "жалоба")
    _chain(s, P[1], P[2], "решение")
    D3 = Box(160, 268, 320, 30); dfd_store(s, D3, "D3", "Жалобы")
    D22 = Box(490, 268, 120, 30); dfd_store(s, D22, "D2.2", "Сообщения")
    D11 = Box(620, 268, 200, 30); dfd_store(s, D11, "D1.1", "Пользователи")
    _store_link(s, P[0], 0.5, D3, "жалоба", "in")
    _store_link(s, P[1], 0.3, D3, "статус, решение", "both")
    _store_link(s, P[1], 0.88, D22, "переписка", "out")
    _store_link(s, P[2], 0.5, D11, "статус пользователя", "in")
    s.h = 305
    return s.render()


def dfd4():
    s = SVG(910, 330, "Билет подтверждается по статусу платежа из хранилища D5.1",
            "DFD · декомпозиция процесса 4 «Мероприятия»")
    P = [Box(170, 140, 150, 66), Box(390, 140, 150, 66), Box(610, 140, 170, 66)]
    for b, n, nm in zip(P, ["41", "42", "43"], ["Согласование\nс партнёром", "Публикация\nмероприятия",
                                               "Запись\nучастников"]):
        dfd_process(s, b, n, nm, hl=(n == "43"))
    e = [Box(170, 20, 120, 50), Box(400, 20, 130, 50), Box(615, 20, 110, 50), Box(780, 20, 120, 50)]
    for b, t in zip(e, ["Партнёр", "Команда\nCAMPUS", "Студент", "Партнёр"]):
        dfd_entity(s, b, t)
    s.line([(e[3].x + 14, e[3].b), (e[3].x, e[3].b - 14)], arrow=False, color=BOX)
    _ext_top(s, e[0], P[0], 0.45, "условия площадки", two=True)
    _ext_top(s, e[1], P[1], 0.5, "описание, программа")
    _ext_top(s, e[2], P[2], 0.3, "заявка / билет", two=True)
    x = P[2].T(0.88)[0]
    s.line([(x, P[2].y), (x, 100), (e[3].cx, 100), (e[3].cx, e[3].b)]); _lab(s, e[3].cx + 6, 120 - 6, "")
    _lab(s, x + 6, 96, "список участников")
    _chain(s, P[0], P[1], "условия")
    _chain(s, P[1], P[2], "мероприятие")
    D = [Box(160, 268, 200, 30), Box(380, 268, 250, 30), Box(640, 268, 110, 30), Box(760, 268, 140, 30)]
    for b, n, nm in zip(D, ["D4.1", "D4.2", "D4.3", "D5.1"], ["Партнёры", "Мероприятия", "Билеты", "Платежи"]):
        dfd_store(s, b, n, nm)
    _store_link(s, P[0], 0.45, D[0], "договорённость", "in")
    _store_link(s, P[1], 0.45, D[1], "карточка", "in")
    _store_link(s, P[2], 0.1, D[1], "места", "out", lab_dx=-6)
    _store_link(s, P[2], 0.5, D[2], "бронь", "both")
    _store_link(s, P[2], 0.92, D[3], "оплачен?", "out")
    s.h = 305
    return s.render().replace('>места<', ' text-anchor="end">места<', 1)


def dfd5():
    s = SVG(900, 345, "Платёж создаётся до оплаты, а подтверждается только уведомлением сервиса",
            "DFD · декомпозиция процесса 5 «Оплата и отчётность»")
    P = [Box(170 + 230 * i, 140, 150, 66) for i in range(3)]
    for b, n, nm in zip(P, ["51", "52", "53"], ["Создание\nплатежа", "Проверка\nоплаты", "Формирование\nотчётов"]):
        dfd_process(s, b, n, nm, hl=(n == "52"))
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
    _chain(s, P[0], P[1], "платёж")
    _chain(s, P[1], P[2], "оплаченные")
    D = [Box(150, 268, 105, 30), Box(265, 268, 260, 30), Box(535, 268, 120, 30), Box(685, 268, 205, 30)]
    for b, n, nm in zip(D, ["D4.3", "D5.1", "D5.2", "D1–D4"], ["Билеты", "Платежи", "Подписки", "чтение"]):
        dfd_store(s, b, n, nm)
    _store_link(s, P[0], 0.15, D[0], "бронь", "out", lab_dx=-6)
    _store_link(s, P[0], 0.7, D[1], "платёж", "in")
    _store_link(s, P[1], 0.35, D[1], "статус", "both")
    _store_link(s, P[1], 0.93, D[2], "Premium", "in")
    s.line([(500, 298), (500, 318), (670, 318), (670, P[2].b)]); _lab(s, 664, 240, "платежи", "end")
    _store_link(s, P[2], 0.75, D[3], "агрегаты", "out")
    s.h = 325
    return s.render().replace('>бронь<', ' text-anchor="end">бронь<', 1)


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
            "IDEF3 · сценарий С1 «Регистрация и подтверждение» · декомпозиция блока A1")
    Y = 80
    jy = Y + U_H / 2 - 13 - 9
    u1 = _u(s, 8, Y, "Войти через\nTelegram", "1.1")
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
            "IDEF3 · сценарий С2 «Знакомство» · декомпозиция блока A2")
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
    elab(s, eb, "ELAB / Бесплатно — 30 лайков в сутки;\nс Premium лимита нет (статус из D5.2)")
    s.line([(j2.r - 4, j2.b), (j2.r - 4, 258), (440, 258)], arrow=False, dash="3 3", color=BOX)
    s.h = 290
    return s.render()


def idef3_pay():
    s = SVG(820, 300, "Билет подтверждается только после уведомления платёжного сервиса",
            "IDEF3 · сценарий С5 «Покупка билета» · декомпозиция блоков A4 и A5")
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
    left = [("Войти через Telegram", 60), ("Подтвердить\nстатус студента", 112), ("Заполнить анкету", 164),
            ("Смотреть ленту\nи ставить лайки", 226), ("Переписываться", 296), ("Пожаловаться", 352),
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
    usecase(s, R, 130, "Завершить\nистёкший Premium", rx=82, ry=22)
    usecase(s, R, 300, "Рассмотреть жалобу", rx=82, ry=22)
    usecase(s, R, 370, "Заблокировать\nпользователя", rx=82, ry=22)
    usecase(s, R, 440, "Опубликовать\nмероприятие", rx=82, ry=22)
    usecase(s, R, 508, "Посмотреть отчёты", rx=82, ry=22)

    def dep(p, q, t):
        s.line([p, q], dash="5 4", open_head=True)
        s.text((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 5, t, size=9, anchor="middle", fill=MUTED)

    dep((L + 78, 226), (M - 70, 226), "«include»")
    dep((M - 70, 296), (L + 78, 296), "«extend»")
    dep((L + 70, 430), (M - 50, 446), "«include»")
    dep((L + 72, 490), (M - 52, 468), "«include»")
    dep((R, 348), (R, 322), "«extend»")
    # актёры справа
    actor(s, 890, 72, "Таймер", label_pos="below")
    s.line([(878, 92), (R + 82, 70)], arrow=False, color="#b3ada3")
    s.line([(878, 92), (R + 82, 130)], arrow=False, color="#b3ada3")
    actor(s, 890, 300, "Модератор")
    s.line([(878, 320), (R + 82, 300)], arrow=False, color="#b3ada3")
    actor(s, 890, 440, "Команда\nCAMPUS")
    s.line([(878, 460), (R + 82, 440)], arrow=False, color="#b3ada3")
    s.line([(878, 460), (R + 82, 508)], arrow=False, color="#b3ada3")
    actor(s, M, 580, "", label_pos="none")
    s.text(M + 18, 606, "Платёжный сервис", size=10.5, weight=700)
    s.line([(M, 477), (M, 573)], arrow=False, color="#b3ada3")
    s.h = 628
    return s.render()


# ============================================================ UML: последовательности

def seq_like():
    parts = ["Студент", ":Mini App", "*:API знакомств", ":Лимиты", ":БД", ":Бот-уведомления"]
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
    parts = ["Студент", ":Mini App", "*:API пользователей", ":Кэш кодов", ":Почта (SMTP)", ":БД"]
    msgs = [
        (0, 1, "почта вуза", "call"),
        (1, 2, "POST /verify/email", "call"),
        (2, 2, "домен вуза?", "self"),
        (2, 3, "SET хеш кода, TTL 10 мин", "call"),
        (2, 4, "отправить код", "call"),
        (2, 1, "202 Accepted", "ret"),
        (0, 1, "ввод кода", "call"),
        (1, 2, "POST /verify/code", "call"),
        (2, 3, "GET хеш, попытки", "call"),
        (3, 2, "хеш, попытка 1 из 3", "ret"),
        (2, 5, "UPDATE users SET is_verified = true", "call"),
        (2, 1, "200 OK", "ret"),
        (2, 1, "422 «неверный код», осталось 2", "ret"),
    ]
    frames = [("alt", "[код совпал и не истёк]", 10, 12, 12, "[неверный или истёк]")]
    s = sequence("Отметка «студент» появляется только после проверки одноразового кода",
                 "UML 2.5 · диаграмма последовательности · сценарий С1, блок A12", parts, msgs, frames, w=820)
    return s.render()


def seq_pay():
    parts = ["Студент", ":Mini App", ":API мероприятий", "*:API оплаты", ":Платёжный сервис", ":БД"]
    msgs = [
        (0, 1, "«Купить билет»", "call"),
        (1, 2, "POST /events/:id/tickets", "call"),
        (2, 5, "INSERT билет: бронь до +30 мин", "call"),
        (2, 3, "createPayment(билет)", "call"),
        (3, 5, "INSERT платёж «ожидает», ключ", "call"),
        (3, 4, "создать платёж", "call"),
        (4, 3, "ссылка на оплату", "ret"),
        (3, 1, "201 + ссылка", "ret"),
        (0, 4, "оплата по ссылке", "call"),
        (4, 3, "webhook: платёж выполнен", "call"),
        (3, 5, "UPDATE платёж = оплачен", "call"),
        (3, 2, "ticketPaid(билет)", "call"),
        (2, 5, "UPDATE билет = оплачен", "call"),
        (3, 5, "UPDATE платёж = ошибка", "call"),
        (3, 4, "200 OK", "ret"),
    ]
    frames = [("alt", "[успех и платёж ещё не обработан]", 10, 13, 13, "[ошибка оплаты]")]
    s = sequence("Статус билета меняется только по уведомлению платёжного сервиса",
                 "UML 2.5 · диаграмма последовательности · сценарий С5, блоки A43 и A52", parts, msgs, frames,
                 w=820)
    return s.render()
