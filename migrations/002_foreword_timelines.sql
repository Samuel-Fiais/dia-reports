CREATE TABLE IF NOT EXISTS public.foreword_timelines (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
  started_on DATE NOT NULL,
  ended_on DATE,
  latest_event_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'open' AND ended_on IS NULL) OR (status = 'resolved' AND ended_on IS NOT NULL)),
  CHECK (latest_event_on >= started_on),
  CHECK (ended_on IS NULL OR ended_on >= started_on)
);

CREATE TABLE IF NOT EXISTS public.foreword_timeline_events (
  id BIGSERIAL PRIMARY KEY,
  timeline_slug TEXT NOT NULL REFERENCES public.foreword_timelines(slug) ON DELETE CASCADE,
  occurred_on DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('start', 'dramatic', 'update', 'resolution')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_report_slug TEXT REFERENCES public.reports(slug) ON DELETE SET NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (timeline_slug, occurred_on, title)
);

CREATE INDEX IF NOT EXISTS foreword_timelines_latest_event_on_idx
  ON public.foreword_timelines (latest_event_on DESC, slug);
CREATE INDEX IF NOT EXISTS foreword_timeline_events_timeline_date_idx
  ON public.foreword_timeline_events (timeline_slug, occurred_on, id);
