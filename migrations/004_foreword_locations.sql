ALTER TABLE public.foreword_timeline_events
  ADD COLUMN IF NOT EXISTS location TEXT;

CREATE INDEX IF NOT EXISTS foreword_timeline_events_location_idx
  ON public.foreword_timeline_events (location);
