-- ============================================
-- PokéTracker — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Cards table: one row per card in the collection
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  set_name TEXT,
  card_number TEXT,
  rarity TEXT,
  hp TEXT,
  card_type TEXT,
  pokemon_type TEXT,
  condition TEXT,
  condition_notes TEXT,
  image_url TEXT,
  ai_description TEXT,
  ai_valuation_notes TEXT,
  current_value DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price snapshots: every time a card is valued, store it here
CREATE TABLE IF NOT EXISTS price_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  estimated_value DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio snapshots: total collection value over time (created on Re-value All)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_value DECIMAL(10, 2) NOT NULL,
  card_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS — this is a personal app with no authentication needed
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Storage bucket for card images
-- Run this separately OR create manually in
-- Supabase Dashboard > Storage > New Bucket
--   Name: card-images
--   Public: YES (toggle on)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('card-images', 'card-images', true)
-- ON CONFLICT (id) DO NOTHING;
