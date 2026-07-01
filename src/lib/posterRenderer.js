// src/lib/posterRenderer.js
//
// Render poster / story / flyer promosi secara dinamis ke <canvas>,
// dengan kode referral dan QR code yang otomatis sesuai akun partner yang login.
//
// Dependency: npm install qrcode

import QRCode from 'qrcode'

// ---------- Warna brand (sama seperti template asli) ----------
const COLORS = {
  bg: '#0d1117',
  bgWarm: '#1a0f08',
  teal: '#14b8a6',
  tealDark: '#0f3d38',
  orange: '#f59e42',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.55)',
  mutedFaint: 'rgba(255,255,255,0.25)',
  cream: '#f3efe7',
  ink: '#14171c',
}

const APP_URL = 'https://siroh-partner.vercel.app'

function buildLink(refCode) {
  return `${APP_URL}/go/${refCode}`
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawArch(ctx, x, y, w, h, color, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + w / 2)
  ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0, false)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

async function makeQrCanvas(refCode, size) {
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, buildLink(refCode), {
    width: size,
    margin: 0,
    color: { dark: '#0d1117', light: '#ffffff' },
  })
  return qrCanvas
}

// =====================================================================
// 1. POSTER FEED INSTAGRAM (1080x1080)
// =====================================================================
export async function drawPoster(canvas, refCode, partnerName = '') {
  const W = 1080,
    H = 1080
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, COLORS.bg)
  grad.addColorStop(1, COLORS.bgWarm)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  drawArch(ctx, 0, 560, 260, 420, COLORS.tealDark, 0.55)
  drawArch(ctx, 180, 480, 300, 500, COLORS.tealDark, 0.75)
  drawArch(ctx, 420, 560, 260, 420, COLORS.tealDark, 0.55)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLORS.white
  ctx.font = '700 30px Poppins, sans-serif'
  ctx.fillText('MUSEUM', 60, 90)
  const museumW = ctx.measureText('MUSEUM').width
  ctx.fillStyle = COLORS.teal
  ctx.font = '600 24px Poppins, sans-serif'
  ctx.fillText('SIROH NABAWIYAH', 60 + museumW + 14, 88)
  ctx.strokeStyle = COLORS.teal
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(60, 112)
  ctx.lineTo(420, 112)
  ctx.stroke()

  ctx.fillStyle = COLORS.white
  ctx.font = '800 56px Poppins, sans-serif'
  const headlineLines = wrapText(
    ctx,
    'Jejak Sejarah Nabi Muhammad, Kini Bisa Kamu Rasakan',
    620
  )
  let hy = 230
  headlineLines.forEach((line) => {
    ctx.fillText(line, 60, hy)
    hy += 66
  })

  ctx.fillStyle = COLORS.muted
  ctx.font = '400 26px Poppins, sans-serif'
  const subLines = wrapText(
    ctx,
    'Pameran interaktif, koleksi otentik & tur berpemandu di Museum Siroh Nabawiyah.',
    620
  )
  let sy = hy + 30
  subLines.forEach((line) => {
    ctx.fillText(line, 60, sy)
    sy += 34
  })

  const pillY = sy + 30
  ctx.fillStyle = COLORS.orange
  roundRect(ctx, 60, pillY, 240, 66, 33)
  ctx.fill()
  ctx.fillStyle = COLORS.ink
  ctx.font = '700 28px Poppins, sans-serif'
  ctx.fillText('Mulai Rp 60.000', 90, pillY + 43)

  const qrBoxSize = 264
  const qrBoxX = W - 60 - qrBoxSize
  const qrBoxY = H - 320
  ctx.fillStyle = COLORS.white
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24)
  ctx.fill()
  const qrCanvas = await makeQrCanvas(refCode, qrBoxSize - 32)
  ctx.drawImage(qrCanvas, qrBoxX + 16, qrBoxY + 16)

  ctx.fillStyle = COLORS.teal
  ctx.font = '600 22px Poppins, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Scan untuk pesan tiket', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 36)
  ctx.textAlign = 'left'

  ctx.fillStyle = COLORS.muted
  ctx.font = '400 22px Poppins, sans-serif'
  ctx.fillText('Kode referal partner:', 60, H - 100)

  ctx.font = '700 30px Poppins, sans-serif'
  const codeText = refCode
  const codeW = ctx.measureText(codeText).width + 44
  ctx.strokeStyle = COLORS.teal
  ctx.lineWidth = 2
  roundRect(ctx, 60, H - 80, codeW, 56, 12)
  ctx.stroke()
  ctx.fillStyle = COLORS.teal
  ctx.fillText(codeText, 82, H - 42)

  if (partnerName) {
    ctx.fillStyle = COLORS.mutedFaint
    ctx.font = '400 18px Poppins, sans-serif'
    ctx.fillText('Dibagikan oleh: ' + partnerName, 60, H - 12)
  }
}

// =====================================================================
// 2. STORY INSTAGRAM (1080x1920)
// =====================================================================
export async function drawStory(canvas, refCode) {
  const W = 1080,
    H = 1920
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  const archW = 220
  const archH = 480
  const archY = 60
  for (let i = -1; i <= 5; i++) {
    const isCenter = i === 2
    drawArch(
      ctx,
      i * (archW - 30),
      archY - (isCenter ? 40 : 0),
      archW,
      archH + (isCenter ? 40 : 0),
      COLORS.tealDark,
      isCenter ? 0.9 : 0.5
    )
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.white
  ctx.font = '700 34px Poppins, sans-serif'
  ctx.fillText('MUSEUM', W / 2 - 90, 145)
  ctx.fillStyle = COLORS.teal
  ctx.font = '600 26px Poppins, sans-serif'
  ctx.fillText('SIROH NABAWIYAH', W / 2 + 110, 143)

  ctx.fillStyle = COLORS.white
  ctx.font = '800 62px Poppins, sans-serif'
  ctx.textAlign = 'center'
  const lines = ['Rasakan Sejarah Nabi', 'Muhammad Lebih', 'Dekat']
  let hy = 700
  lines.forEach((line) => {
    ctx.fillText(line, W / 2, hy)
    hy += 78
  })

  const bullets = [
    'Koleksi otentik & artefak sejarah',
    'Tur berpemandu interaktif',
    'Cocok untuk semua usia',
  ]
  ctx.textAlign = 'left'
  let by = hy + 70
  bullets.forEach((b) => {
    ctx.fillStyle = COLORS.orange
    ctx.beginPath()
    ctx.arc(220, by - 10, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.white
    ctx.font = '500 32px Poppins, sans-serif'
    ctx.fillText(b, 254, by)
    by += 60
  })

  ctx.textAlign = 'center'
  const pillW = 420,
    pillH = 76
  const pillX = W / 2 - pillW / 2
  const pillY = by + 30
  ctx.fillStyle = COLORS.orange
  roundRect(ctx, pillX, pillY, pillW, pillH, 38)
  ctx.fill()
  ctx.fillStyle = COLORS.ink
  ctx.font = '700 32px Poppins, sans-serif'
  ctx.fillText('Tiket mulai Rp 60.000', W / 2, pillY + 49)

  const dividerY = 1450
  ctx.strokeStyle = COLORS.teal
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, dividerY)
  ctx.lineTo(W, dividerY)
  ctx.stroke()

  ctx.fillStyle = COLORS.muted
  ctx.font = '500 30px Poppins, sans-serif'
  ctx.fillText('Geser ke atas / scan QR', W / 2, dividerY + 90)

  const qrSize = 260
  const qrX = W / 2 - qrSize / 2
  const qrY = dividerY + 130
  ctx.fillStyle = COLORS.white
  roundRect(ctx, qrX, qrY, qrSize, qrSize, 24)
  ctx.fill()
  const qrCanvas2 = await makeQrCanvas(refCode, qrSize - 32)
  ctx.drawImage(qrCanvas2, qrX + 16, qrY + 16)

  const btnW = 560,
    btnH = 90
  const btnX = W / 2 - btnW / 2
  const btnY = qrY + qrSize + 60
  ctx.fillStyle = COLORS.teal
  roundRect(ctx, btnX, btnY, btnW, btnH, 45)
  ctx.fill()
  ctx.fillStyle = COLORS.ink
  ctx.font = '700 36px Poppins, sans-serif'
  ctx.fillText('Pesan Tiket Sekarang', W / 2, btnY + 58)

  ctx.textAlign = 'left'
}

// =====================================================================
// 3. FLYER CETAK A5
// =====================================================================
export async function drawFlyer(canvas, refCode, partnerName = '') {
  const W = 924,
    H = 1310
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const topH = 700
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, topH)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, topH)
  ctx.clip()
  const archW = 190
  for (let i = -1; i <= 6; i++) {
    drawArch(ctx, i * (archW - 20), 40, archW, 320, COLORS.tealDark, 0.7)
  }
  ctx.restore()

  ctx.fillStyle = COLORS.white
  ctx.font = '700 26px Poppins, sans-serif'
  ctx.fillText('MUSEUM', 48, 60)
  const mw = ctx.measureText('MUSEUM').width
  ctx.fillStyle = COLORS.teal
  ctx.font = '600 20px Poppins, sans-serif'
  ctx.fillText('SIROH NABAWIYAH', 48 + mw + 12, 58)

  ctx.fillStyle = COLORS.white
  ctx.font = '800 40px Poppins, sans-serif'
  ctx.fillText('Kunjungi Jejak Sejarah', 48, 150)
  ctx.fillText('Nabi Muhammad', 48, 198)

  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, topH, W, 380)
  ctx.fillStyle = COLORS.ink

  ctx.font = '400 22px Poppins, sans-serif'
  const bodyLines = wrapText(
    ctx,
    'Museum Siroh Nabawiyah menghadirkan pameran interaktif, koleksi otentik, dan tur berpemandu untuk mengenal lebih dekat perjalanan hidup Rasulullah. Cocok untuk kunjungan keluarga, sekolah, maupun majelis taklim.',
    W - 96
  )
  let ly = topH + 50
  bodyLines.forEach((line) => {
    ctx.fillText(line, 48, ly)
    ly += 30
  })

  ly += 20
  ctx.font = '700 24px Poppins, sans-serif'
  ctx.fillText('Yang bisa kamu nikmati:', 48, ly)
  ly += 36

  const feats = [
    'Koleksi artefak & replika sejarah otentik',
    'Ruang audiovisual & panel interaktif',
    'Tur berpemandu (opsional) untuk rombongan',
    'Area foto & suvenir museum',
  ]
  ctx.font = '400 21px Poppins, sans-serif'
  feats.forEach((f) => {
    ctx.fillStyle = COLORS.orange
    ctx.beginPath()
    ctx.arc(56, ly - 7, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.ink
    ctx.fillText(f, 76, ly)
    ly += 30
  })

  const boxY = ly + 20
  const boxH = 90
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 48, boxY, W - 96, boxH, 12)
  ctx.fill()

  ctx.fillStyle = 'rgba(20,23,28,0.5)'
  ctx.font = '400 16px Poppins, sans-serif'
  ctx.fillText('Harga Tiket Masuk', 70, boxY + 32)
  ctx.fillStyle = COLORS.ink
  ctx.font = '700 26px Poppins, sans-serif'
  ctx.fillText('Rp 60.000 / orang', 70, boxY + 66)

  ctx.fillStyle = 'rgba(20,23,28,0.5)'
  ctx.font = '400 16px Poppins, sans-serif'
  ctx.fillText('Jam Operasional', W / 2 + 40, boxY + 32)
  ctx.fillStyle = COLORS.ink
  ctx.font = '700 22px Poppins, sans-serif'
  ctx.fillText('09.00 - 20.00 WIB', W / 2 + 40, boxY + 62)

  const bottomY = topH + 380
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, bottomY, W, H - bottomY)

  const qrSize2 = 170
  const qrX2 = 48
  const qrY2 = bottomY + 60
  ctx.fillStyle = COLORS.white
  roundRect(ctx, qrX2, qrY2, qrSize2, qrSize2, 16)
  ctx.fill()
  const qrCanvas3 = await makeQrCanvas(refCode, qrSize2 - 24)
  ctx.drawImage(qrCanvas3, qrX2 + 12, qrY2 + 12)

  const textX = qrX2 + qrSize2 + 40
  ctx.fillStyle = COLORS.white
  ctx.font = '700 26px Poppins, sans-serif'
  ctx.fillText('Scan untuk pesan tiket', textX, qrY2 + 30)

  ctx.fillStyle = COLORS.muted
  ctx.font = '400 18px Poppins, sans-serif'
  ctx.fillText('atau kunjungi tautan berikut:', textX, qrY2 + 66)

  ctx.fillStyle = COLORS.teal
  ctx.font = '600 20px Poppins, sans-serif'
  ctx.fillText('siroh-partner.vercel.app/go/', textX, qrY2 + 96)
  ctx.font = '700 22px Poppins, sans-serif'
  ctx.fillText(refCode, textX, qrY2 + 126)

  if (partnerName) {
    ctx.fillStyle = COLORS.mutedFaint
    ctx.font = '400 16px Poppins, sans-serif'
    ctx.fillText('Dibagikan oleh mitra: ' + partnerName, textX, qrY2 + 158)
  }
}
