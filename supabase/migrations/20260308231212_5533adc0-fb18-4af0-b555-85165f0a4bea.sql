
CREATE TABLE public.ad_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Anyone can insert analytics events (anonymous tracking)
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ad analytics"
  ON public.ad_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read ad analytics"
  ON public.ad_analytics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast aggregation queries
CREATE INDEX idx_ad_analytics_slot_event ON public.ad_analytics (slot_name, event_type);
CREATE INDEX idx_ad_analytics_created ON public.ad_analytics (created_at);
