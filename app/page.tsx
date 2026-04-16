'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Card, PortfolioSnapshot } from '@/lib/types'
import PortfolioChart from '@/components/PortfolioChart'

function conditionColor(condition: string | null) {
  if (!condition) return 'text-zinc-400'
  const c = condition.toLowerCase()
  if (c.includes('mint')) return 'text-green-400'
  if (c.includes('lightly')) return 'text-yellow-400'
  if (c.includes('moderately')) return 'text-orange-400'
  return 'text-red-400'
}

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [revaluing, setRevaluing] = useState(false)

  const loadData = useCallback(async () => {
    const [cardsRes, snapshotsRes] = await Promise.all([
      supabase.from('cards').select('*').order('created_at', { ascending: false }),
      supabase.from('portfolio_snapshots').select('*').order('created_at', { ascending: true }).limit(30),
    ])
    if (cardsRes.data) setCards(cardsRes.data)
    if (snapshotsRes.data) setSnapshots(snapshotsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalValue = cards.reduce((sum, c) => sum + (Number(c.current_value) || 0), 0)

  async function handleRevalueAll() {
    if (cards.length === 0) return
    setRevaluing(true)
    let total = 0

    for (const card of cards) {
      try {
        const res = await fetch('/api/revalue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardName: card.name,
            setName: card.set_name,
            cardNumber: card.card_number,
            rarity: card.rarity,
            condition: card.condition,
          }),
        })
        const data = await res.json()
        const newValue = Number(data.estimated_value_usd) || 0
        total += newValue

        await supabase
          .from('cards')
          .update({ current_value: newValue, updated_at: new Date().toISOString() })
          .eq('id', card.id)

        await supabase.from('price_snapshots').insert({
          card_id: card.id,
          estimated_value: newValue,
          notes: data.notes,
        })
      } catch {
        total += Number(card.current_value) || 0
      }
    }

    await supabase.from('portfolio_snapshots').insert({
      total_value: total,
      card_count: cards.length,
    })

    await loadData()
    setRevaluing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-amber-400 text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">PokéTracker</h1>
          <p className="text-zinc-400 text-sm">{cards.length} card{cards.length !== 1 ? 's' : ''} in collection</p>
        </div>
        <span className="text-3xl">⚡</span>
      </div>

      {/* Total Value */}
      <div className="bg-zinc-900 rounded-2xl p-6 mb-4 border border-zinc-800">
        <p className="text-zinc-400 text-sm mb-1">Total Portfolio Value</p>
        <p className="text-4xl font-bold text-amber-400">${totalValue.toFixed(2)}</p>
        <button
          onClick={handleRevalueAll}
          disabled={revaluing || cards.length === 0}
          className="mt-4 w-full py-2 rounded-xl bg-amber-400/10 text-amber-400 text-sm font-medium border border-amber-400/20 hover:bg-amber-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {revaluing ? '⏳ Re-valuing all cards...' : '🔄 Re-value All Cards'}
        </button>
      </div>

      {/* Portfolio Chart */}
      {snapshots.length > 1 && (
        <div className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm mb-3">Portfolio Over Time</p>
          <PortfolioChart data={snapshots} />
        </div>
      )}

      {/* Cards or Empty State */}
      {cards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">📷</p>
          <p className="text-white font-semibold text-lg mb-2">No cards yet!</p>
          <p className="text-zinc-400 text-sm mb-6">Scan your first Pokémon card to get started</p>
          <Link href="/scan" className="inline-block bg-amber-400 text-black font-bold px-6 py-3 rounded-xl">
            Scan a Card
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Recent Cards</h2>
            <Link href="/cards" className="text-amber-400 text-sm">See all →</Link>
          </div>
          <div className="space-y-3">
            {cards.slice(0, 5).map((card) => (
              <Link key={card.id} href={`/cards/${card.id}`}>
                <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex items-center gap-3 hover:border-zinc-600 transition-colors">
                  {card.image_url ? (
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      width={48}
                      height={64}
                      className="rounded-lg object-cover w-12 h-16 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      🃏
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{card.name}</p>
                    <p className="text-zinc-500 text-xs truncate">{card.set_name || 'Unknown Set'}</p>
                    <p className={`text-xs mt-0.5 ${conditionColor(card.condition)}`}>
                      {card.condition || 'Ungraded'}
                    </p>
                  </div>
                  <p className="text-amber-400 font-semibold text-sm whitespace-nowrap">
                    ${(Number(card.current_value) || 0).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
