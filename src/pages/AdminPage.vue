<template>
  <main class="mx-auto max-w-7xl px-4 pt-6">
    <div class="flex items-baseline justify-between mb-4">
      <h1 class="text-2xl font-semibold">管理</h1>
      <div class="flex items-center gap-2">
        <el-tag type="info">{{ envMode }}</el-tag>
      </div>
    </div>

    <!-- Gate: no token -->
    <div
      v-if="gate.state === 'no_token'"
      class="rounded-2xl bg-cat-tuxedo-light/30 border border-black/5 p-6"
    >
      <div class="text-lg font-medium mb-1">需要登入</div>
      <div class="text-sm opacity-70 mb-4">此頁面僅限管理員使用。</div>
      <el-button type="primary" @click="goLogin">前往登入</el-button>
    </div>

    <!-- Gate: not admin -->
    <div
      v-else-if="gate.state === 'forbidden'"
      class="rounded-2xl bg-cat-tuxedo-light/30 border border-black/5 p-6"
    >
      <div class="text-lg font-medium mb-1">無權限</div>
      <div class="text-sm opacity-70">目前登入角色：{{ me.role || '-' }}。此頁面僅限 admin。</div>
    </div>

    <!-- Ready -->
    <div v-else class="grid gap-4 md:grid-cols-3">
      <!-- 左欄：System + Health -->
      <section class="rounded-2xl bg-cat-tuxedo-light/30 border border-black/5 p-4 md:col-span-1">
        <div class="text-sm opacity-70 mb-3">System</div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="opacity-70">Account</span>
            <span class="truncate">{{ me.account || '-' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="opacity-70">Role</span>
            <span class="truncate">{{ me.role || '-' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="opacity-70">API Base</span>
            <span class="truncate max-w-40">{{ apiBase }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="opacity-70">Token</span>
            <span :class="tokenUi.bad ? 'text-red-600' : 'opacity-80'">{{ tokenUi.label }}</span>
          </div>
        </div>

        <el-divider />

        <div class="flex items-center justify-between mb-2">
          <div class="text-sm opacity-70">Health</div>
          <el-button size="small" :loading="health.loading" @click="fetchHealth">刷新</el-button>
        </div>

        <div v-if="health.error" class="text-sm text-red-600">{{ health.error }}</div>
        <div v-else class="space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="opacity-70">Server</span>
            <span class="truncate">{{ formatTime(health.data?.serverTime) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="opacity-70">DB</span>
            <span
              :class="
                health.data?.db === 'ok'
                  ? 'text-green-700'
                  : health.data?.db === 'unknown' || !health.data?.db
                    ? 'opacity-70'
                    : 'text-red-600'
              "
            >
              {{ health.data?.db || '-' }}
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="opacity-70">External</span>
            <span
              :class="
                health.data?.external === 'ok'
                  ? 'text-green-700'
                  : health.data?.external === 'unknown' || !health.data?.external
                    ? 'opacity-70'
                    : 'text-red-600'
              "
            >
              {{ health.data?.external || '-' }}
            </span>
          </div>
        </div>

        <el-divider />

        <div class="text-xs opacity-60 leading-relaxed">
          管理頁只做操作入口與可觀測資訊；最終權限以後端 JWT / middleware 為準。
        </div>
      </section>

      <!-- 右欄：Admin Tools + Recent Jobs -->
      <section class="rounded-2xl bg-cat-tuxedo-light/30 border border-black/5 p-4 md:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm opacity-70">Admin Tools</div>
          <el-tag type="info">v1</el-tag>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <!-- EOD Job -->
          <div class="rounded-xl border border-black/10 p-3 bg-white/40">
            <div class="font-medium mb-1">刷新收盤資料（EOD）</div>
            <div class="text-sm opacity-70 mb-3">以「任務制」執行，避免阻塞與超時。</div>

            <div class="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div class="text-xs opacity-70 mb-1">Market</div>
                <el-select v-model="eodForm.market" class="w-full" size="small">
                  <el-option label="TW" value="TW" />
                  <el-option label="US" value="US" />
                </el-select>
              </div>
              <div>
                <div class="text-xs opacity-70 mb-1">Days</div>
                <el-input-number
                  v-model="eodForm.days"
                  class="w-full"
                  size="small"
                  :min="1"
                  :max="30"
                />
              </div>
            </div>

            <el-button class="w-full" type="primary" :loading="eod.loading" @click="runEodJob">
              建立任務
            </el-button>

            <div
              v-if="eod.message"
              class="text-xs mt-2"
              :class="eod.error ? 'text-red-600' : 'text-green-700'"
            >
              {{ eod.message }}
            </div>
          </div>

          <!-- Placeholder tools (future) -->
          <div class="rounded-xl border border-black/10 p-3 bg-white/40">
            <div class="font-medium mb-1">刷新產業快取/清單</div>
            <div class="text-sm opacity-70 mb-3">之後可集中刷新產業頁與清單來源。</div>
            <el-button class="w-full" :loading="sector.loading" @click="runSectorSyncJob"
              >執行</el-button
            >
            <div
              v-if="sector.message"
              class="text-xs mt-2"
              :class="sector.error ? 'text-red-600' : 'text-green-700'"
            >
              {{ sector.message }}
            </div>
          </div>

          <div class="rounded-xl border border-black/10 p-3 bg-white/40">
            <div class="font-medium mb-1">檢查外部 API 狀態</div>
            <div class="text-sm opacity-70 mb-3">TWSE / FinMind 可用性檢查（即時）。</div>

            <el-button class="w-full" :loading="health.loading" @click="fetchHealth"
              >執行</el-button
            >

            <div class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <span class="opacity-70">TWSE</span>
                <span
                  :class="
                    health.data?.twse === 'ok'
                      ? 'text-green-700'
                      : health.data?.twse === 'unknown' || !health.data?.twse
                        ? 'opacity-70'
                        : 'text-red-600'
                  "
                >
                  {{ health.data?.twse || '-' }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="opacity-70">FinMind</span>
                <span
                  :class="
                    health.data?.finmind === 'ok'
                      ? 'text-green-700'
                      : health.data?.finmind === 'unknown' || !health.data?.finmind
                        ? 'opacity-70'
                        : 'text-red-600'
                  "
                >
                  {{ health.data?.finmind || '-' }}
                </span>
              </div>
            </div>

            <div v-if="health.error" class="text-xs text-red-600 mt-2">{{ health.error }}</div>
          </div>

          <div class="rounded-xl border border-black/10 p-3 bg-white/40">
            <div class="font-medium mb-1">使用者管理</div>
            <div class="text-sm opacity-70 mb-3">只讀清單（v1）。</div>
            <el-button class="w-full" :loading="users.loading" @click="openUsers">查看</el-button>
            <div v-if="users.error" class="text-xs text-red-600 mt-2">{{ users.error }}</div>
          </div>
        </div>

        <el-divider class="my-5" />

        <div class="flex items-center justify-between mb-2">
          <div class="text-sm opacity-70">Recent Jobs</div>
          <div class="flex items-center gap-2">
            <el-button size="small" :loading="jobs.loading" @click="fetchJobs">刷新</el-button>
            <el-button size="small" :disabled="!polling" @click="stopPolling">停止輪詢</el-button>
          </div>
        </div>

        <div v-if="jobs.error" class="text-sm text-red-600">{{ jobs.error }}</div>

        <div v-else-if="jobs.items.length === 0" class="text-sm opacity-70">
          尚無任務紀錄（或後端尚未提供 /admin/jobs）。
        </div>

        <div v-else class="rounded-xl overflow-hidden border border-black/10 bg-white/40">
          <el-table :data="jobs.items" class="w-full admin-jobs-table" table-layout="auto">
            <el-table-column prop="type" label="Type" width="140" />
            <el-table-column prop="status" label="Status" width="140">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)">{{ row.status || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="Created" min-width="180">
              <template #default="{ row }">
                {{ formatTime(row?.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="summary" label="Summary" min-width="260" />
          </el-table>
        </div>

        <div class="text-xs opacity-60 mt-3">
          輪詢策略：偵測到 running 任務時每 3 秒刷新；全為非 running 時停止。
        </div>
        <el-dialog v-model="users.open" title="使用者清單" width="720px">
          <div v-if="users.loading" class="text-sm opacity-70">Loading…</div>
          <div v-else-if="users.items.length === 0" class="text-sm opacity-70">目前沒有資料。</div>
          <div v-else class="rounded-xl overflow-hidden border border-black/10">
            <el-table :data="users.items" class="w-full" table-layout="auto">
              <el-table-column prop="account" label="Account" min-width="160" />
              <el-table-column prop="role" label="Role" width="140" />
              <el-table-column prop="createdAt" label="Created" min-width="180">
                <template #default="{ row }">{{ formatTime(row?.createdAt) }}</template>
              </el-table-column>
              <el-table-column prop="avatar" label="Avatar" width="120">
                <template #default="{ row }">
                  <el-avatar v-if="row.avatar" :src="row.avatar" :size="32" />
                  <span v-else class="text-xs opacity-60">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <template #footer>
            <el-button @click="users.open = false">關閉</el-button>
          </template>
        </el-dialog>
      </section>
    </div>
  </main>
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const apiBase = import.meta.env.VITE_API_BASE_URL 
const envMode = import.meta.env.MODE || 'dev'

const me = ref({ account: '', role: '' })

const gate = ref({ state: 'checking' }) // checking | no_token | forbidden | ready

const health = ref({ loading: false, data: null, error: '' })
const jobs = ref({ loading: false, items: [], error: '' })

const eodForm = ref({ market: 'TW', days: 3 })
const eod = ref({ loading: false, message: '', error: false })

const polling = ref(false)
const sector = ref({ loading: false, message: '', error: false })
const users = ref({ open: false, loading: false, items: [], error: '' })
let pollTimer = null

const decodePayload = (token) => {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

const tokenUi = computed(() => {
  const token = localStorage.getItem('token')
  if (!token) return { label: 'missing', bad: true }
  try {
    const p = decodePayload(token)
    const exp = Number(p?.exp)
    if (!Number.isFinite(exp)) return { label: 'ok', bad: false }
    const now = Math.floor(Date.now() / 1000)
    if (exp <= now) return { label: 'expired', bad: true }
    return { label: `ok (exp ${new Date(exp * 1000).toLocaleString()})`, bad: false }
  } catch {
    return { label: 'invalid', bad: true }
  }
})

const goLogin = () => router.push('/login')

const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fetchHealth = async () => {
  health.value.loading = true
  health.value.error = ''
  try {
    const r = await fetch(`${apiBase}/health`, { headers: authHeaders() })
    if (!r.ok) throw new Error(`health ${r.status}`)
    const j = await r.json()
    // 期待：{ result: { serverTime, db, external } } 或直接 { serverTime, db, external }
    health.value.data = j?.result ?? j
  } catch (e) {
    health.value.error = e?.message || 'health 失敗'
    health.value.data = null
  } finally {
    health.value.loading = false
  }
}

const statusTagType = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'success' || s === 'done') return 'success'
  if (s === 'failed' || s === 'error') return 'danger'
  if (s === 'running' || s === 'pending' || s === 'queued') return 'warning'
  return 'info'
}

const formatTime = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString()
}

const fetchJobs = async () => {
  jobs.value.loading = true
  jobs.value.error = ''
  try {
    const r = await fetch(`${apiBase}/admin/jobs?limit=10`, { headers: authHeaders() })
    if (!r.ok) throw new Error(`jobs ${r.status}`)
    const j = await r.json()
    const items = j?.result?.items ?? j?.items ?? []
    jobs.value.items = Array.isArray(items) ? items : []

    // polling: 有 running/queued/pending 才輪詢
    const hasRunning = jobs.value.items.some((it) =>
      ['running', 'queued', 'pending'].includes(String(it?.status || '').toLowerCase()),
    )
    if (hasRunning) startPolling()
    else stopPolling()
  } catch (e) {
    jobs.value.error = e?.message || 'jobs 失敗'
    jobs.value.items = []
    stopPolling()
  } finally {
    jobs.value.loading = false
  }
}

const startPolling = () => {
  if (pollTimer) return
  pollTimer = window.setInterval(() => {
    // 避免重疊
    if (!jobs.value.loading) fetchJobs()
  }, 3000)
  polling.value = true
}

const stopPolling = () => {
  if (!pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
  polling.value = false
}
const runSectorSyncJob = async () => {
  sector.value.loading = true
  sector.value.message = ''
  sector.value.error = false
  try {
    const r = await fetch(`${apiBase}/admin/jobs/sector-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({}),
    })
    if (!r.ok) throw new Error(`create job ${r.status}`)
    const j = await r.json()
    const jobId = j?.result?.jobId ?? j?.jobId
    sector.value.message = jobId ? `已建立任務：${jobId}` : '已建立任務'
    await fetchJobs()
  } catch (e) {
    sector.value.error = true
    sector.value.message = e?.message || '建立任務失敗'
  } finally {
    sector.value.loading = false
  }
}
const runEodJob = async () => {
  eod.value.loading = true
  eod.value.message = ''
  eod.value.error = false
  try {
    const body = {
      market: eodForm.value.market,
      days: eodForm.value.days,
    }

    const r = await fetch(`${apiBase}/admin/jobs/eod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    })

    if (!r.ok) throw new Error(`create job ${r.status}`)
    const j = await r.json()
    const jobId = j?.result?.jobId ?? j?.jobId

    eod.value.message = jobId ? `已建立任務：${jobId}` : '已建立任務'

    // 立即刷新 jobs
    await fetchJobs()
  } catch (e) {
    eod.value.error = true
    eod.value.message = e?.message || '建立任務失敗'
  } finally {
    eod.value.loading = false
  }
}

const fetchUsers = async () => {
  users.value.loading = true
  users.value.error = ''
  try {
    const r = await fetch(`${apiBase}/admin/users?limit=100`, { headers: authHeaders() })
    if (!r.ok) throw new Error(`users ${r.status}`)
    const j = await r.json()
    const items = j?.result?.items ?? j?.items ?? []
    users.value.items = Array.isArray(items) ? items : []
  } catch (e) {
    users.value.error = e?.message || 'users 失敗'
    users.value.items = []
  } finally {
    users.value.loading = false
  }
}

const openUsers = async () => {
  users.value.open = true
  if (users.value.items.length === 0 && !users.value.loading) {
    await fetchUsers()
  }
}
onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    gate.value.state = 'no_token'
    return
  }

  try {
    const p = decodePayload(token)
    me.value.account = p?.account || ''
    me.value.role = p?.role || ''

    if (String(me.value.role || '').toLowerCase() !== 'admin') {
      gate.value.state = 'forbidden'
      return
    }

    gate.value.state = 'ready'
    await Promise.all([fetchHealth(), fetchJobs()])
  } catch {
    gate.value.state = 'no_token'
  }
})

onBeforeUnmount(() => stopPolling())
</script>

<style scoped>
/* 讓 Recent Jobs 的 el-table 跟背景一致，不要預設白底 */
:deep(.admin-jobs-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-border-color: rgba(0, 0, 0, 0.08);
}

:deep(.admin-jobs-table .el-table__header-wrapper th.el-table__cell) {
  background-color: transparent;
}
</style>
