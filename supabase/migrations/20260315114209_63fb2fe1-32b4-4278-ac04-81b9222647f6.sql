CREATE TABLE public.custom_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎙️',
  actors JSONB NOT NULL,
  scene_id TEXT NOT NULL DEFAULT 'studio',
  music_preset TEXT NOT NULL DEFAULT '',
  music_volume INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates" ON public.custom_templates
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert templates" ON public.custom_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can delete templates" ON public.custom_templates
  FOR DELETE TO anon, authenticated USING (true);