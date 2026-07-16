import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { FONTS, FONT_SCALES } from '../../../lib/theme.js'

Chart.register(...registerables)

export default function ChartSlide({ content, variant, settings }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const isDark = variant !== 'detail'
  const fi = settings?.fontIndex ?? 0
  const font = FONTS[fi] ?? FONTS[0]
  const scale = FONT_SCALES.find(s => s.value === settings?.fontScale) ?? FONT_SCALES[1]
  const textColor = isDark ? '#f3f1ea' : '#1a1a1a'
  const tickColor = isDark ? '#aaa' : '#666'
  const gridColor = isDark ? 'rgba(243,241,234,0.1)' : 'rgba(0,0,0,0.08)'
  const borderColor = isDark ? '#f3f1ea' : '#1a1a1a'
  const bgColor = isDark ? 'rgba(243,241,234,0.15)' : 'rgba(0,0,0,0.08)'

  useEffect(() => {
    if (!canvasRef.current || !content.chart) return

    if (chartRef.current) chartRef.current.destroy()

    const ctx = canvasRef.current.getContext('2d')
    const datasets = (content.chart.datasets ?? []).map((ds, i) => ({
      ...ds,
      borderColor: i === 0 ? borderColor : '#888',
      backgroundColor: i === 0 ? bgColor : 'rgba(136,136,136,0.15)',
      fill: ds.fill ?? false,
    }))

    chartRef.current = new Chart(ctx, {
      type: content.chart.variant ?? 'bar',
      data: { labels: content.chart.labels ?? [], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: textColor,
        plugins: { legend: { labels: { color: textColor } } },
        scales: {
          x: { ticks: { color: tickColor, font: { family: font.bodyStack } }, grid: { color: gridColor } },
          y: { ticks: { color: tickColor, font: { family: font.bodyStack } }, grid: { color: gridColor } },
        },
      },
    })

    function handleBeforePrint() {
      if (chartRef.current) chartRef.current.resize()
    }
    window.addEventListener('beforeprint', handleBeforePrint)

    return () => {
      if (chartRef.current) chartRef.current.destroy()
      window.removeEventListener('beforeprint', handleBeforePrint)
    }
  }, [content.chart, textColor, tickColor, gridColor, borderColor, bgColor, font.bodyStack])

  return (
    <div className="slide-layout" style={{ fontSize: scale.size }}>
      {content.title && (
        <h2 className="slide-heading" style={{
          color: isDark ? '#fff' : 'var(--ink)',
          fontFamily: font.stack,
          fontStyle: font.style,
          fontWeight: font.weight,
        }}>{content.title}</h2>
      )}
      <div className="slide-chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
