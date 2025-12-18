-- ============================================================
-- MVP Schema для "Рядом" - БЕЗОПАСНЫЙ ВАРИАНТ (без DROP)
-- ============================================================
-- Используйте этот скрипт, если хотите избежать предупреждения
-- или если политики еще не созданы
-- ============================================================

-- 1. Создание таблицы запросов
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('thanks', 'money')),
  reward_amount INTEGER,
  district TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram', 'phone')),
  contact_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Создание таблицы откликов
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Создание индексов
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_district ON public.requests(district);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_request_id ON public.offers(request_id);
CREATE INDEX IF NOT EXISTS idx_offers_helper_id ON public.offers(helper_id);

-- 4. Включение Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 5. Создание политик для requests (если еще не созданы)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'requests' 
    AND policyname = 'Allow all reads'
  ) THEN
    CREATE POLICY "Allow all reads" ON public.requests
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'requests' 
    AND policyname = 'Allow all inserts'
  ) THEN
    CREATE POLICY "Allow all inserts" ON public.requests
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'requests' 
    AND policyname = 'Allow all updates'
  ) THEN
    CREATE POLICY "Allow all updates" ON public.requests
      FOR UPDATE
      USING (true);
  END IF;
END $$;

-- 6. Создание политик для offers (если еще не созданы)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'offers' 
    AND policyname = 'Allow all reads'
  ) THEN
    CREATE POLICY "Allow all reads" ON public.offers
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'offers' 
    AND policyname = 'Allow all inserts'
  ) THEN
    CREATE POLICY "Allow all inserts" ON public.offers
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- ГОТОВО! Теперь можно создавать запросы и отклики.
-- ============================================================



