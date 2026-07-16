import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function ChartSlide({ content }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !content.chart) return

    if (chartRef.current) chartRef.current.destroy()

    const ctx = canvasRef.current.getContext('2d')
    const datasets = (content.chart.datasets ?? []).map((ds, i) => ({
      ...ds,
      borderColor: i === 0 ? '#f3f1ea' : '#888',
      backgroundColor: i === 0 ? 'rgba(243,241,234,0.15)' : 'rgba(136,136,136,0.15)',
      fill: ds.fill ?? false,
    }))

    chartRef.current = new Chart(ctx, {
      type: content.chart.variant ?? 'bar',
      data: { labels: content.chart.labels ?? [], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: '#f3f1ea',
        plugins: { legend: { labels: { color: '#f3f1ea' } } },
        scales: {
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(243,241,234,0.1)' } },
          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(243,241,234,0.1)' } },
        },
      },
    })

    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [content.chart])

  return (
    <div className="slide-layout">
      {content.title && <h2 className="slide-heading">{content.title}</h2>}
      <div className="slide-chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
