import { useMemo } from 'react'
import { WORLD_MAP_HEIGHT, WORLD_MAP_PATHS, WORLD_MAP_WIDTH, projectLatLng } from './worldMapPaths.js'
import { parseForewordCalendarDate } from '../lib/forewordTimelines.js'
import { resolveLocation } from '../lib/geoLocations.js'

function recentStartDate() {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - 6)
  return start
}

function tooltipPoint(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

export default function ForewordMapView({ events, onOpen, tooltip, setTooltip }) {
  const { locations, locatedCount, missingCount } = useMemo(() => {
    const start = recentStartDate()
    const groups = new Map()
    let missing = 0

    events.forEach((event) => {
      const occurredOn = parseForewordCalendarDate(event.occurredOn)
      if (!occurredOn || occurredOn < start) return

      const place = resolveLocation(event.location)
      if (!place) {
        missing += 1
        return
      }

      const current = groups.get(place.key) ?? { ...place, events: [] }
      current.events.push(event)
      groups.set(place.key, current)
    })

    const nextLocations = Array.from(groups.values()).map((place) => ({
      ...place,
      events: place.events.sort((a, b) => (
        parseForewordCalendarDate(b.occurredOn).getTime() - parseForewordCalendarDate(a.occurredOn).getTime()
      )),
    })).sort((a, b) => b.events.length - a.events.length || a.label.localeCompare(b.label, 'pt-BR'))

    return {
      locations: nextLocations,
      locatedCount: nextLocations.reduce((total, place) => total + place.events.length, 0),
      missingCount: missing,
    }
  }, [events])

  const showTooltip = (event, pointerEvent) => {
    setTooltip({ event, x: pointerEvent.clientX, y: pointerEvent.clientY })
  }

  const showFocusTooltip = (event, focusEvent) => {
    setTooltip({ event, ...tooltipPoint(focusEvent) })
  }

  return (
    <section className="foreword-map-wrap" aria-label="Mapa">
      <p className="foreword-map-legend">
        Últimos 7 dias · {locatedCount} notícias em {locations.length} localizações
        {missingCount ? ` · ${missingCount} notícias sem localização definida` : ''}
      </p>
      <svg className="foreword-map" viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`} role="img" aria-label="Notícias dos últimos 7 dias por localização">
        <g className="foreword-map-land">
          {WORLD_MAP_PATHS.map((d, index) => <path key={index} d={d} />)}
        </g>
        {locations.map((place) => {
          const count = place.events.length
          const latestEvent = place.events[0]
          const { x, y } = projectLatLng(place.lat, place.lng)
          const radius = Math.min(28, 5 + 3.5 * Math.sqrt(count))
          const opacity = 0.14 + Math.min(0.3, count * 0.05)

          return (
            <g key={place.key} className="foreword-map-point">
              <circle
                tabIndex="0"
                role="button"
                className="foreword-map-bubble"
                cx={x}
                cy={y}
                r={radius}
                fillOpacity={opacity}
                aria-label={`${place.label}: ${count} notícias`}
                onMouseEnter={(event) => showTooltip(latestEvent, event)}
                onMouseMove={(event) => showTooltip(latestEvent, event)}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(event) => showFocusTooltip(latestEvent, event)}
                onBlur={() => setTooltip(null)}
                onClick={() => onOpen(latestEvent)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onOpen(latestEvent)
                  }
                }}
              />
              <text className="foreword-map-label" x={x + radius + 5} y={y + 4}>{place.label}</text>
            </g>
          )
        })}
      </svg>
      {locations.length === 0 ? <p className="foreword-state">Nenhuma notícia com localização definida nos últimos 7 dias.</p> : null}
    </section>
  )
}
