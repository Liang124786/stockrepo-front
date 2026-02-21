//先放著還未使用

export const isValidNum = (value) => {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
}

export const fmtPrice = (value) => {
  return isValidNum(value) ? String(value) : '--'
}

export const fmtChg = (value) => {
  if (!isValidNum(value)) return '--'
  const n = Number(value)
  const sign = n > 0 ? '+' : ''
  return `${sign}${n}`
}

export const fmtPct = (value) => {
  if (!isValidNum(value)) return '--'
  const n = Number(value) * 100
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export const chgClass = (chg) => {
  if (!isValidNum(chg)) return 'text-gray-600'
  const n = Number(chg)
  if (n > 0) return 'text-red-600'
  if (n < 0) return 'text-green-600'
  return 'text-gray-600'
}
