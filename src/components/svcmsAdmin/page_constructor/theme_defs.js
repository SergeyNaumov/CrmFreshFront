function hex2rgb(h) {
  h = (h || '').replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(', ')
}
function shift(h, p) {
  const r = hex2rgb(h).split(', ').map(Number)
  return '#' + r.map(v => {
    v = Math.round(p > 0 ? v + (255 - v) * p : v * (1 + p))
    return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2)
  }).join('')
}
function lum(h) {
  const c = hex2rgb(h).split(', ').map(Number).map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function contrast(a, b) {
  const l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}
function bestOn(h) {
  return contrast(h, '#ffffff') >= contrast(h, '#111418') ? '#ffffff' : '#111418'
}
function fitBg(h, onHex, target) {
  const darken = lum(onHex) > 0.5
  let cur = h
  for (let i = 0; i < 60; i++) {
    if (contrast(cur, onHex) >= target) break
    cur = shift(cur, darken ? -0.02 : 0.02)
  }
  return cur
}

function build_color(v) {
  const dark = v.base === 'dark'
  const p = v.primary, s = v.secondary, a = v.accent
  const bodyBg = v['body-bg'], surface = v.surface
  const bodyColor = v['body-color'], heading = v.heading
  const muted = v.muted, strip = v.strip, cart = v.cart
  const onSurface = dark ? '#f2f4f7' : '#212529'
  const light = dark ? shift(surface, 0.08) : shift(bodyBg, -0.05)
  const border = dark ? shift(surface, 0.14) : shift(bodyBg, -0.12)
  const borderColor = dark ? shift(surface, 0.22) : shift(bodyBg, -0.2)
  const onPrimary = bestOn(p)
  const onCart = bestOn(cart)
  const secondaryDeep = fitBg(s, onPrimary, 4.6)
  return ':root {\n'
    + '  --primary: ' + p + ';\n'
    + '  --primary-rgb: ' + hex2rgb(p) + ';\n'
    + '  --primary-dark: ' + shift(p, -0.18) + ';\n'
    + '  --secondary: ' + s + ';\n'
    + '  --secondary-rgb: ' + hex2rgb(s) + ';\n'
    + '  --on-primary: ' + onPrimary + ';\n'
    + '  --accent: ' + a + ';\n'
    + '  --badge-new: var(--primary);\n'
    + '  --badge-promo: var(--accent);\n'
    + '  --badge-sale: var(--danger);\n'
    + '  --success: #198754;\n  --success-rgb: 25, 135, 84;\n'
    + '  --danger: #dc3545;\n  --danger-rgb: 220, 53, 69;\n'
    + '  --warning: #ffc107;\n  --warning-rgb: 255, 193, 7;\n'
    + '  --info: #0dcaf0;\n  --info-rgb: 13, 202, 240;\n'
    + '  --light: ' + light + ';\n  --light-rgb: ' + hex2rgb(light) + ';\n'
    + '  --dark: ' + (dark ? '#0b0e13' : '#212529') + ';\n  --dark-rgb: ' + (dark ? '11, 14, 19' : '33, 37, 41') + ';\n'
    + '  --body-bg: ' + bodyBg + ';\n'
    + '  --body-color: ' + bodyColor + ';\n'
    + '  --muted: ' + muted + ';\n'
    + '  --heading-color: ' + heading + ';\n'
    + '  --border: ' + border + ';\n'
    + '  --border-color: ' + borderColor + ';\n'
    + '  --callout-bg: rgba(var(--primary-rgb), ' + (dark ? '0.14' : '0.07') + ');\n'
    + '  --callout-border: rgba(var(--primary-rgb), ' + (dark ? '0.5' : '0.3') + ');\n'
    + '  --surface: ' + surface + ';\n  --surface-rgb: ' + hex2rgb(surface) + ';\n'
    + '  --on-surface: ' + onSurface + ';\n'
    + '  --topbar-bg: ' + strip + ';\n  --hero-bg: ' + strip + ';\n'
    + '  --hero-tint-rgb: ' + hex2rgb(strip) + ';\n'
    + '  --footer-bg: ' + strip + ';\n'
    + '  --link-color: var(--primary);\n  --link-hover: var(--primary-dark);\n'
    + '  --gradient: linear-gradient(135deg, var(--primary-dark) 0%, ' + secondaryDeep + ' 100%);\n'
    + '  --gradient-hover: linear-gradient(135deg, var(--primary) 0%, ' + secondaryDeep + ' 100%);\n'
    + '  --btn-cart: ' + cart + ';\n  --btn-cart-rgb: ' + hex2rgb(cart) + ';\n'
    + '  --on-btn-cart: ' + onCart + ';\n'
    + '  --white: #ffffff;\n  --white-rgb: 255, 255, 255;\n'
    + '  --ink: ' + strip + ';\n  --ink-rgb: ' + hex2rgb(strip) + ';\n'
    + '  --logo-filter: ' + (dark ? 'brightness(0) invert(1)' : 'none') + ';\n'
    + '  --catalog-curtain: linear-gradient(0deg, rgba(var(--primary-rgb), 0.82) 0%, rgba(var(--primary-rgb), 0.05) 48%);\n'
    + '  --catalog-plate: rgba(var(--primary-rgb), 0.95);\n'
    + '  --catalog-plate-text: var(--on-primary);\n'
    + '  --catalog-reveal: linear-gradient(0deg, rgba(var(--primary-rgb), 0.95) 0%, rgba(var(--primary-rgb), 0.55) 100%);\n'
    + '  --search-submit-bg: var(--primary);\n'
    + '  --search-submit-color: var(--on-primary);\n'
    + '  --fill-1: var(--surface);\n  --on-fill-1: var(--body-color);\n  --fill-1-border: var(--border);\n'
    + '  --fill-2: var(--light);\n  --on-fill-2: var(--body-color);\n'
    + '  --fill-3: var(--callout-bg);\n  --on-fill-3: var(--body-color);\n  --fill-3-border: var(--callout-border);\n'
    + '  --fill-4: var(--gradient);\n  --on-fill-4: var(--on-primary);\n  --fill-brand-4: var(--on-primary);\n'
    + '  --fill-5: var(--footer-bg);\n  --on-fill-5: var(--white);\n  --fill-brand-5: var(--white);\n'
    + '}\n'
}

function build_style(v) {
  const r = v.radius, rl = v['radius-lg'], bw = v.border
  const si = v['shadow-i'] / 100
  const type = v.shadow
  const padx = v.padx, cardpad = v.cardpad
  const hover = v.hover
  let sm, md, lg, bsm, bmd, bsh, chi, pill, float, cart, cartH, inset
  if (type === 'none') {
    sm = md = lg = 'none'
    bsm = bmd = bsh = chi = pill = float = cart = cartH = '0 0 0 0 transparent'
    inset = '0 0 0 0 transparent'
  } else if (type === 'hard') {
    sm = 'none'
    md = '6px 6px 0 rgba(var(--dark-rgb), ' + si + ')'
    lg = '8px 8px 0 rgba(var(--dark-rgb), ' + si + ')'
    bsm = '6px 6px 0 rgba(var(--dark-rgb), ' + si + ')'
    bmd = '2px 2px 0 rgba(var(--dark-rgb), ' + si + ')'
    bsh = '6px 6px 0 rgba(var(--success-rgb), ' + si + ')'
    chi = '5px 5px 0 rgba(var(--primary-rgb), ' + si + ')'
    pill = '4px 4px 0 rgba(var(--dark-rgb), ' + si + ')'
    float = '6px 6px 0 rgba(var(--primary-rgb), ' + si + ')'
    cart = '6px 6px 0 rgba(var(--dark-rgb), ' + si + ')'
    cartH = '2px 2px 0 rgba(var(--dark-rgb), ' + si + ')'
    inset = '0 0 0 0 transparent'
  } else {
    sm = '0 4px 12px rgba(var(--dark-rgb), ' + si + ')'
    md = '0 12px 32px rgba(var(--dark-rgb), ' + si + ')'
    lg = '0 24px 64px rgba(var(--dark-rgb), ' + si + ')'
    bsm = '0 10px 24px rgba(var(--secondary-rgb), ' + si + ')'
    bmd = '0 14px 30px rgba(var(--secondary-rgb), ' + (si + 0.12) + ')'
    bsh = '0 10px 24px rgba(var(--success-rgb), ' + si + ')'
    chi = '0 8px 20px rgba(var(--primary-rgb), ' + (si + 0.2) + ')'
    pill = '0 6px 16px rgba(var(--primary-rgb), ' + (si + 0.14) + ')'
    float = '0 12px 28px rgba(var(--primary-rgb), ' + (si + 0.2) + ')'
    cart = '0 10px 24px rgba(var(--btn-cart-rgb), ' + si + ')'
    cartH = '0 14px 32px rgba(var(--btn-cart-rgb), ' + (si + 0.12) + ')'
    inset = 'inset 0 1px 0 rgba(var(--white-rgb), 0.25)'
  }
  const hovT = hover === 'lift' ? 'translateY(-2px)' : (hover === 'press' ? 'translate(2px, 2px)' : 'none')
  const hovS = type === 'none' ? 'none' : 'var(--shadow-sm)'
  const cardT = hover === 'lift' ? 'translateY(-6px)' : (hover === 'press' ? 'translate(-4px, -4px)' : 'none')
  return ':root {\n'
    + '  --radius: ' + r + 'px;\n  --radius-xs: ' + Math.max(0, r - 4) + 'px;\n'
    + '  --radius-btn: ' + r + 'px;\n  --radius-lg: ' + rl + 'px;\n  --radius-pill: 50px;\n'
    + '  --border-width: ' + bw + 'px;\n  --border-width-accent: ' + Math.max(2, bw) + 'px;\n'
    + '  --shadow-sm: ' + sm + ';\n  --shadow-md: ' + md + ';\n  --shadow-lg: ' + lg + ';\n'
    + '  --shadow-inset: ' + inset + ';\n'
    + '  --shadow-btn-primary: ' + bsm + ';\n  --shadow-btn-primary-hover: ' + bmd + ';\n'
    + '  --shadow-btn-success: ' + bsh + ';\n  --shadow-btn-success-hover: ' + bsh + ';\n'
    + '  --shadow-btn-white: ' + bsm + ';\n  --shadow-btn-white-hover: ' + bmd + ';\n'
    + '  --shadow-chip: ' + chi + ';\n  --shadow-pill: ' + pill + ';\n  --shadow-float: ' + float + ';\n'
    + '  --shadow-btn-cart: ' + cart + ';\n  --shadow-btn-cart-hover: ' + cartH + ';\n'
    + '  --surface-2: var(--surface);\n  --card-radius: var(--radius-lg);\n'
    + '  --card-pad: ' + cardpad + 'px;\n  --card-hover-transform: ' + cardT + ';\n'
    + '  --btn-pad-x: ' + padx + 'px;\n  --btn-pad-y: 10px;\n'
    + '  --btn-hover-transform: ' + hovT + ';\n  --btn-hover-shadow: ' + hovS + ';\n'
    + '  --focus-ring: 0 0 0 4px color-mix(in srgb, var(--primary) 16%, transparent);\n'
    + '}\n'
}

function build_layout(v) {
  let css = ':root {\n'
    + '  --container: ' + v.container + 'px;\n'
    + '  --gutter: ' + v.gutter + 'px;\n'
    + '  --section-gap: ' + v['section-gap'] + 'px;\n'
    + '  --header-height: ' + v['header-height'] + 'px;\n'
    + '  --grid-gap: ' + v['grid-gap'] + 'px;\n'
    + '  --head-gap: ' + v['head-gap'] + 'px;\n'
    + '  --head-space: ' + v['head-space'] + 'px;\n'
    + '  --font-size-h1: ' + v.h1 + 'rem;\n'
    + '  --font-size-h2: ' + v.h2 + 'rem;\n'
    + '  --font-size-h3: ' + v.h3 + 'rem;\n'
    + '  --font-size-base: ' + v.base + 'px;\n'
    + '  --font-weight-heading: ' + v.hw + ';\n'
    + '  --grid-size: ' + v['grid-size'] + 'px;\n'
    + '}\n'
  /* Украшение заголовка секции (поле decor). Правила переопределяют
     базовый .section-title::after из style.css, поэтому каждый вариант
     явно снимает/переопределяет градиентную линию. */
  css += DECOR_CSS[v.decor] || ''
  return css
}

/* Варианты украшения заголовка секции. Ось layout не задаёт цвета:
   используются только токены (var(--primary) и т.п.), без литералов.
   Порядок и названия совпадают с полем decor в AXES.layout.fields. */
const DECOR_CSS = {
  none:
    '\n.section-title::before {\n  content: none;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n',
  base: '',
  line:
    '\n.section-title::after {\n  content: "";\n  display: block;\n  width: 48px;\n'
    + '  height: 3px;\n  margin-top: 12px;\n  border-radius: 0;\n  background: var(--primary);\n}\n',
  double:
    '\n.section-title::after {\n  content: "";\n  display: block;\n  width: 64px;\n'
    + '  height: 6px;\n  margin-top: 12px;\n  border-radius: 0;\n  background: none;\n'
    + '  border-top: 3px solid var(--primary);\n  border-bottom: 1px solid var(--primary);\n}\n',
  full:
    '\n.section-head {\n  padding-bottom: 18px;\n'
    + '  border-bottom: 1px solid var(--border-color);\n}\n'
    + '.section-title::after {\n  content: none;\n}\n',
  under:
    '\n.section-title {\n  text-decoration: underline;\n  text-decoration-thickness: 2px;\n'
    + '  text-underline-offset: 7px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n',
  top:
    '\n.section-title {\n  padding-top: 14px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0;\n'
    + '  width: 100%;\n  height: max(3px, var(--border-width-accent, 3px));\n'
    + '  background: var(--primary);\n}\n',
  'rule-both':
    '\n.section-title {\n  padding-top: 12px;\n  padding-bottom: 12px;\n'
    + '  border-top: 2px solid var(--primary);\n'
    + '  border-bottom: 2px solid var(--primary);\n}\n'
    + '.section-title::after {\n  content: none;\n}\n',
  left:
    '\n.section-title {\n  padding-left: 22px;\n'
    + '  font-size: var(--font-size-h2);\n  letter-spacing: normal;\n  text-transform: none;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0.12em;\n'
    + '  width: max(4px, var(--border-width-accent, 4px));\n  height: 0.9em;\n'
    + '  background: var(--primary);\n}\n',
  slash:
    '\n.section-title {\n  padding-left: 20px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 2px;\n  top: 0.1em;\n'
    + '  width: 3px;\n  height: 0.95em;\n  background: var(--primary);\n'
    + '  transform: rotate(18deg);\n}\n',
  dot:
    '\n.section-title {\n  padding-left: 20px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0.4em;\n'
    + '  width: 9px;\n  height: 9px;\n  border-radius: 50%;\n'
    + '  background: var(--primary);\n}\n',
  corner:
    '\n.section-title {\n  padding-left: 18px;\n  padding-right: 18px;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0;\n'
    + '  width: 10px;\n  height: 10px;\n  border-left: 2px solid var(--primary);\n'
    + '  border-top: 2px solid var(--primary);\n}\n'
    + '.section-title::after {\n  content: "";\n  position: absolute;\n  right: 0;\n  bottom: 0;\n'
    + '  width: 10px;\n  height: 10px;\n  border-right: 2px solid var(--primary);\n'
    + '  border-bottom: 2px solid var(--primary);\n}\n',
  'corner-tl':
    '\n.section-title {\n  padding-top: 12px;\n  padding-left: 12px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0;\n'
    + '  width: 14px;\n  height: 14px;\n  border-left: 2px solid var(--primary);\n'
    + '  border-top: 2px solid var(--primary);\n}\n',
  'corner-br':
    '\n.section-title {\n  padding-right: 12px;\n  padding-bottom: 12px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  right: 0;\n  bottom: 0;\n'
    + '  width: 14px;\n  height: 14px;\n  border-right: 2px solid var(--primary);\n'
    + '  border-bottom: 2px solid var(--primary);\n}\n',
  bracket:
    '\n.section-title {\n  padding-left: 14px;\n  padding-bottom: 12px;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
    + '.section-title::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  bottom: 0;\n'
    + '  width: 12px;\n  height: 12px;\n  border-left: 2px solid var(--primary);\n'
    + '  border-bottom: 2px solid var(--primary);\n}\n'
    + '.section-title::after {\n  content: "";\n  position: absolute;\n  right: 0;\n  bottom: 0;\n'
    + '  width: 12px;\n  height: 12px;\n  border-right: 2px solid var(--primary);\n'
    + '  border-bottom: 2px solid var(--primary);\n}\n',
  pill:
    '\n.section-title {\n  padding: 8px 20px;\n  border-radius: var(--radius-pill, 999px);\n'
    + '  background: var(--primary);\n  color: var(--on-primary);\n}\n'
    + '.section-title::before {\n  content: none;\n}\n'
    + '.section-title::after {\n  content: none;\n}\n'
}

function build_font(v) {
  const body = v.body
  const heading = v.heading || body
  const size = v.size, lh = v.lh, hw = v.hw, ls = v.ls
  return ':root {\n'
    + '  --font: ' + body + ';\n'
    + '  --font-heading: ' + heading + ';\n'
    + '  --font-size-base: ' + size + 'px;\n'
    + '  --font-weight-heading: ' + hw + ';\n'
    + '}\n'
    + 'body { line-height: ' + lh + '; }\n'
    + 'h1, h2, h3, .section-title { letter-spacing: ' + ls + 'em; }\n'
}

export const LAYOUT_PRESETS = {
  standard: { container: 1240, gutter: 20, 'section-gap': 88, 'header-height': 80, 'grid-gap': 24, 'head-gap': 24, 'head-space': 44, h1: 2.5, h2: 2, h3: 1.35, base: 16, hw: 700, 'grid-size': 32, decor: 'base' },
  industrial: { container: 1320, gutter: 24, 'section-gap': 72, 'header-height': 72, 'grid-gap': 24, 'head-gap': 32, 'head-space': 28, h1: 2.8, h2: 2.15, h3: 1.45, base: 16, hw: 800, 'grid-size': 32, decor: 'line' },
  elegant: { container: 1280, gutter: 22, 'section-gap': 96, 'header-height': 84, 'grid-gap': 28, 'head-gap': 20, 'head-space': 48, h1: 2.6, h2: 2.05, h3: 1.35, base: 16, hw: 600, 'grid-size': 32, decor: 'base' },
  editorial: { container: 1080, gutter: 24, 'section-gap': 104, 'header-height': 88, 'grid-gap': 32, 'head-gap': 18, 'head-space': 52, h1: 3, h2: 2.3, h3: 1.5, base: 17, hw: 700, 'grid-size': 32, decor: 'full' },
  wide: { container: 1440, gutter: 28, 'section-gap': 80, 'header-height': 84, 'grid-gap': 28, 'head-gap': 28, 'head-space': 44, h1: 2.7, h2: 2.1, h3: 1.4, base: 16, hw: 700, 'grid-size': 32, decor: 'base' },
  compact: { container: 1200, gutter: 16, 'section-gap': 56, 'header-height': 68, 'grid-gap': 16, 'head-gap': 16, 'head-space': 28, h1: 2.15, h2: 1.75, h3: 1.25, base: 15, hw: 700, 'grid-size': 24, decor: 'base' },
  technical: { container: 1300, gutter: 24, 'section-gap': 80, 'header-height': 76, 'grid-gap': 24, 'head-gap': 28, 'head-space': 36, h1: 2.6, h2: 2.05, h3: 1.4, base: 16, hw: 700, 'grid-size': 32, decor: 'left' }
}

export const AXES = {
  color: {
    title: 'Конструктор цветовой схемы',
    build: build_color,
    facts: { '--primary': 'primary', '--secondary': 'secondary', '--accent': 'accent', '--body-bg': 'body-bg' },
    fields: [
      { id: 'name', label: 'Название схемы (файл)', type: 'text', def: 'myscheme' },
      { id: 'base', label: 'База', type: 'select', def: 'light', options: [['light', 'Светлая'], ['dark', 'Тёмная']] },
      { id: 'primary', label: 'Primary', type: 'color', def: '#4f46e5' },
      { id: 'secondary', label: 'Secondary', type: 'color', def: '#8b5cf6' },
      { id: 'accent', label: 'Accent (Хит)', type: 'color', def: '#f59e0b' },
      { id: 'cart', label: '«В корзину»', type: 'color', def: '#4f46e5' },
      { id: 'body-bg', label: 'Фон страницы', type: 'color', def: '#eef1f6' },
      { id: 'surface', label: 'Поверхность', type: 'color', def: '#ffffff' },
      { id: 'body-color', label: 'Текст', type: 'color', def: '#3f4a57' },
      { id: 'heading', label: 'Заголовки', type: 'color', def: '#2f3640' },
      { id: 'muted', label: 'Приглушённый', type: 'color', def: '#7d8794' },
      { id: 'strip', label: 'Тёмная полоса', type: 'color', def: '#14171c' }
    ]
  },
  style: {
    title: 'Конструктор стиля',
    build: build_style,
    facts: { '--radius': 'radius', '--border-width': 'border', '--card-pad': 'cardpad', '--btn-pad-x': 'padx' },
    fields: [
      { id: 'name', label: 'Название стиля (файл)', type: 'text', def: 'mystyle' },
      { id: 'radius', label: 'Базовое скругление', type: 'range', def: 8, min: 0, max: 28, step: 1, unit: 'px' },
      { id: 'radius-lg', label: 'Крупное скругление', type: 'range', def: 12, min: 0, max: 36, step: 1, unit: 'px' },
      { id: 'border', label: 'Толщина рамок', type: 'range', def: 1, min: 0, max: 4, step: 1, unit: 'px' },
      { id: 'shadow', label: 'Тени', type: 'select', def: 'soft', options: [['none', 'Нет'], ['soft', 'Мягкие'], ['hard', 'Жёсткие (смещение)']] },
      { id: 'shadow-i', label: 'Интенсивность тени', type: 'range', def: 12, min: 4, max: 40, step: 1, unit: '%' },
      { id: 'padx', label: 'Отступы кнопки X', type: 'range', def: 22, min: 10, max: 40, step: 1, unit: 'px' },
      { id: 'hover', label: 'Hover кнопки', type: 'select', def: 'lift', options: [['lift', 'Подъём'], ['none', 'Без'], ['press', 'Вдавливание']] },
      { id: 'cardpad', label: 'Отступ карточки', type: 'range', def: 16, min: 8, max: 32, step: 1, unit: 'px' }
    ]
  },
  layout: {
    title: 'Конструктор компоновки',
    build: build_layout,
    facts: { '--container': 'container', '--gutter': 'gutter', '--section-gap': 'section-gap', '--header-height': 'header-height', '--font-size-h1': 'h1' },
    fields: [
      { id: 'name', label: 'Название компоновки (файл)', type: 'text', def: 'mylayout' },
      { id: 'preset', label: 'Пресет', type: 'preset' },
      { id: 'container', label: 'Контейнер', type: 'number', def: 1240, min: 960, max: 1600, step: 20, unit: 'px' },
      { id: 'gutter', label: 'Боковые отступы', type: 'number', def: 20, min: 12, max: 40, unit: 'px' },
      { id: 'section-gap', label: 'Ритм секций', type: 'number', def: 88, min: 40, max: 140, step: 4, unit: 'px' },
      { id: 'header-height', label: 'Высота шапки', type: 'number', def: 80, min: 56, max: 110, unit: 'px' },
      { id: 'grid-gap', label: 'Гэп сеток', type: 'number', def: 24, min: 8, max: 40, unit: 'px' },
      { id: 'head-gap', label: 'Гэп шапки секции', type: 'number', def: 24, min: 8, max: 40, unit: 'px' },
      { id: 'head-space', label: 'Отступ под шапкой секции', type: 'number', def: 44, min: 16, max: 72, step: 4, unit: 'px' },
      { id: 'h1', label: 'H1', type: 'number', def: 2.5, min: 1.8, max: 3.6, step: 0.05, unit: 'rem' },
      { id: 'h2', label: 'H2', type: 'number', def: 2, min: 1.4, max: 3, step: 0.05, unit: 'rem' },
      { id: 'h3', label: 'H3', type: 'number', def: 1.35, min: 1.1, max: 2, step: 0.05, unit: 'rem' },
      { id: 'base', label: 'Базовый размер', type: 'number', def: 16, min: 14, max: 20, unit: 'px' },
      { id: 'hw', label: 'Вес заголовков', type: 'number', def: 700, min: 400, max: 900, step: 100 },
      { id: 'grid-size', label: 'Шаг декоративной сетки', type: 'number', def: 32, min: 0, max: 80, step: 8, unit: 'px' },
      { id: 'decor', label: 'Украшение заголовка секции', type: 'select', def: 'base', options: [
        ['#', 'Без оформления'],
        ['none', 'Без украшения'],
        ['#', 'Линии и полосы'],
        ['base', 'Градиентная линия (по умолчанию)'],
        ['line', 'Короткая черта снизу'],
        ['double', 'Двойная черта снизу'],
        ['full', 'Линия во всю ширину'],
        ['top', 'Полоска сверху'],
        ['rule-both', 'Линии сверху и снизу'],
        ['under', 'Подчёркивание текста'],
        ['#', 'Акцентные маркеры'],
        ['left', 'Полоска слева'],
        ['slash', 'Косая черта'],
        ['dot', 'Точка-маркер'],
        ['#', 'Уголки'],
        ['corner', 'Угловые метки (диагональ)'],
        ['corner-tl', 'Уголок сверху слева'],
        ['corner-br', 'Уголок снизу справа'],
        ['bracket', 'Уголки-скобки по краям'],
        ['#', 'Заливка'],
        ['pill', 'Заголовок на плашке']
      ] }
    ]
  },
  font: {
    title: 'Конструктор шрифта',
    build: build_font,
    facts: { '--font': 'body', '--font-heading': 'heading' },
    fields: [
      { id: 'name', label: 'Название схемы', type: 'text', def: 'myfont' },
      { id: 'body', label: 'Стек текста (--font)', type: 'text', def: "'Inter', system-ui, sans-serif" },
      { id: 'heading', label: 'Стек заголовков (--font-heading)', type: 'text', def: '' },
      { id: 'size', label: 'Базовый размер', type: 'range', def: 16, min: 13, max: 20, step: 1, unit: 'px' },
      { id: 'lh', label: 'Межстрочный', type: 'range', def: 1.5, min: 1.2, max: 1.9, step: 0.05 },
      { id: 'hw', label: 'Вес заголовков', type: 'range', def: 700, min: 400, max: 900, step: 100 },
      { id: 'ls', label: 'Межбуквенный заголовков', type: 'range', def: 0, min: -0.03, max: 0.12, step: 0.01 }
    ]
  }
}

export function default_values(axis) {
  const out = {}
  AXES[axis].fields.forEach(f => { out[f.id] = f.def })
  return out
}

export const SHOWCASE_CSS = `
.ed-play { display: flex; flex-direction: column; gap: 18px; }
.ed-card { padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
.ed-card__title { margin: 0 0 14px; font-size: var(--font-size-h4, 18px); color: var(--heading-color); }
.ed-grid { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.ed-strip { padding: 14px 18px; color: var(--on-fill-5, #fff); background: var(--topbar-bg); border-radius: var(--radius); }
.ed-hero { padding: 28px; color: var(--on-primary, #fff); background: var(--gradient); border-radius: var(--radius-lg); }
.ed-badges { display: flex; gap: 8px; }
.ed-badge { padding: 4px 10px; font-size: 12px; font-weight: 700; color: #fff; border-radius: var(--radius-pill); }
.ed-badge--new { background: var(--badge-new, var(--primary)); }
.ed-badge--promo { background: var(--badge-promo, var(--accent)); }
.ed-badge--sale { background: var(--badge-sale, var(--danger)); }
.ed-callout { padding: 12px 14px; color: var(--body-color); background: var(--callout-bg); border-left: 3px solid var(--callout-border); border-radius: var(--radius); }
.ed-head { margin-top: 6px; }
.ed-head .section-sub { margin-top: 14px; max-width: 560px; }

/* --- Демонстрация оси layout: каждый параметр виден в превью ---
   Разметка использует настоящие классы шаблона (.container, .section,
   .section-head, .section-title, .header__main), поэтому превью
   показывает ровно те токены, которые меняет редактор компоновки. */
.ed-tokens { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 16px; padding: 0; list-style: none; }
.ed-tokens li { padding: 3px 8px; font-family: ui-monospace, monospace; font-size: 11px; color: var(--body-color); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius-pill); }
.ed-header { background: var(--surface-2); border-bottom: 1px solid var(--border); }
.ed-header__main { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-top: 16px; padding-bottom: 16px; min-height: var(--header-height, 80px); }
.ed-logo { font-size: var(--font-size-h4, 18px); font-weight: 800; color: var(--heading-color); }
.ed-header__nav { display: flex; gap: 18px; }
.ed-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--grid-gap, 24px); }
.ed-tile { padding: 14px; font-size: var(--font-size-sm, 13px); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.ed-type > * { margin: 0 0 8px; }
.ed-type p { margin: 0; font-size: var(--font-size-base, 16px); }
.ed-gridsize { display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--grid-size, 32px), 1fr)); gap: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.ed-gridsize i { height: var(--grid-size, 32px); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
`

export const SHOWCASE_HTML = `
<div class="ed-play">
  <ul class="ed-tokens">
    <li>--container</li><li>--gutter</li><li>--section-gap</li><li>--header-height</li>
    <li>--grid-gap</li><li>--head-gap</li><li>--head-space</li><li>--grid-size</li>
    <li>--font-size-h1/h2/h3</li><li>--font-size-base</li><li>--font-weight-heading</li>
  </ul>

  <div class="ed-header">
    <div class="ed-header__main container">
      <span class="ed-logo">Логотип</span>
      <nav class="ed-header__nav"><a href="#">Услуги</a><a href="#">Товары</a><a href="#">О компании</a><a href="#">Контакты</a></nav>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <h2 class="section-title">Наши преимущества</h2>
        <a class="section-head__link" href="#">Все услуги</a>
      </div>
      <p class="section-sub">Подзаголовок секции — проверка отступа <b>--head-space</b> и промежутка <b>--head-gap</b> между заголовком и ссылкой.</p>
      <div class="ed-grid3">
        <div class="ed-tile">Плитка 1 — зазор <b>--grid-gap</b></div>
        <div class="ed-tile">Плитка 2 — зазор <b>--grid-gap</b></div>
        <div class="ed-tile">Плитка 3 — зазор <b>--grid-gap</b></div>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="section-head">
        <h2 class="section-title">Типографика</h2>
      </div>
      <div class="ed-type">
        <h1>Заголовок H1 — кегль и начертание</h1>
        <h2>Заголовок H2 — как в секциях</h2>
        <h3>Заголовок H3 — подзаголовок блока</h3>
        <p>Базовый текст задаёт <b>--font-size-base</b>. Вес всех заголовков — <b>--font-weight-heading</b>: видно, что он применяется к H1, H2 и H3.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <h2 class="section-title">Шаг сетки</h2>
      </div>
      <div class="ed-gridsize">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
    </div>
  </section>

  <div class="ed-card">
    <h3 class="ed-card__title">Кнопки и бейджи</h3>
    <div class="ed-grid">
      <button class="btn btn-primary" type="button">Основная</button>
      <button class="btn btn-outline" type="button">Контурная</button>
      <button class="btn btn-primary product-card__buy" type="button">В корзину</button>
      <div class="ed-badges">
        <span class="ed-badge ed-badge--new">Новинка</span>
        <span class="ed-badge ed-badge--promo">Хит</span>
        <span class="ed-badge ed-badge--sale">Акция</span>
      </div>
    </div>
  </div>
  <div class="ed-card">
    <h3 class="ed-card__title">Карточка товара</h3>
    <article class="product-card">
      <div class="product-card__media"><img src="images/good/good_1_1.webp" alt="Товар" loading="lazy"></div>
      <div class="product-card__body">
        <h3 class="product-card__title"><a href="#">Смартфон X1 Pro</a></h3>
        <p class="product-card__anons">6.7" AMOLED, 128 ГБ, камера 50 Мп, NFC</p>
        <div class="product-card__price-row"><span class="product-card__price">29 990 ₽</span><span class="product-card__price-old">34 990 ₽</span></div>
        <button class="btn btn-primary btn-sm product-card__buy" type="button">В корзину</button>
      </div>
    </article>
  </div>
  <div class="ed-card">
    <h3 class="ed-card__title">Форма и выноска</h3>
    <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" placeholder="mail@example.com"></div>
    <p class="ed-callout">Выноска-анонс: тонируется брендовым цветом.</p>
  </div>
  <div class="ed-hero">Hero-блок на брендовом градиенте — <a href="#">ссылка</a></div>
  <div class="ed-strip">Тёмная полоса (topbar/hero/footer) — цвет схемы</div>
</div>
`
