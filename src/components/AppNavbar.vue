<template>
  <header class="fixed w-full top-0 z-50 bg-cat-orange-dark">
<nav
  class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4"
>
      <!-- Left: Logo + dropdowns -->
      <div class="flex items-center gap-4">
        <RouterLink to="/" class="flex items-center">
          <img :src="logoUrl" alt="logo" class="h-10 w-15 mr-4" />
          <span class="text-2xl font-semibold text-white">CatStocks</span>
        </RouterLink>

        <!-- Industry dropdown -->
        <div class="hidden md:block">
          <el-dropdown trigger="click" popper-class="navbar-dropdown" @command="onIndustrySelect">
            <button
              class="flex items-center gap-1 px-2 text-xl rounded-3xl text-white hover:bg-cat-orange"
            >
              {{ currentSector ? currentSector : '產業' }}
              <el-icon><ArrowDown /></el-icon>
            </button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="">全部</el-dropdown-item>
                <el-dropdown-item
                  v-for="industry in industries"
                  :key="industry"
                  :command="industry"
                >
                  {{ industry }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Center: Search (NOT on Home) -->
      <div class="hidden md:flex flex-1 justify-center px-4">
        <div v-if="showSearch" class="w-full max-w-xl">
          <el-input
            v-model="stockStore.q"
            clearable
            placeholder="輸入代號或公司名稱（2330 / 2303）"
            @keydown.enter.prevent="onEnter"
            class="navbar-search focus:border-cat-orange-light"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- Right: actions (icon + text) -->
      <div class="hidden md:flex items-center gap-2">
        <!-- <el-button link class="text-xl! rounded-3xl! text-white!  hover:bg-cat-orange!" @click="goRegister"> -->
        <template v-for="nav in navs" :key="nav.to">
          <el-button
            v-if="nav.show"
            link
            class="text-xl! rounded-3xl! text-white! hover:bg-cat-orange!"
            @click="router.push(nav.to)"
          >
            <el-icon class="mr-1">
              <component :is="icons[nav.icon]" />
            </el-icon>

            {{ nav.title }}

            <span v-if="nav.to === '/watchlist' && watchlistCount > 0" class="ml-1 text-sm">
              ({{ watchlistCount }})
            </span>
          </el-button>
        </template>

        <el-avatar
          v-if="auth.isLoggedIn && avatarSrc"
          :size="32"
          :src="avatarSrc"
          class="mx-1 cursor-pointer"
          @click="router.push('/profile')"
        />

        <el-button
          v-if="auth.isLoggedIn"
          link
          class="navbar-action text-xl! rounded-3xl! text-white! hover:bg-cat-orange!"
          @click="logout"
        >
          <el-icon class="mr-1"><SwitchButton /></el-icon>
          登出
        </el-button>
      </div>
      <!-- Mobile: Hamburger -->
      <button
        type="button"
        class="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-white/10"
        @click="mobileOpen = true"
        aria-label="Open menu"
      >
        <el-icon size="40">
          <Menu />
        </el-icon>
      </button>
      <MobileDrawerMenu
        v-model="mobileOpen"
        :show-search="showSearch"
        :q="stockStore.q"
        @update:q="stockStore.q = $event"
        @enter="onEnterMobile"
        :industries="industries"
        @industry="onIndustrySelectMobile"
        :navs="navs"
        :watchlist-count="watchlistCount"
        :is-logged-in="auth.isLoggedIn"
        @nav="goNav"
        @logout="logout"
      />
    </nav>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStockStore } from '@/stores/stock'
import { useWatchlistStore } from '@/stores/watchlist'
import logoUrl from '@/assets/logo.png'
import MobileDrawerMenu from '@/components/nvabar/MobileDrawerMenu.vue'
// icons
import {
  ArrowDown,
  Search,
  UserFilled,
  Key,
  Star,
  Setting,
  SwitchButton,
  Menu,
} from '@element-plus/icons-vue'

//  Router / Stores
const route = useRoute()
const router = useRouter()
const stockStore = useStockStore()
const watchlistStore = useWatchlistStore()

//  Left: Logo + Industry dropdown
const industries = ref([
  '半導體業',
  '電子工業',
  '電子零組件業',
  '電腦及週邊設備業',
  '光電業',
  '通信網路業',
  '金融保險',
  '航運業',
  '鋼鐵工業',
  '建材營造',
  '食品工業',
  '其他',
])

const currentSector = computed(() => {
  const v = route.params?.sector ? String(route.params.sector) : 'all'
  return v === 'all' ? '全部' : v
})

const onIndustrySelect = (value) => {
  if (!value) {
    router.push('/sector/all')
    return
  }
  router.push(`/sector/${encodeURIComponent(value)}`)
}

//  Center: Search
const hideSearchNames = new Set(['home', 'login', 'register'])
const hideSearchPaths = new Set(['/', '/login', '/register'])

const showSearch = computed(() => {
  const nameHidden = hideSearchNames.has(route.name)
  const pathHidden = hideSearchPaths.has(route.path)
  return !(nameHidden || pathHidden)
})

//  Right: Desktop nav actions (auth state)
const auth = ref({
  isLoggedIn: false,
  role: 'user',
})

//  Mobile: Hamburger + Drawer helpers
const mobileOpen = ref(false)
const closeMobile = () => (mobileOpen.value = false)

const withClose =
  (fn) =>
  async (...args) => {
    await fn(...args)
    closeMobile()
  }

const goNav = withClose((to) => router.push(to))
const onIndustrySelectMobile = withClose((value) => onIndustrySelect(value))
const onEnterMobile = withClose(() => onEnter())

//  Auth / Avatar sync
const API_BASE = import.meta.env.VITE_API_BASE_URL 

const avatar = ref(localStorage.getItem('avatar') || '')

const avatarSrc = computed(() => {
  const v = String(avatar.value || '')
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return v
})

const syncAvatar = () => (avatar.value = localStorage.getItem('avatar') || '')

const fetchAvatarFromProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return

    const data = await res.json().catch(() => ({}))
    const a = data?.result?.avatar
    if (!a) return

    localStorage.setItem('avatar', a)
    avatar.value = a
  } catch (e) {
    console.log(e)
  }
}

const decodePayload = (token) => {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

const syncAuth = () => {
  const token = localStorage.getItem('token')

  if (!token) {
    auth.value.isLoggedIn = false
    auth.value.role = 'user'
    watchlistStore.setCount(0)
    avatar.value = ''
    return
  }

  try {
    const payload = decodePayload(token)
    auth.value.isLoggedIn = true
    auth.value.role = payload?.role || 'user'
    watchlistStore.fetchCount()
    fetchAvatarFromProfile()
  } catch (err) {
    console.log(err)
    auth.value.isLoggedIn = false
    auth.value.role = 'user'
    watchlistStore.setCount(0)
    avatar.value = ''
    localStorage.removeItem('avatar')
  }
}

//  Navigation helpers (search → stock)
const toTWMarket = (m) => {
  const x = String(m || '').toUpperCase()
  if (x === 'TW' || x === 'TWSE' || x === 'TSE') return 'TW'
  return x
}

const go = (it) => {
  router.push(`/stocks/${toTWMarket(it.market)}/${String(it.symbol).toUpperCase()}`)
  stockStore.clear()
}

const onEnter = async () => {
  const raw = String(stockStore.q || '').trim()
  if (!raw) return

  const keywordSymbol = raw.toUpperCase()
  const { items } = await stockStore.search({ limit: 20 })
  const list = Array.isArray(items) ? items : []

  const exactSymbol = list.find((it) => String(it.symbol).toUpperCase() === keywordSymbol)
  if (exactSymbol) return go(exactSymbol)

  const exactName = list.find((it) => String(it.name).trim() === raw)
  if (exactName) return go(exactName)

  if (list.length === 1) return go(list[0])

  if (/^\d{4,6}$/.test(keywordSymbol)) {
    router.push(`/stocks/TW/${keywordSymbol}`)
    stockStore.clear()
  }
}

//  Computed navs & misc
const navs = computed(() => [
  { title: '註冊', to: '/register', icon: 'UserFilled', show: !auth.value.isLoggedIn },
  { title: '登入', to: '/login', icon: 'Key', show: !auth.value.isLoggedIn },
  { title: '自選股', to: '/watchlist', icon: 'Star', show: auth.value.isLoggedIn },
  {
    title: '管理',
    to: '/admin',
    icon: 'Setting',
    show: auth.value.isLoggedIn && auth.value.role === 'admin',
  },
  {
    title: '個人檔案',
    to: '/profile',
    icon: 'UserFilled',
    show: auth.value.isLoggedIn,
  },
])

const watchlistCount = computed(() => watchlistStore.count)

const icons = { UserFilled, Key, Star, Setting }

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('avatar')
  window.dispatchEvent(new Event('auth:changed'))
  window.dispatchEvent(new Event('avatar-updated'))
  router.push('/')
}

onMounted(() => {
  syncAuth()
  syncAvatar()
  fetchAvatarFromProfile()
  window.addEventListener('auth:changed', syncAuth)
  window.addEventListener('avatar-updated', syncAvatar)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:changed', syncAuth)
  window.removeEventListener('avatar-updated', syncAvatar)
})
</script>

<style scoped>
/* 搜尋列基本樣式 */
.navbar-search :deep(.el-input__wrapper) {
  border-radius: 2rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* focus 狀態：淡橘邊框 */
.navbar-search :deep(.el-input__wrapper.is-focus) {
  border-color: #f3c892; /* cat.orange.light */
  box-shadow: 0 0 0 2px rgba(243, 200, 146, 0.35);
}
</style>

<style>
/* 這裡不要 scoped，因為 dropdown popper 會 teleport 到 body */
/* popper 外框 */
.navbar-dropdown {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(42, 42, 42, 0.92);
}

/* menu 本體 */
.navbar-dropdown .el-dropdown-menu {
  background: #e7a14a;
  padding: 6px;
}

/* item 文字 */
.navbar-dropdown .el-dropdown-menu__item {
  color: rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  margin: 2px 0;
  font-size: 16px;
}

/* hover */
.navbar-dropdown .el-dropdown-menu__item:hover,
.navbar-dropdown .el-dropdown-menu__item:focus {
  background: rgba(255, 255, 255, 0.1);
  color: #efe7d8;
}
</style>
