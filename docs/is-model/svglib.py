"""Небольшая библиотека для рисования диаграмм (IDEF0, DFD, IDEF3, UML) в SVG."""
import html
import itertools

LINE = "#9e988e"
TEXT = "#262626"
MUTED = "#7a766f"
BOX = "#bdb7ad"
HL_FILL = "#e8effa"
HL_STROKE = "#3b78c4"
FONT = "Inter, 'DejaVu Sans', sans-serif"

_ids = itertools.count(1)


def esc(s):
    return html.escape(str(s))


def tw(s, size):
    """Примерная ширина строки в пикселях (Inter)."""
    return len(s) * size * 0.56


class Box:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h

    @property
    def cx(self):
        return self.x + self.w / 2

    @property
    def cy(self):
        return self.y + self.h / 2

    @property
    def r(self):
        return self.x + self.w

    @property
    def b(self):
        return self.y + self.h

    def L(self, f=0.5):
        return (self.x, self.y + self.h * f)

    def R(self, f=0.5):
        return (self.r, self.y + self.h * f)

    def T(self, f=0.5):
        return (self.x + self.w * f, self.y)

    def B(self, f=0.5):
        return (self.x + self.w * f, self.b)


class SVG:
    def __init__(self, w, h, title=None, subtitle=None):
        self.w, self.h = w, h
        self.title, self.subtitle = title, subtitle
        self.el = []
        self.mid = f"ah{next(_ids)}"
        self.top = 0
        if title:
            self.top = 46 if subtitle else 30

    def add(self, s):
        self.el.append(s)

    # --- примитивы -------------------------------------------------------
    def text(self, x, y, t, size=11, weight=400, anchor="start", fill=TEXT, italic=False, lh=1.25):
        st = ' font-style="italic"' if italic else ""
        for i, line in enumerate(str(t).split("\n")):
            self.add(
                f'<text x="{x:.1f}" y="{y + i * size * lh:.1f}" font-size="{size}" font-weight="{weight}" '
                f'text-anchor="{anchor}" fill="{fill}"{st}>{esc(line)}</text>'
            )

    def ctext(self, cx, cy, t, size=11, weight=400, fill=TEXT, lh=1.25):
        lines = str(t).split("\n")
        y0 = cy - (len(lines) - 1) * size * lh / 2 + size * 0.35
        for i, line in enumerate(lines):
            self.add(
                f'<text x="{cx:.1f}" y="{y0 + i * size * lh:.1f}" font-size="{size}" font-weight="{weight}" '
                f'text-anchor="middle" fill="{fill}">{esc(line)}</text>'
            )

    def rect(self, x, y, w, h, fill="#fff", stroke=BOX, sw=1, rx=0, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>'
        )

    def line(self, pts, arrow=True, dash=None, color=LINE, sw=1.1, start_arrow=False, open_head=False):
        d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
        da = f' stroke-dasharray="{dash}"' if dash else ""
        mk = ""
        mid = self.mid + ("o" if open_head else "")
        if arrow:
            mk += f' marker-end="url(#{mid})"'
        if start_arrow:
            mk += f' marker-start="url(#{mid}s)"'
        self.add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}"{da}{mk}/>')

    def dot(self, x, y, r=2.6, color=LINE):
        self.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{color}"/>')

    def circle(self, x, y, r, fill="#fff", stroke=LINE, sw=1.1):
        self.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def ellipse(self, cx, cy, rx, ry, fill="#fff", stroke=BOX, sw=1.1):
        self.add(
            f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
        )

    def raw(self, s):
        self.add(s)

    # --- вывод -------------------------------------------------------------
    def render(self):
        H = self.h + self.top
        head = ""
        if self.title:
            head += (
                f'<text x="6" y="16" font-size="13.5" font-weight="700" fill="{TEXT}">{esc(self.title)}</text>'
            )
            if self.subtitle:
                head += f'<text x="6" y="33" font-size="10" fill="{MUTED}">{esc(self.subtitle)}</text>'
        m = self.mid
        defs = (
            f'<defs><marker id="{m}" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0 1 L10 5 L0 9 z" fill="{LINE}"/></marker>'
            f'<marker id="{m}s" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0 1 L10 5 L0 9 z" fill="{LINE}"/></marker>'
            f'<marker id="{m}o" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="8" markerHeight="8" '
            f'orient="auto-start-reverse"><path d="M0 1 L10 5 L0 9" fill="none" stroke="{LINE}" stroke-width="1.3"/></marker>'
            f'<filter id="{m}sh" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#d8d4cc"/></filter>'
            "</defs>"
        )
        body = "\n".join(self.el)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {H}" width="100%" '
            f'font-family="{FONT}">{defs}{head}<g transform="translate(0,{self.top})">{body}</g></svg>'
        )


# ===================================================================== IDEF0

def idef0_box(s, b, name, code, hl=False, size=11.5):
    s.rect(b.x, b.y, b.w, b.h, fill=HL_FILL if hl else "#fff", stroke=HL_STROKE if hl else BOX,
           sw=1.6 if hl else 1.1, rx=2)
    s.ctext(b.cx, b.cy - 4, name, size=size, weight=700)
    s.text(b.r - 6, b.b - 6, code, size=10, anchor="end", fill=MUTED)


def staircase(n, x0, y0, dx, dy, bw, bh):
    return [Box(x0 + i * dx, y0 + i * dy, bw, bh) for i in range(n)]


def stub_top(s, b, f, label, length=24, size=10):
    x, y = b.T(f)
    s.line([(x, y - length), (x, y)])
    s.text(x, y - length - 4, label, size=size, anchor="middle", fill=TEXT)


def stub_bottom(s, b, f, label, length=24, size=10):
    x, y = b.B(f)
    s.line([(x, y + length), (x, y)])
    s.text(x, y + length + 12, label, size=size, anchor="middle", fill=TEXT)


def link(s, a, b, label, fa=0.5, fb=0.5, xv=None, lab_pos="under", size=10):
    """Стрелка выход блока a → вход (левая сторона) блока b с вертикальным участком."""
    x1, y1 = a.R(fa)
    x2, y2 = b.L(fb)
    if xv is None:
        xv = (a.r + b.x) / 2
    s.line([(x1, y1), (xv, y1), (xv, y2), (x2, y2)])
    if label:
        if lab_pos == "under":
            s.text(xv - 5, a.b + 14, label, size=size, anchor="end", fill=MUTED)
        else:
            lx, ly = lab_pos
            s.text(lx, ly, label, size=size, fill=MUTED)


def link_ctrl(s, a, b, label, fa=0.5, fb=0.5, lab=None, size=10):
    """Выход блока a → управление (верх) блока b, b правее и ниже a."""
    x1, y1 = a.R(fa)
    x2, y2 = b.T(fb)
    s.line([(x1, y1), (x2, y1), (x2, y2)])
    if label:
        lx, ly = lab if lab else (x1 + 6, y1 - 5)
        s.text(lx, ly, label, size=size, fill=MUTED)


# ===================================================================== DFD

def dfd_process(s, b, num, name, hl=False):
    s.rect(b.x, b.y, b.w, b.h, fill=HL_FILL if hl else "#fff", stroke=HL_STROKE if hl else BOX,
           sw=1.6 if hl else 1.1, rx=10)
    s.line([(b.x, b.y + 20), (b.r, b.y + 20)], arrow=False, color=HL_STROKE if hl else BOX)
    s.text(b.cx, b.y + 14, num, size=10, anchor="middle", fill=MUTED)
    s.ctext(b.cx, b.y + 20 + (b.h - 20) / 2, name, size=11, weight=700)


def dfd_entity(s, b, name):
    s.add(f'<rect x="{b.x}" y="{b.y}" width="{b.w}" height="{b.h}" fill="#fff" stroke="{BOX}" '
          f'stroke-width="1.1" filter="url(#{s.mid}sh)"/>')
    s.ctext(b.cx, b.cy, name, size=11, weight=700)


def dfd_store(s, b, num, name):
    s.add(f'<rect x="{b.x + 0.5}" y="{b.y + 0.5}" width="{b.w - 1}" height="{b.h - 1}" fill="#fff" stroke="none"/>')
    s.line([(b.r, b.y), (b.x, b.y), (b.x, b.b), (b.r, b.b)], arrow=False, color=BOX)
    s.line([(b.x + 34, b.y), (b.x + 34, b.b)], arrow=False, color=BOX)
    s.text(b.x + 17, b.cy + 4, num, size=10.5, weight=700, anchor="middle")
    s.text(b.x + 42, b.cy + 4, name, size=11)


# ===================================================================== IDEF3

def uow(s, b, name, num, hl=False):
    s.rect(b.x, b.y, b.w, b.h, fill=HL_FILL if hl else "#fff", stroke=HL_STROKE if hl else BOX, sw=1.1, rx=2)
    s.line([(b.x, b.b - 18), (b.r, b.b - 18)], arrow=False, color=BOX)
    s.line([(b.x + b.w * 0.5, b.b - 18), (b.x + b.w * 0.5, b.b)], arrow=False, color=BOX)
    s.line([(b.x, b.y + 7), (b.x + 7, b.y)], arrow=False, color=BOX)
    s.ctext(b.cx, b.y + (b.h - 18) / 2, name, size=10.5, weight=700)
    s.text(b.x + 5, b.b - 5, num, size=9.5, fill=TEXT)


def junction(s, x, y, kind, label=None, side="left", w=22, h=26):
    """Перекрёсток IDEF3: kind = 'X', '&', 'O'; side — где двойная черта (left = сходящийся)."""
    s.rect(x, y, w, h, fill="#fff", stroke=TEXT, sw=1)
    if side == "left":
        s.line([(x + 4, y), (x + 4, y + h)], arrow=False, color=TEXT, sw=1)
    elif side == "right":
        s.line([(x + w - 4, y), (x + w - 4, y + h)], arrow=False, color=TEXT, sw=1)
    s.text(x + w / 2 + (2 if side == "left" else -2 if side == "right" else 0), y + h / 2 + 4.5, kind,
           size=12, weight=700, anchor="middle")
    if label:
        s.text(x + w / 2, y + h + 13, label, size=9.5, anchor="middle")
    return Box(x, y, w, h)


def elab(s, b, text):
    s.rect(b.x, b.y, b.w, b.h, fill="#fff", stroke=BOX)
    s.text(b.x + 8, b.y + 18, text, size=9.5)


# ===================================================================== UML

def actor(s, x, y, name, size=10.5, label_pos="below"):
    s.circle(x, y, 7, stroke=MUTED)
    s.line([(x, y + 7), (x, y + 28)], arrow=False, color=MUTED)
    s.line([(x - 11, y + 14), (x + 11, y + 14)], arrow=False, color=MUTED)
    s.line([(x - 10, y + 42), (x, y + 28), (x + 10, y + 42)], arrow=False, color=MUTED)
    if label_pos == "below":
        s.text(x, y + 56, name, size=size, weight=700, anchor="middle")
    elif label_pos == "left":
        s.text(x - 16, y + 26, name, size=size, weight=700, anchor="end")
    else:
        s.text(x + 16, y + 26, name, size=size, weight=700)


def usecase(s, cx, cy, name, rx=62, ry=20, hl=False):
    s.ellipse(cx, cy, rx, ry, fill=HL_FILL if hl else "#fff", stroke=HL_STROKE if hl else BOX,
              sw=1.6 if hl else 1.1)
    s.ctext(cx, cy, name, size=10, weight=700 if hl else 400)


def class_box(s, x, y, w, name, attrs, pk=None, hl=False, rounded=False, size=10, head=20, row=14):
    """Блок класса UML / сущности IDEF1X. pk — список ключевых атрибутов (IDEF1X)."""
    if pk is not None:
        # IDEF1X: имя над блоком, ключ вверху, атрибуты ниже
        s.text(x, y - 6, name, size=10.5, weight=700)
        hk = 8 + row * len(pk)
        ha = 8 + row * max(1, len(attrs))
        s.rect(x, y, w, hk + ha, fill="#fff", stroke=HL_STROKE if hl else BOX, sw=1.5 if hl else 1.1,
               rx=8 if rounded else 0)
        if hl:
            s.rect(x + 0.8, y + 0.8, w - 1.6, hk - 0.8, fill=HL_FILL, stroke="none")
        s.line([(x, y + hk), (x + w, y + hk)], arrow=False, color=HL_STROKE if hl else BOX)
        for i, a in enumerate(pk):
            s.text(x + 7, y + 4 + row * (i + 0.8), a, size=size)
        for i, a in enumerate(attrs):
            s.text(x + 7, y + hk + 4 + row * (i + 0.8), a, size=size)
        return Box(x, y, w, hk + ha)
    h = head + 8 + row * len(attrs)
    s.rect(x, y, w, h, fill="#fff", stroke=HL_STROKE if hl else BOX, sw=1.5 if hl else 1.1)
    if hl:
        s.rect(x + 0.8, y + 0.8, w - 1.6, head - 0.8, fill=HL_FILL, stroke="none")
    s.text(x + w / 2, y + 14, name, size=10.5, weight=700, anchor="middle")
    s.line([(x, y + head), (x + w, y + head)], arrow=False, color=HL_STROKE if hl else BOX)
    for i, a in enumerate(attrs):
        s.text(x + 7, y + head + 4 + row * (i + 0.8), a, size=size)
    return Box(x, y, w, h)


def sequence(title, subtitle, parts, msgs, frames=(), w=760, actor_first=True, col=None, top=70, step=27):
    """Диаграмма последовательности.
    parts: список имён; первый может быть актёром.
    msgs: (from, to, label, kind) kind: 'call' | 'ret' | 'self'
    frames: (kind, cond, i_from, i_to, else_at=None, else_cond=None)
    """
    n = len(parts)
    left = 60
    colw = col or (w - left - 85) / (n - 1)
    xs = [left + i * colw for i in range(n)]
    H = top + step * (len(msgs) + 1) + 30
    s = SVG(w, H, title, subtitle)
    for i, p in enumerate(parts):
        if i == 0 and actor_first:
            actor(s, xs[0], 4, p)
            y_life = 62
        else:
            bw = max(80, tw(p, 10.5) + 18)
            s.rect(xs[i] - bw / 2, 20, bw, 26, fill=HL_FILL if p.startswith("*") else "#fff",
                   stroke=HL_STROKE if p.startswith("*") else BOX, rx=2)
            s.text(xs[i], 37, p.lstrip("*"), size=10.5, weight=700, anchor="middle")
            y_life = 46
        s.add(f"<!--LIFE {xs[i]} {y_life}-->")
    starts = {fr[2] for fr in frames}
    elses = {fr[4] for fr in frames if len(fr) > 4 and fr[4] is not None}
    ys, extra = [], 0
    for k in range(len(msgs)):
        if k in starts:
            extra += 16
        if k in elses:
            extra += 14
        ys.append(top + step * (k + 1) + extra)
    s.h = ys[-1] + 40
    s.el = [(f'<path d="M {e.split()[1]} {e.split()[2]} L {e.split()[1]} {s.h - 8}" fill="none" stroke="#c9c4bb" stroke-width="1.1" stroke-dasharray="4 3"/>' if e.startswith("<!--LIFE") else e) for e in s.el]
    for k, (a, b, label, kind) in enumerate(msgs):
        y = ys[k]
        xa, xb = xs[a], xs[b]
        if kind == "self":
            s.line([(xa, y - 6), (xa + 26, y - 6), (xa + 26, y + 6), (xa + 2, y + 6)])
            s.text(xa + 32, y + 2, f"{k + 1}: {label}", size=10)
            continue
        d = 1 if xb > xa else -1
        s.line([(xa, y), (xb - d * 1, y)], dash="5 3" if kind == "ret" else None, open_head=(kind == "ret"))
        tx = min(xa, xb) + 6
        s.text(tx, y - 5, f"{k + 1}: {label}", size=10)
    for fr in frames:
        kind, cond, i1, i2 = fr[:4]
        x1 = min(xs) + 40
        x2 = max(xs) + 40
        y1 = ys[i1] - 32
        y2 = ys[i2] + 10
        s.rect(x1, y1, x2 - x1, y2 - y1, fill="none", stroke="#b3ada3")
        s.add(f'<path d="M{x1} {y1} h34 v10 l-6 7 h-28 z" fill="#fff" stroke="#b3ada3"/>')
        s.text(x1 + 4, y1 + 12, kind, size=9.5, weight=700)
        s.text(x1 + 40, y1 + 12, cond, size=9.5)
        if len(fr) > 4 and fr[4] is not None:
            ye = ys[fr[4]] - 28
            s.line([(x1, ye), (x2, ye)], arrow=False, dash="5 3", color="#b3ada3")
            s.text(x1 + 6, ye + 12, fr[5], size=9.5)
    return s
