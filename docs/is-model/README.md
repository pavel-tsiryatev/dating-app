# Модель ИС CAMPUS (учебный проект)

Готовый документ: `../CAMPUS_IS_model.pdf`.

Пересборка (нужны Python 3 и Node.js с Playwright):

```bash
python3 build.py   # диаграммы (diagrams.py) + текст → campus_model.html
node render.js     # campus_model.html → ../CAMPUS_IS_model.pdf
```

- `diagrams.py` — все диаграммы (дерево задач, IDEF0, IDEF1X, DFD, IDEF3, UML) в виде SVG;
- `svglib.py` — примитивы для рисования;
- `build.py` — текст документа и таблицы;
- `style.css` — оформление.
