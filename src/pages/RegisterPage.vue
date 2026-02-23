<template>
  <section class="relative">
    <!-- 背景 -->
    <div class="absolute inset-0">
      <img :src="bg" alt="four cats background" class="h-full w-full object-center" />
      <div class="absolute inset-0 bg-black/20"></div>
    </div>
    <!-- 內容 -->
    <div class="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div class="w-full max-w-120 rounded-2xl bg-white/80 backdrop-blur p-6">
        <h1 class="text-xl font-semibold mb-4">註冊</h1>

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
              autocomplete="new-password"
              placeholder="請輸入密碼"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item label="確認密碼" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="請再次輸入密碼"
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
              註冊
            </el-button>
            <el-button class="flex-1" :disabled="loading" @click="onReset"> 重寫 </el-button>
          </div>

          <div class="mt-4 text-sm opacity-80">
            已有帳號？
            <RouterLink class="text-blue-600 hover:underline" to="/login">前往登入</RouterLink>
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
import { registerUser } from '@/api/user.api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const serverError = ref('')

const form = reactive({
  account: '',
  password: '',
  confirmPassword: '',
})

const validateAccount = (rule, value, callback) => {
  const v = String(value || '').trim()
  if (!v) return callback(new Error('請輸入帳號'))
  if (v.length < 4 || v.length > 20) return callback(new Error('帳號長度需 4–20'))
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return callback(new Error('帳號僅允許英文、數字、底線'))
  callback()
}

const validatePassword = (rule, value, callback) => {
  const v = String(value || '')
  if (!v) return callback(new Error('請輸入密碼'))
  if (v.length < 4) return callback(new Error('密碼至少 4 碼'))
  callback()
}

const validateConfirm = (rule, value, callback) => {
  if (!value) return callback(new Error('請再次輸入密碼'))
  if (value !== form.password) return callback(new Error('兩次密碼不一致'))
  callback()
}

const rules = {
  account: [{ validator: validateAccount, trigger: ['blur', 'change'] }],
  password: [{ validator: validatePassword, trigger: ['blur', 'change'] }],
  confirmPassword: [{ validator: validateConfirm, trigger: ['blur', 'change'] }],
}

const onSubmit = async () => {
  serverError.value = ''
  if (!formRef.value) return

  try {
    loading.value = true
    await formRef.value.validate()

    await registerUser({
      account: form.account.trim(),
      password: form.password,
    })

    ElMessage.success('註冊成功，請登入')
    router.push('/login')
  } catch (err) {
    // element-plus validate 失敗會丟出物件；API 失敗丟 Error
    const msg = err?.message || err?.userMessage
    if (msg) {
      serverError.value = msg
    } else {
      serverError.value = '註冊失敗'
    }
  } finally {
    loading.value = false
  }
}

const onReset = () => {
  serverError.value = ''
  formRef.value?.resetFields()
}
</script>
