// Рендер HTML → PDF: node render.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.goto('file://' + path.join(__dirname, 'campus_model.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const head = `<div style="font-family:Inter,sans-serif;font-size:7px;color:#8a867f;width:100%;padding:0 17mm;">
    Проектирование ИС: модель сервиса студенческих знакомств CAMPUS</div>`;
  const foot = `<div style="font-family:Inter,sans-serif;font-size:7px;color:#8a867f;width:100%;padding:0 17mm;text-align:right;">
    Стр. <span class="pageNumber"></span> из <span class="totalPages"></span></div>`;
  await page.pdf({ path: path.join(__dirname, '..', 'CAMPUS_IS_model.pdf'), format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: head, footerTemplate: foot,
    margin: { top: '18mm', bottom: '18mm', left: '17mm', right: '17mm' } });
  await b.close();
})();
