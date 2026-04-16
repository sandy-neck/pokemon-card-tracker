'use client'

import { Card } from '@/lib/types'

interface Milestone {
  id: string
  icon: string
  label: string
  earned: boolean
}

function getMilestones(cards: Card[], totalValue: number): Milestone[] {
  const hasRarity = (r: string) => cards.some((c) => c.rarity?.toLowerCase().includes(r))

  return [
    { id: 'first_card', icon: '🃏', label: 'First Card', earned: cards.length >= 1 },
    { id: 'ten_cards', icon: '🔟', label: '10 Cards', earned: cards.length >= 10 },
    { id: 'twenty_five', icon: '🎯', label: '25 Cards', earned: cards.length >= 25 },
    { id: 'fifty', icon: '💰', label: '$50 Portfolio', earned: totalValue >= 50 },
    { id: 'hundred', icon: '💵', label: '$100 Portfolio', earned: totalValue >= 100 },
    { id: 'five_hundred', icon: '🤑', label: '$500 Portfolio', earned: totalValue >= 500 },
    { id: 'first_holo', icon: '✨', label: 'First Holo', earned: hasRarity('holo') },
    { id: 'ultra_rare', icon: '⭐', label: 'Ultra Rare', earned: hasRarity('ultra') },
    { id: 'secret_rare', icon: '💎', label: 'Secret Rare', earned: hasRarity('secret') },
  ]
}

interface Props {
  cards: Card[]
  totalValue: number
}

export default function Milestones({ cards, totalValue }: Props) {
  const milestones = getMilestones(cards, totalValue)
  const earned = milestones.filter((m) => m.earned).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold">Milestones</h2>
        <span className="text-amber-400 text-sm font-medium">{earned}/{milestones.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-3 flex flex-col items-center gap-1 border transition-all ${
              m.earned
                ? 'bg-amber-400/10 border-amber-400/30'
                : 'bg-zinc-900 border-zinc-800 opacity-40'
            }`}
          >
            <span className={`text-2xl ${!m.earned && 'grayscale'}`}>{m.icon}</span>
            <span className="text-xs text-center text-zinc-300 leading-tight">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
