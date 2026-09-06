const CONFIG = {
  spreadsheetProperty: 'MEETING_INBOX_SHEET_ID',
  sheetName: '會議事項',
  headers: ['ID', '會議', '主旨', '說明', '預計報告日', '優先度', '狀態', '建立時間', '更新時間']
};

function doGet() {
  ensureSheet_();
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('主管會議報告箱')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setup() {
  const sheet = ensureSheet_();
  return { ok: true, spreadsheetUrl: sheet.getParent().getUrl() };
}

function getItems() {
  const sheet = ensureSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, CONFIG.headers.length).getValues()
    .filter(row => row[0])
    .map(rowToItem_)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function saveItem(input) {
  validateItem_(input);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureSheet_();
    const now = new Date();
    const id = String(input.id || Utilities.getUuid());
    const row = findRowById_(sheet, id);
    const createdAt = row ? sheet.getRange(row, 8).getValue() : now;
    const values = [[
      id,
      clean_(input.meeting),
      clean_(input.title),
      clean_(input.details),
      input.reportDate ? new Date(input.reportDate + 'T12:00:00') : '',
      clean_(input.priority || '一般'),
      clean_(input.status || '待整理'),
      createdAt,
      now
    ]];
    if (row) sheet.getRange(row, 1, 1, CONFIG.headers.length).setValues(values);
    else sheet.getRange(sheet.getLastRow() + 1, 1, 1, CONFIG.headers.length).setValues(values);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function deleteItem(id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureSheet_();
    const row = findRowById_(sheet, String(id));
    if (!row) throw new Error('找不到這筆資料，可能已被刪除。');
    sheet.deleteRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheetUrl() {
  return ensureSheet_().getParent().getUrl();
}

function ensureSheet_() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheet;
  const storedId = props.getProperty(CONFIG.spreadsheetProperty);
  if (storedId) {
    try { spreadsheet = SpreadsheetApp.openById(storedId); } catch (e) { /* recreate */ }
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('主管會議報告箱_資料庫');
    props.setProperty(CONFIG.spreadsheetProperty, spreadsheet.getId());
  }
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CONFIG.headers.length).setValues([CONFIG.headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONFIG.headers.length)
      .setBackground('#65558F').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 280);
    sheet.setColumnWidth(4, 450);
    sheet.setColumnWidth(5, 130);
    sheet.setColumnWidth(6, 90);
    sheet.setColumnWidth(7, 100);
    sheet.getRange('E:E').setNumberFormat('yyyy/mm/dd');
    sheet.getRange('H:I').setNumberFormat('yyyy/mm/dd hh:mm');
  }
  return sheet;
}

function rowToItem_(row) {
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const fmt = value => value instanceof Date ? Utilities.formatDate(value, tz, "yyyy-MM-dd'T'HH:mm:ss") : String(value || '');
  const dateOnly = value => value instanceof Date ? Utilities.formatDate(value, tz, 'yyyy-MM-dd') : String(value || '');
  return {
    id: String(row[0]), meeting: String(row[1] || ''), title: String(row[2] || ''),
    details: String(row[3] || ''), reportDate: dateOnly(row[4]), priority: String(row[5] || '一般'),
    status: String(row[6] || '待整理'), createdAt: fmt(row[7]), updatedAt: fmt(row[8])
  };
}

function findRowById_(sheet, id) {
  if (sheet.getLastRow() < 2) return 0;
  const match = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  return match ? match.getRow() : 0;
}

function validateItem_(input) {
  if (!input || !clean_(input.meeting)) throw new Error('請選擇會議。');
  if (!clean_(input.title)) throw new Error('請輸入報告主旨。');
  if (clean_(input.title).length > 150) throw new Error('主旨請控制在 150 字內。');
  if (clean_(input.details).length > 5000) throw new Error('說明請控制在 5,000 字內。');
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}
