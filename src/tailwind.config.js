/** @type {import('tailwindcss').Config} */
export default {
  content: ['./**/*.{vue,js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        /* ===== 基礎背景（長時間閱讀） ===== */
        base: {
          DEFAULT: '#FAFAF8',
          soft: '#F6F7F5',
        },

        /* ===== 文字 ===== */
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },

        /* ===== 貓系主題 ===== */
        cat: {
          /* 橘貓（主品牌色） */
          orange: {
            DEFAULT: '#E7A14A',
            light: '#F3C892',
            dark: '#C97A2C',
          },

          /* 三花（輔助） */
          calico: {
            cream: '#EFE7D8',
            brown: '#5C4033',
            black: '#2E2E2E',
          },

          /* 賓士貓（中性結構） */
          tuxedo: {
            dark: '#2A2A2A',
            light: '#E5E7EB',
          },
        },

        /* ===== 市場漲跌（金融友善） ===== */
        market: {
          up: '#D9776C',
          down: '#4CAF8C',
          flat: '#9CA3AF',
        },

        /* ===== 邊框 ===== */
        border: {
          DEFAULT: '#E5E7EB',
          soft: '#F0F1EF',
        },
      },
    },
  },
}
