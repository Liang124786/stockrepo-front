<template>
  <section class="relative">
    <!-- 背景 -->
    <div class="absolute inset-0">
      <img
        :src="bg"
        alt="four cats background"
        class="absolute inset-0 h-full w-full object-center"
      />
      <div class="absolute inset-0 bg-black/20"></div>
    </div>

    <!-- 內容 -->
    <div class="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div class="w-full max-w-120 rounded-2xl bg-white/90 shadow-xl backdrop-blur p-6">
        <h1 class="text-xl font-semibold mb-4">登入</h1>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @keyup.enter="onSubmit"
        >
          <el-form-item label="帳號" prop="account">
            <el-input
              v-model="form.account"
              autocomplete="username"
              placeholder="請輸入帳號"
              clearable
            />
          </el-form-item>

          <el-form-item label="密碼" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              placeholder="請輸入密碼"
              show-password
              clearable
            />
          </el-form-item>

          <div v-if="serverError" class="text-sm text-red-600 mb-3">
            {{ serverError }}
          </div>

          <div class="flex gap-3">
            <el-button
              type="primary"
              class="flex-1"
              :loading="loading"
              :disabled="loading"
              @click="onSubmit"
            >
              登入
            </el-button>
            <el-button class="flex-1" :disabled="loading" @click="onReset"> 重置 </el-button>
          </div>

          <div class="mt-4 text-sm opacity-80">
            還沒有帳號？
            <RouterLink class="text-blue-600 hover:underline" to="/register">前往註冊</RouterLink>
          </div>
        </el-form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import bg from '@/assets/four_cats.png'
import { loginUser } from '@/api/user.api'
import { useWatchlistStore } from '@/stores/watchlist'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const serverError = ref('')
const watchlistStore = useWatchlistStore()

// 登入成功後
watchlistStore.fetchCount()
window.dispatchEvent(new Event('auth:changed'))

const form = reactive({
  account: '',
  password: '',
})

const validateAccount = (rule, value, callback) => {
  const v = String(value || '').trim()
  if (!v) return callback(new Error('請輸入帳號'))
  callback()
}

const validatePassword = (rule, value, callback) => {
  const v = String(value || '')
  if (!v) return callback(new Error('請輸入密碼'))
  callback()
}

const rules = {
  account: [{ validator: validateAccount, trigger: ['blur', 'change'] }],
  password: [{ validator: validatePassword, trigger: ['blur', 'change'] }],
}

const onSubmit = async () => {
  serverError.value = ''
  if (!formRef.value) return

  try {
    loading.value = true
    await formRef.value.validate()

    const data = await loginUser({
      account: form.account.trim(),
      password: form.password,
    })

    // 依你後端回傳格式調整：
    // 常見是 result.token / result.accessToken / token
    const token =
      data?.result?.token || data?.token || data?.result?.accessToken || data?.accessToken || ''

    if (!token) {
      throw new Error('登入成功但未取得 token（請確認後端回傳格式）')
    }

    localStorage.setItem('token', token)
    window.dispatchEvent(new Event('auth:changed'))

    ElMessage.success('登入成功')
    router.push('/') // 你想導去哪裡可改
  } catch (err) {
    serverError.value = err?.message || '登入失敗'
  } finally {
    loading.value = false
  }
}

const onReset = () => {
  serverError.value = ''
  formRef.value?.resetFields()
}
</script>
