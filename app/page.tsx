'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Card, PortfolioSnapshot, PriceSnapshot } from '@/lib/types'
import PortfolioChart from '@/components/PortfolioChart'
import Podium from '@/components/Podium'
import RarityChart from '@/components/RarityChart'
import Milestones from '@/components/Milestones'

// ── helpers ──────────────────────────────────────────────────────────────────

function conditionScore(condition: string | null): number {
  if (!condition) return 50
  const c = condition.toLowerCase()
  if (c.includes('mint')) return 100
  if (c.includes('lightly')) return 70
  if (c.includes('moderately')) return 45
  if (c.includes('heavily')) return 20
  if (c.includes('damaged')) return 5
  return 50
}

function rarityRank(rarity: string | null): number {
  if (!rarity) return 0
  const r = rarity.toLowerCase()
  if (r.includes('secret')) return 6
  if (r.includes('ultra')) return 5
  if (r.includes('holo')) return 4
  if (r.includes('rare')) return 3
  if (r.includes('uncommon')) return 2
  if (r.includes('common')) return 1
  return 0
}

function weeksStar(cards: Card[]): Card | null {
  if (cards.length === 0) return null
  const top10 = [...cards]
    .sort((a, b) => (Number(b.current_value) || 0) - (Number(a.current_value) || 0))
    .slice(0, Math.min(10, cards.length))
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return top10[week % top10.length]
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([])
  const [priceSnaps, setPriceSnaps] = useState<PriceSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [revaluing, setRevaluing] = useState(false)

  const loadData = useCallback(async () => {
    const [cardsRes, snapshotsRes, priceRes] = await Promise.all([
      supabase.from('cards').select('*').order('created_at', { ascending: false }),
      supabase.from('portfolio_snapshots').select('*').order('created_at', { ascending: true }).limit(30),
      supabase.from('price_snapshots').select('*').order('created_at', { ascending: true }),
    ])
    if (cardsRes.data) setCards(cardsRes.data)
    if (snapshotsRes.data) setSnapshots(snapshotsRes.data)
    if (priceRes.data) setPriceSnaps(priceRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalValue = cards.reduce((sum, c) => sum + (Number(c.current_value) || 0), 0)
  const avgValue = cards.length > 0 ? totalValue / cards.length : 0
  const rarestCard = [...cards].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity))[0]
  const star = weeksStar(cards)

  // Biggest movers — compare last two price snapshots per card
  const snapsByCard: Record<string, PriceSnapshot[]> = {}
  priceSnaps.forEach((s) => {
    if (!snapsByCard[s.card_id]) snapsByCard[s.card_id] = []
    snapsByCard[s.card_id].push(s)
  })
  const movers = cards
    .filter((c) => (snapsByCard[c.id]?.length ?? 0) >= 2)
    .map((c) => {
      const snaps = snapsByCard[c.id]
      const prev = Number(snaps[snaps.length - 2].estimated_value)
      const curr = Number(snaps[snaps.length - 1].estimated_value)
      const change = curr - prev
      const pct = prev > 0 ? (change / prev) * 100 : 0
      return { card: c, change, pct }
    })
    .filter((m) => m.change !== 0)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 5)

  // Condition health
  const avgHealth = cards.length > 0
    ? cards.reduce((sum, c) => sum + conditionScore(c.condition), 0) / cards.length
    : 0
  const healthColor = avgHealth >= 80 ? 'bg-green-500' : avgHealth >= 55 ? 'bg-yellow-400' : 'bg-red-500'
  const healthLabel = avgHealth >= 80 ? 'Excellent' : avgHealth >= 55 ? 'Good' : 'Needs Care'

  async function handleRevalueAll() {
    if (cards.length === 0) return
    setRevaluing(true)
    let total = 0
    for (const card of cards) {
      try {
        const res = await fetch('/api/revalue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardName: card.name, setName: card.set_name, cardNumber: card.card_number, rarity: card.rarity, condition: card.condition }),
        })
        const data = await res.json()
        const newValue = Number(data.estimated_value_usd) || 0
        total += newValue
        await supabase.from('cards').update({ current_value: newValue, updated_at: new Date().toISOString() }).eq('id', card.id)
        await supabase.from('price_snapshots').insert({ card_id: card.id, estimated_value: newValue, notes: data.notes })
      } catch {
        total += Number(card.current_value) || 0
      }
    }
    await supabase.from('portfolio_snapshots').insert({ total_value: total, card_count: cards.length })
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

  // ── empty state ──────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-6xl mb-4">📷</p>
        <p className="text-white font-bold text-2xl mb-2">Welcome to PokéTracker!</p>
        <p className="text-zinc-400 text-sm mb-8">Scan your first card to start building your collection</p>
        <Link href="/scan" className="bg-amber-400 text-black font-bold px-8 py-4 rounded-2xl text-lg">
          Scan First Card
        </Link>
      </div>
    )
  }

  // ── main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-4" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PokéTracker</h1>
          <p className="text-zinc-400 text-sm">{cards.length} card{cards.length !== 1 ? 's' : ''} in collection</p>
        </div>
        <span className="text-3xl">⚡</span>
      </div>

      {/* Total Value */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <p className="text-zinc-400 text-sm mb-1">Total Portfolio Value</p>
        <p className="text-4xl font-bold text-amber-400">${totalValue.toFixed(2)}</p>
        <button
          onClick={handleRevalueAll}
          disabled={revaluing}
          className="mt-3 w-full py-2 rounded-xl bg-amber-400/10 text-amber-400 text-sm font-medium border border-amber-400/20 hover:bg-amber-400/20 transition-colors disabled:opacity-40"
        >
          {revaluing ? '⏳ Re-valuing all cards...' : '🔄 Re-value All Cards'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Cards', value: cards.length.toString(), icon: '🃏' },
          { label: 'Avg Value', value: `$${avgValue.toFixed(2)}`, icon: '📊' },
          { label: 'Rarest', value: rarestCard?.rarity?.split(' ')[0] ?? '—', icon: '✨' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 text-center">
            <p className="text-xl mb-1">{icon}</p>
            <p className="text-white font-bold text-sm">{value}</p>
            <p className="text-zinc-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* This Week's Star */}
      {star && (
        <div className="bg-gradient-to-br from-amber-400/20 to-zinc-900 rounded-2xl p-4 border border-amber-400/30">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">⭐ This Week&apos;s Star</p>
          <div className="flex items-center gap-4">
            {star.image_url ? (
              <Image src={star.image_url} alt={star.name} width={56} height={78} className="rounded-lg object-cover shadow-lg shadow-amber-400/20 flex-shrink-0" />
            ) : (
              <div className="w-14 h-20 bg-zinc-800 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">🃏</div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold text-lg truncate">{star.name}</p>
              <p className="text-zinc-400 text-sm truncate">{star.set_name || 'Unknown Set'}</p>
              <p className="text-amber-400 font-bold text-xl mt-1">${(Number(star.current_value) || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Chart */}
      {snapshots.length > 1 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm mb-3">Portfolio Over Time</p>
          <PortfolioChart data={snapshots} />
        </div>
      )}

      {/* Top 3 Podium */}
      {cards.length >= 2 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <Podium cards={cards} />
        </div>
      )}

      {/* Biggest Movers */}
      {movers.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <h2 className="text-white font-semibold mb-3">Biggest Movers</h2>
          <div className="space-y-3">
            {movers.map(({ card, change, pct }) => (
              <Link key={card.id} href={`/cards/${card.id}`}>
                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {card.image_url ? (
                    <Image src={card.image_url} alt={card.name} width={36} height={48} className="rounded object-cover w-9 h-12 flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-12 bg-zinc-800 rounded flex items-center justify-center text-lg flex-shrink-0">🃏</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{card.name}</p>
                    <p className="text-zinc-500 text-xs">{card.set_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}
                    </p>
                    <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Rarity Breakdown */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <RarityChart cards={cards} />
      </div>

      {/* Condition Health */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Collection Health</h2>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            avgHealth >= 80 ? 'bg-green-900/50 text-green-400' :
            avgHealth >= 55 ? 'bg-yellow-900/50 text-yellow-400' :
            'bg-red-900/50 text-red-400'
          }`}>{healthLabel}</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${healthColor}`}
            style={{ width: `${avgHealth}%` }}
          />
        </div>
        <p className="text-zinc-500 text-xs mt-2">
          Based on condition grades across all {cards.length} cards
        </p>
      </div>

      {/* Milestones */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <Milestones cards={cards} totalValue={totalValue} />
      </div>

      {/* Recent Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Recent Cards</h2>
          <Link href="/cards" className="text-amber-400 text-sm">See all →</Link>
        </div>
        <div className="space-y-3">
          {cards.slice(0, 3).map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`}>
              <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex items-center gap-3 hover:border-zinc-600 transition-colors">
                {card.image_url ? (
                  <Image src={card.image_url} alt={card.name} width={48} height={64} className="rounded-lg object-cover w-12 h-16 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🃏</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{card.name}</p>
                  <p className="text-zinc-500 text-xs truncate">{card.set_name || 'Unknown Set'}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{card.condition || 'Ungraded'}</p>
                </div>
                <p className="text-amber-400 font-semibold text-sm whitespace-nowrap">
                  ${(Number(card.current_value) || 0).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
