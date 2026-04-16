export interface Card {
  id: string
  name: string
  set_name: string | null
  card_number: string | null
  rarity: string | null
  hp: string | null
  card_type: string | null
  pokemon_type: string | null
  condition: string | null
  condition_notes: string | null
  image_url: string | null
  ai_description: string | null
  ai_valuation_notes: string | null
  current_value: number
  created_at: string
  updated_at: string
}

export interface PriceSnapshot {
  id: string
  card_id: string
  estimated_value: number
  notes: string | null
  created_at: string
}

export interface PortfolioSnapshot {
  id: string
  total_value: number
  card_count: number
  created_at: string
}

export interface ScanResult {
  name: string
  set_name: string
  card_number: string
  rarity: string
  hp: string
  card_type: string
  pokemon_type: string
  condition: string
  condition_notes: string
  estimated_value_usd: number
  ai_description: string
  ai_valuation_notes: string
}
