<template>
  <section class="relative">
    <div class="absolute inset-0">
      <img :src="bg" class="h-full w-full object-center" />
    </div>

    <div class="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div class="w-full max-w-2xl rounded-3xl bg-cat-tuxedo-light/40 shadow-2xl p-8">
        <h1 class="text-xl font-semibold mb-6">個人檔案</h1>

        <!-- 基本資料 -->
        <div class="flex items-center gap-10 mb-6">
          <el-avatar :size="150" :src="avatarSrc" />
          <div>
            <div class="text-6xl font-medium mb-5">帳號：{{ profile.account }}</div>
            <div class="text-3xl opacity-70">身份：{{ profile.role }}</div>
          </div>
        </div>

        <!-- 動作 -->
        <div class="flex gap-3">
          <el-upload
            :show-file-list="false"
            :auto-upload="true"
            accept="image/*"
            :http-request="uploadAvatar"
          >
            <el-button>上傳頭像</el-button>
          </el-upload>
        </div>
        <!-- 自選股（預覽） -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-medium">我的自選股</div>
            <div class="text-xs opacity-70">共 {{ profile.watchlist }} 檔</div>
          </div>

          <div v-if="watchlistLoading" class="text-sm opacity-70">載入中...</div>

          <div v-else-if="watchlistPreview.length === 0" class="text-sm opacity-70">
            尚未加入自選股
            <el-button link class="ml-1" @click="router.push('/watchlist')">前往自選股</el-button>
          </div>

          <ul v-else class="divide-y">
            <li
              v-for="it in watchlistPreview"
              :key="`${it.market}:${it.symbol}`"
              class="flex items-center justify-between py-2 bg"
            >
              <div class="min-w-0">
                <div class="font-medium">
                  {{ it.symbol }}
                  <span class="ml-2 text-sm opacity-80">{{ it.name }}</span>
                </div>
                <div class="text-xs opacity-70">{{ it.sector }} · {{ it.market }}</div>
              </div>

              <el-button link class="text-cat-orange-dark" @click="goStock(it)">查看</el-button>
            </li>
          </ul>

          <div class="mt-3">
            <el-button size="small" @click="router.push('/watchlist')">查看全部自選股</el-button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import bg from '@/assets/four_cats.png'
import { useWatchlistStore } from '@/stores/watchlist'
import { useRouter } from 'vue-router'

const profile = ref({
  account: '',
  role: '',
  watchlist: 0,
  avatar: '',
})
const watchlistStore = useWatchlistStore()

const router = useRouter()

const watchlistPreview = ref([])
const watchlistLoading = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL

const avatarSrc = computed(() => {
  const v = String(profile.value.avatar || '')
  if (!v) return ''
  // already absolute
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  // backend may return a path like /uploads/xxx.jpg
  return `${API_BASE}${v.startsWith('/') ? '' : '/'}${v}`
})

const fetchProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    ElMessage.error(data?.message || '讀取個人資料失敗')
    return
  }

  profile.value = data.result
  watchlistStore.setCount(profile.value.watchlist)
  fetchWatchlistPreview()
}

const fetchWatchlistPreview = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    watchlistPreview.value = []
    return
  }

  watchlistLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/user/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      watchlistPreview.value = []
      return
    }

    const list = Array.isArray(data?.result) ? data.result : []
    watchlistPreview.value = list.slice(0, 5)
  } finally {
    watchlistLoading.value = false
  }
}

const goStock = (it) => {
  router.push(`/stocks/${encodeURIComponent(it.market)}/${encodeURIComponent(it.symbol)}`)
}

const uploadAvatar = async ({ file }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('請先登入')
    return
  }

  const form = new FormData()
  form.append('image', file)

  const res = await fetch(`${API_BASE}/user/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    ElMessage.error(data?.message || '上傳頭像失敗')
    return
  }

  ElMessage.success('頭像已更新')
  // sync avatar for navbar
  if (data?.result?.avatar) {
    localStorage.setItem('avatar', data.result.avatar)
    window.dispatchEvent(new Event('avatar-updated'))
  }
  await fetchProfile()
}

onMounted(() => {
  fetchProfile()
  fetchWatchlistPreview()
})
</script>
