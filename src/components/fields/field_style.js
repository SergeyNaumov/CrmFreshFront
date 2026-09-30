// Ширина поля для «узких» контролов (date/time/datetime/daymon/yearmon).
// Приоритет: field.style -> field.width -> значение по умолчанию.
export function fieldWidthStyle(field, def) {
  if (!field) return { maxWidth: def }
  if (field.style) return field.style
  if (field.width !== undefined && field.width !== null && field.width !== '') {
    const w = String(field.width)
    return { maxWidth: /^\d+(\.\d+)?$/.test(w) ? w + 'px' : w }
  }
  return { maxWidth: def }
}
