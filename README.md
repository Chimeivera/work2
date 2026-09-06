# 主管會議報告箱

一個以 Google Apps Script 製作的手機友善 Web App。臨時想到的報告事項可立即記下，依會議分類，開會前再集中整理。資料存放於專屬 Google 試算表。

## 已內建會議

1. 醫務會議
2. 醫學教育委員會
3. 教學會議
4. 行政主管協調會
5. 院務會議

## 功能

- 新增、編輯、刪除報告事項
- 依會議、狀態篩選及關鍵字搜尋
- 優先度：一般、重要、緊急
- 流程狀態：待整理、已排入、已報告、暫緩
- 記錄預計報告日期、建立與更新時間
- 手機、平板、電腦共用同一份資料
- 可從首頁直接開啟 Google 試算表

## 第一次安裝（最簡單方式）

1. 到 [Google Apps Script](https://script.google.com/) 建立「新專案」。
2. 將 `Code.gs` 的全部內容貼到專案原本的 `Code.gs`。
3. 按左側「＋」新增 HTML，檔名輸入 `Index`，貼入 `Index.html` 的內容。
4. 到「專案設定」勾選顯示資訊清單檔，將 `appsscript.json` 內容貼入。
5. 在上方函式選單選 `setup`，按「執行」，依畫面完成 Google 授權。這會建立資料庫試算表。
6. 右上角按「部署」→「新增部署作業」→ 類型選「網頁應用程式」。
7. 「執行身分」選自己；若只有自己使用，「誰可以存取」選只有自己。部署後複製網址。
8. iPhone 用 Safari 開啟網址後按分享 →「加入主畫面」；Android 用 Chrome 選單 →「加到主畫面」。之後就能像 APP 一樣開啟。

> 請勿把資料庫試算表設為公開。此系統適合記錄行政報告事項；患者姓名、病歷號等敏感個資仍不建議放入。

## 放到 GitHub 管理版本

建立私人 GitHub repository，再把此資料夾推上去。`.clasp.json` 已被忽略，不會誤傳 Apps Script 專案 ID。

```bash
git init
git add .
git commit -m "建立主管會議報告箱"
git branch -M main
git remote add origin 你的私人GitHub儲存庫網址
git push -u origin main
```

## 使用 clasp 從 GitHub 程式碼更新 Apps Script（進階）

電腦先安裝 Node.js，接著執行：

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json
```

把 `.clasp.json` 內的 `scriptId` 改成 Apps Script 專案設定頁的指令碼 ID，然後：

```bash
clasp push
```

程式更新後，到 Apps Script 的「管理部署作業」建立新版本，既有 APP 網址可維持不變。

## 權限設計提醒

- 個人版：部署存取權限選「只有自己」，最安全。
- 團隊版：若要開放同事共同使用，應先確認院內 Google Workspace 政策，再將存取範圍限制在機構帳號。
- GitHub repository 建議設為 Private；它只放程式碼，不放 Google 試算表內的會議資料。
