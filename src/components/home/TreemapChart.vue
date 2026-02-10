<template>
  <div class="w-full">
    <!-- 標題 -->
    <h1 class="text-4xl text-cat-calico-cream font-bold pt-3">台股產業熱力圖</h1>
    <!-- Treemap 本體 -->
    <div ref="el" class="w-full min-h-[95vh]" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

/**
 * Props
 * - items: treemap 資料
 * - title: 標題（由外部傳，但只在這裡使用）
 */
const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: '面積：收盤價｜顏色：漲跌幅' },
})

const el = ref(null)
let chart = null
let ro = null

/* ---------- option builder（全部留在元件內） ---------- */

const makeOption = (items) => {
  const injectValue = (nodes = []) =>
    nodes.map((n) => {
      const area = Number(n.value ?? 0) || 0
      const pct = typeof n.changePct === 'number' ? n.changePct : 0

      return {
        ...n,
        value: [area, pct],
        changePct: typeof n.changePct === 'number' ? n.changePct : null,
        children: n.children ? injectValue(n.children) : undefined,
      }
    })

  return {
    title: {
      text: props.title,
      left: 'left',
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#F9F3E6',
      },
    },

    tooltip: {
      formatter: (p) => {
        const d = p.data || {}
        const name = d.name ?? '--'
        const close = Array.isArray(d.value) ? d.value[0] : d.value
        const closeText = Number.isFinite(close) ? close.toFixed(2) : '--'
        const pctText = typeof d.changePct === 'number' ? `${d.changePct.toFixed(2)}%` : '--'

        return [name, `收盤價：${closeText}`, `漲跌幅：${pctText}`].join('<br/>')
      },
    },

    visualMap: {
      type: 'piecewise',
      seriesIndex: 0,
      dimension: 1,
      pieces: [
        { lt: -1e-6, color: '#4CAF8C' },
        { gte: -1e-6, lte: 1e-6, color: '#9CA3AF' },
        { gt: 1e-6, color: '#D9776C' },
      ],
      show: false,
    },

    series: [
      {
        type: 'treemap',
        data: injectValue(items),
        roam: false,
        nodeClick: false,
        zoomToNodeRatio: 0,
        leafDepth: 1,
        breadcrumb: { show: false },
        levels: [
          {
            colorMappingBy: 'value',
            itemStyle: {
              borderWidth: 1,
              gapWidth: 1,
              borderColor: '#E7A14A',
            },
            upperLabel: { show: true },
          },
        ],
      },
    ],
  }
}

/* ---------- render control（只在資料 ready 時） ---------- */

const ensureChart = async () => {
  if (chart || !el.value) return

  await nextTick()
  chart = echarts.init(el.value)

  ro = new ResizeObserver(() => chart?.resize())
  ro.observe(el.value)

  window.addEventListener('resize', resize)
}

const resize = () => chart?.resize()

const rerenderSafely = async () => {
  // 避免容器剛顯示時尺寸尚未就緒，ECharts 會渲染成空白
  await nextTick()
  await new Promise((r) => requestAnimationFrame(() => r()))
  await render()
  chart?.resize()
}

onMounted(() => {
  rerenderSafely()
})

onActivated(() => {
  rerenderSafely()
})

onDeactivated(() => {
  // 保持一致：離開頁面時不做重渲染，只做 resize 清理
  chart?.resize()
})

const render = async () => {
  if (!props.items || props.items.length === 0) return
  await ensureChart()
  if (!chart) return
  chart.setOption(makeOption(props.items), true)
  chart.resize()
}

/* ---------- watch items（唯一觸發點） ---------- */

watch(
  () => props.items,
  () => {
    render()
  },
  { immediate: true, deep: true },
)

watch(
  () => (props.items || []).length,
  () => {
    render()
  },
  { immediate: true },
)
/* ---------- cleanup ---------- */

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  ro?.disconnect()
  ro = null
  chart?.dispose()
  chart = null
})
</script>
