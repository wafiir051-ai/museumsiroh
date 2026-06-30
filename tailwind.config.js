/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        siroh: {
          // Dark mode base (charcoal, bukan pure black)
          charcoal:   '#16161A',
          charcoal2:  '#1E1E23',
          charcoal3:  '#27272E',
          // Light mode base
          ink:     '#1A1A1A',
          paper:   '#FAFAF9',
          sand:    '#F0EFEC',
          // Aksen — dari museumsiroh.com
          orange:     '#E8923C',
          orangelight:'#F2AD66',
          teal:       '#2DD4BF',
          teallight:  '#5EEAD4',
          // Legacy aliases (biar komponen lama tetap jalan)
          green:   '#1B4D3E',
          emerald: '#1B7B5A',
          gold:    '#E8923C',
          goldlight:'#F2AD66',
          rust:    '#C0533A',
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'lattice': "radial-gradient(circle at 1px 1px, rgba(232,146,60,0.18) 1px, transparent 0)",
      }
    }
  },
  plugins: []
}
