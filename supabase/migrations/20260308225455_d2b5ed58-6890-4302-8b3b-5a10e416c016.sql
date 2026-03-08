
-- Add placement column to control where ads appear
-- Values: 'all_pages', 'homepage', 'tool_pages', or a specific route like '/pdf-tools'
ALTER TABLE public.ad_placements
ADD COLUMN placement text NOT NULL DEFAULT 'all_pages';

-- Add a position column for ordering within the same placement
ALTER TABLE public.ad_placements
ADD COLUMN position text NOT NULL DEFAULT 'after_content';
-- position values: 'header', 'after_content', 'sidebar', 'between_tools', 'footer'
