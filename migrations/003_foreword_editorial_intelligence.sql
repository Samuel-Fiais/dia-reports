ALTER TABLE public.foreword_timeline_events
  ADD COLUMN IF NOT EXISTS impact_score INTEGER NOT NULL DEFAULT 50
    CHECK (impact_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS momentum TEXT NOT NULL DEFAULT 'stable'
    CHECK (momentum IN ('rising', 'stable', 'falling')),
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'national'
    CHECK (scope IN ('local', 'national', 'global'));

CREATE TABLE IF NOT EXISTS public.foreword_event_sources (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES public.foreword_timeline_events(id) ON DELETE CASCADE,
  outlet TEXT NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'corroboration'
    CHECK (source_kind IN ('primary', 'corroboration', 'context')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, url)
);

CREATE INDEX IF NOT EXISTS foreword_event_sources_event_idx
  ON public.foreword_event_sources (event_id, source_kind, outlet);
CREATE INDEX IF NOT EXISTS foreword_events_calendar_idx
  ON public.foreword_timeline_events (occurred_on, impact_score DESC, timeline_slug);
