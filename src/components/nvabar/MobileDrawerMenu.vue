<template>
  <el-drawer
    v-model="open"
    direction="ltr"
    size="80%"
    :with-header="false"
    :lock-scroll="false"
    class="cat-drawer"
  >
    <div class="p-4 flex flex-col gap-4 max-w-sm w-full mx-auto text-cat-tuxedo-light">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="font-semibold text-white text-4xl">Menu</div>

        <button
          type="button"
          class="rounded-lg p-3 text-white flex items-center justify-center hover:bg-cat-calico-brown"
          @click="close"
          aria-label="Close menu"
        >
          <el-icon size="24"><Close /></el-icon>
        </button>
      </div>

      <!-- Search (mobile) -->
      <div v-if="showSearch" class="flex flex-col gap-2">
        <div class="font-semibold text-white text-4xl">搜尋</div>

        <el-input
          v-model="qProxy"
          clearable
          placeholder="輸入代號或公司名稱（2330 / 2303）"
          @keydown.enter.prevent="onEnterClick"
          class="navbar-search focus:border-cat-orange-light"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-2 max-w-sm w-full mx-auto">
        <div class="font-semibold text-white text-4xl">功能</div>

        <!-- Industry (mobile, collapsible) -->
        <el-collapse v-model="mobileCollapse">
          <el-collapse-item name="industry">
            <template #title>
              <span class="font-semibold text-2xl text-cat-tuxedo-light">產業</span>
            </template>

            <div class="flex flex-col pt-1">
              <button
                type="button"
                class="text-left w-full rounded-lg px-3 py-2 mb-2 text-white bg-cat-orange-dark hover:bg-cat-calico-brown"
                @click="selectIndustry('')"
              >
                全部
              </button>

              <button
                v-for="industry in industries"
                :key="industry"
                type="button"
                class="text-left w-full rounded-lg px-3 py-2 mb-2 text-white bg-cat-orange-dark hover:bg-cat-calico-brown"
                @click="selectIndustry(industry)"
              >
                {{ industry }}
              </button>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- Navs -->
        <template v-for="nav in navs" :key="nav.to">
          <button
            v-if="nav.show"
            type="button"
            class="w-full flex items-center gap-3 rounded-lg border-none bg-cat-orange-dark text-cat-tuxedo-light hover:bg-cat-calico-brown transition-colors px-4 py-3 text-left"
            @click="go(nav.to)"
          >
            <el-icon>
              <component :is="icons[nav.icon]" />
            </el-icon>

            <span class="flex-1 min-w-0">{{ nav.title }}</span>

            <span
              v-if="nav.to === '/watchlist' && watchlistCount > 0"
              class="ml-auto text-sm opacity-70"
            >
              ({{ watchlistCount }})
            </span>
          </button>
        </template>

        <!-- Logout -->
        <button
          v-if="isLoggedIn"
          type="button"
          class="mt-2 w-full flex items-center gap-3 rounded-lg border-none bg-cat-orange-dark text-cat-tuxedo-light hover:bg-cat-calico-brown transition-colors px-4 py-3 text-left"
          @click="onLogoutClick"
        >
          <el-icon><SwitchButton /></el-icon>
          <span class="flex-1 min-w-0">登出</span>
        </button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  Search,
  SwitchButton,
  Close,
  UserFilled,
  Key,
  Star,
  Setting,
} from '@element-plus/icons-vue'

// A. Props / Emits (used everywhere)
const props = defineProps({
  modelValue: { type: Boolean, default: false },

  showSearch: { type: Boolean, default: false },
  q: { type: String, default: '' },

  industries: { type: Array, default: () => [] },
  navs: { type: Array, default: () => [] },

  watchlistCount: { type: Number, default: 0 },
  isLoggedIn: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:q', 'enter', 'industry', 'nav', 'logout'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// B. Header: close button
const close = () => {
  open.value = false
}

// C. Search (mobile)
const qProxy = computed({
  get: () => props.q,
  set: (v) => emit('update:q', v),
})

const onEnterClick = async () => {
  emit('enter')
  close()
}

// D. Actions: Industry / Navs / Logout
const mobileCollapse = ref([])

const selectIndustry = (value) => {
  emit('industry', value)
  close()
}

const go = (to) => {
  emit('nav', to)
  close()
}

const onLogoutClick = () => {
  emit('logout')
  close()
}

// E. Icons (used in nav buttons)
const icons = { UserFilled, Key, Star, Setting }
</script>

<style>
/* Drawer panel */
.cat-drawer .el-drawer__body {
  background: rgba(243, 200, 146, 0.92); /* cat-orange-light, slightly translucent */
  padding: 0;
}

/* Drawer container (sometimes used by Element Plus) */
.cat-drawer .el-drawer {
  background: transparent !important;
}

/* Remove default inner wrappers background */
.cat-drawer .el-overlay,
.cat-drawer .el-drawer__container {
  background: transparent !important;
}

/* Collapse base */
.cat-drawer .el-collapse {
  background-color: transparent !important;
  border: none !important;
}

.cat-drawer .el-collapse-item__wrap {
  background-color: transparent !important;
  border-bottom: none !important;
}

/* Collapse header as a full-width button */
.cat-drawer .el-collapse-item__header {
  width: 100%;
  box-sizing: border-box;
  border-bottom: none !important;

  background-color: #c97a2c !important; /* cat-orange-dark */
  color: #e5e7eb !important; /* cat-tuxedo-light */

  border-radius: 0.5rem;
  padding: 0.75rem 1rem !important; /* match other buttons (py-3 px-4) */
  height: auto !important;
  line-height: 1.2 !important;
}

.cat-drawer .el-collapse-item__header:hover {
  background-color: #5c4033 !important; /* cat-calico-brown */
}

.cat-drawer .el-collapse-item__arrow {
  color: #e5e7eb !important;
}

/* Collapse content area */
.cat-drawer .el-collapse-item__content {
  background-color: transparent !important;
  padding: 8px 0 !important;
}

/* Remove Element Plus header after overlay that can cause weird hover */
.cat-drawer .el-collapse-item__header::after {
  display: none !important;
}

/* Input inside drawer */
.cat-drawer .navbar-search .el-input__wrapper {
  border-radius: 1rem;
}
</style>
