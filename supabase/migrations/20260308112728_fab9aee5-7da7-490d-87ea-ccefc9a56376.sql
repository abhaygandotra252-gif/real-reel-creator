
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  key_features TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  target_audience TEXT,
  niche_category TEXT,
  image_url TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);

-- Create scripts table
CREATE TABLE public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_style TEXT NOT NULL CHECK (video_style IN ('product-review', 'unboxing', 'tutorial', 'testimonial')),
  tone TEXT NOT NULL CHECK (tone IN ('casual', 'enthusiastic', 'professional', 'relatable')),
  duration TEXT NOT NULL CHECK (duration IN ('15s', '30s', '60s', '90s')),
  hook TEXT,
  body TEXT,
  cta TEXT,
  storyboard JSONB DEFAULT '[]',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scripts" ON public.scripts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scripts" ON public.scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scripts" ON public.scripts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete scripts" ON public.scripts FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
