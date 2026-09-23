export const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value)
