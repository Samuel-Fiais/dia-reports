import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { useAppTheme } from '../context/ThemeContext.jsx'
import { buildWaterfallBars } from '../lib/waterfall.js'

const INK = {
  light: {
    border: 'rgba(0,0,0,0.5)',
    tick: 'rgba(0,0,0,0.5)',
    grid: 'rgba(0,0,0,0.06)',
    legend: 'rgba(0,0,0,0.65)',
    base: '0,0,0',
  },
  dark: {
    border: 'rgba(243,241,234,0.6)',
    tick: 'rgba(243,241,234,0.6)',
    grid: 'rgba(243,241,234,0.1)',
    legend: 'rgba(243,241,234,0.75)',
    base: '243,241,234',
  },
}

const SERIES_ALPHA = [0.12, 0.24, 0.38, 0.52, 0.18, 0.32]
const SERIES_BORDER_ALPHA = [0.48, 0.68, 0.88, 0.58, 0.78, 0.98]
const SERIES_DASH = [[], [7, 4], [2, 3], [10, 3, 2, 3], [4, 3], [12, 4]]

// Estilos de preenchimento "tinta": 0 = sólido claro, 1 = hachurado, 2 = pontilhado.
// O índice da série varia discretamente densidade, opacidade e direção do padrão.
function makeInkFill(styleIndex, ink, seriesIndex = 0) {
  const alpha = SERIES_ALPHA[seriesIndex % SERIES_ALPHA.length]
  if (styleIndex === 0 || typeof document === 'undefined') return `rgba(${ink.base},${alpha})`
  const tile = document.createElement('canvas')
  tile.width = tile.height = 7
  const ctx = tile.getContext('2d')
  ctx.fillStyle = `rgba(${ink.base},${Math.max(0.025, alpha * 0.18)})`
  ctx.fillRect(0, 0, tile.width, tile.height)
  if (styleIndex === 2) {
    ctx.fillStyle = `rgba(${ink.base},${Math.min(0.72, alpha + 0.24)})`
    ctx.beginPath()
    const offset = seriesIndex % 2 ? 4.8 : 1.6
    ctx.arc(offset, 1.6, 0.75 + (seriesIndex % 3) * 0.12, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = `rgba(${ink.base},${Math.min(0.68, alpha + 0.22)})`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    if (seriesIndex % 2) {
      ctx.moveTo(0, 0)
      ctx.lineTo(7, 7)
    } else {
      ctx.moveTo(0, 7)
      ctx.lineTo(7, 0)
    }
    ctx.stroke()
  }
  return ctx.createPattern(tile, 'repeat')
}

function seriesBorder(ink, index) {
  return `rgba(${ink.base},${SERIES_BORDER_ALPHA[index % SERIES_BORDER_ALPHA.length]})`
}

function buildConfig(block, chartStyleIndex, ink) {
  const variant = block.variant ?? 'line'
  const labels = block.labels ?? []
  const datasets = block.datasets ?? []

  if (variant === 'waterfall') {
    // Cascata: barras flutuantes [início, fim] acumulando os deltas de block.items.
    const items = block.items ?? []
    const bars = buildWaterfallBars(items)
    return {
      type: 'bar',
      data: {
        labels: items.map((it) => it.label),
        datasets: [
          {
            data: bars.map((b) => b.range),
            backgroundColor: bars.map((b, index) => (b.total ? ink.border : makeInkFill(chartStyleIndex, ink, index))),
            borderColor: ink.border,
            borderWidth: 1,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = items[ctx.dataIndex]
                const bar = bars[ctx.dataIndex]
                if (bar.total) return `Total: ${bar.value}`
                return `${bar.value >= 0 ? '+' : ''}${bar.value}`
              },
            },
          },
        },
        scales: {
          y: { ticks: { color: ink.tick }, grid: { color: ink.grid } },
          x: { ticks: { color: ink.tick }, grid: { display: false } },
        },
      },
    }
  }

  if (variant === 'doughnut' || variant === 'pie') {
    const alphas = [0.16, 0.36, 0.6, 0.8, 0.26, 0.48]
    const shades = alphas.map((a) => `rgba(${ink.base},${a})`)
    return {
      type: variant,
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          data: ds.data,
          backgroundColor: shades.slice(0, (ds.data ?? []).length),
          borderColor: ink.border,
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: ink.legend } },
        },
      },
    }
  }

  const scales = {
    y: { beginAtZero: true, ticks: { color: ink.tick }, grid: { color: ink.grid } },
    x: { ticks: { color: ink.tick }, grid: { display: false } },
  }

  if (variant === 'bar') {
    return {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds, index) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: makeInkFill(chartStyleIndex, ink, index),
          borderColor: seriesBorder(ink, index),
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: datasets.length > 1, labels: { color: ink.legend } } },
        scales,
      },
    }
  }

  // line (com área preenchida, como nos exemplos do Dia)
  return {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        borderColor: seriesBorder(ink, index),
        backgroundColor: makeInkFill(chartStyleIndex, ink, index),
        borderWidth: 1.5 + (index % 3) * 0.35,
        borderDash: SERIES_DASH[index % SERIES_DASH.length],
        fill: ds.fill !== false,
        pointRadius: datasets.length > 1 ? 1.5 + (index % 2) : 0,
        pointBackgroundColor: seriesBorder(ink, index),
        tension: 0.3,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1, labels: { color: ink.legend } } },
      scales,
    },
  }
}

export default function ChartBlock({ block, chartStyleIndex = 2 }) {
  const canvasRef = useRef(null)
  const { appTheme } = useAppTheme()

  useEffect(() => {
    const ink = INK[appTheme] ?? INK.light
    const chart = new Chart(canvasRef.current, buildConfig(block, chartStyleIndex, ink))
    // O layout de impressão muda o tamanho de .chart-wrap depois que o canvas
    // já foi desenhado na tela — sem forçar um resize aqui, o Chart.js imprime
    // o bitmap antigo, cortado/comprimido no novo espaço.
    const handleBeforePrint = () => chart.resize()
    window.addEventListener('beforeprint', handleBeforePrint)
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      chart.destroy()
    }
  }, [block, chartStyleIndex, appTheme])

  return (
    <div className="chart-wrap">
      <canvas ref={canvasRef} style={{ height: block.height ?? 250 }} />
    </div>
  )
}
