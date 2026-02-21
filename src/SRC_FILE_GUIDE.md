# Front `src` 檔案用途說明

## 入口與框架

- `src/main.js`：Vue 應用入口，註冊 Pinia、Router、Element Plus，最後掛載 `#app`。
- `src/App.vue`：根元件，載入全站導覽列與 `router-view`。
- `src/router/index.js`：路由表與前置守衛（`/admin` 需 token 且 role 為 `admin`）。

## API 層 (`src/api`)

- `src/api/axios.js`：Axios 實例與攔截器；處理 baseURL、Bearer token、統一錯誤格式。
- `src/api/stock.api.js`：股票與收盤資料 API 封裝（列表、個股、close prices、sectors）。
- `src/api/treemap.api.js`：首頁 treemap 資料 API 封裝。
- `src/api/user.api.js`：使用者註冊與登入 API 封裝。

## 狀態管理 (`src/stores`)

- `src/stores/home.store.js`：首頁 treemap 主資料狀態（loading/ready/error）與載入流程。
- `src/stores/stock.js`：股票清單、篩選、分群統計、個股最新收盤對照資料等狀態與行為。
- `src/stores/stockSearch.store.js`：首頁搜尋框關鍵字與搜尋結果狀態。
- `src/stores/watchlist.js`：追蹤清單數量狀態，並透過 `/user/profile` 同步。

## 頁面 (`src/pages`)

- `src/pages/HomePage.vue`：首頁組裝頁，整合 Hero 搜尋、Top Movers、Treemap、市場摘要卡。
- `src/pages/StockPage.vue`：個股詳情頁（依 market/symbol 顯示資料）。
- `src/pages/ProfilePage.vue`：使用者個人資料頁。
- `src/pages/WatchlistPage.vue`：使用者追蹤清單頁。
- `src/pages/LoginPage.vue`：登入頁，送出帳密並儲存 token。
- `src/pages/RegisterPage.vue`：註冊頁。
- `src/pages/AdminPage.vue`：管理頁，提供健康檢查與管理操作入口（含權限 gate）。

## 視圖 (`src/views`)

- `src/views/SectorPage.vue`：產業別頁面（由 `/sector/:sector` 路由載入）。

## 共用元件 (`src/components`)

- `src/components/AppNavbar.vue`：全站導覽列（桌機/手機入口、導頁、登入狀態互動）。
- `src/components/nvabar/MobileDrawerMenu.vue`：手機版側邊抽屜選單元件。

### 首頁元件 (`src/components/home`)

- `src/components/home/HeroSearch.vue`：首頁主視覺搜尋區，負責輸入與跳轉個股頁。
- `src/components/home/TopMovers.vue`：漲跌幅排行表格 + ECharts 視覺化。
- `src/components/home/TreemapChart.vue`：產業熱力圖（Treemap）呈現元件。
- `src/components/home/MarketSummaryCard.vue`：市場摘要統計卡（上漲比例、分布、集中度等）。

### 摘要卡子元件 (`src/components/home/MarketSummaryCard`)

- `src/components/home/MarketSummaryCard/KpiCard.vue`：單一 KPI 顯示卡。
- `src/components/home/MarketSummaryCard/DistBar.vue`：漲跌分布條形顯示元件。

### Icon 元件 (`src/components/icons`)

- `src/components/icons/IconCommunity.vue`：社群圖示元件。
- `src/components/icons/IconDocumentation.vue`：文件圖示元件。
- `src/components/icons/IconEcosystem.vue`：生態系圖示元件。
- `src/components/icons/IconSupport.vue`：支援圖示元件。
- `src/components/icons/IconTooling.vue`：工具圖示元件。

## 工具與資料

- `src/utils/format.js`：數值/漲跌幅格式化與樣式 class 輔助函式。

## 樣式與資產

- `src/style.css`：Tailwind CSS 入口（含 `@config`）。
- `src/tailwind.config.js`：Tailwind 主題擴充（色票、market up/down 等）。
- `src/assets/base.css`：Vue 預設基礎樣式（含 root color 變數）。
- `src/assets/main.css`：Vue 預設 main 樣式（目前偏模板示範用途）。
- `src/assets/four_cats.png`：首頁/登入等頁面背景圖。
- `src/assets/logo.png`：Logo 圖檔。

## 建議閱讀順序（快速掌握流程）

1. `src/main.js`
2. `src/App.vue`
3. `src/router/index.js`
4. `src/pages/HomePage.vue`
5. `src/stores/home.store.js`
6. `src/api/*.js`
7. `src/components/home/*.vue`
8. 其餘 pages/stores 按功能延伸閱讀
