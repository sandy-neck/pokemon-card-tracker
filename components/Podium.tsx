'use client'

import Image from 'next/image'
import { Card } from '@/lib/types'

const MEDAL = ['🥇', '🥈', '🥉']
const PODIUM_HEIGHT = ['h-24', 'h-16', 'h-12']
const PODIUM_COLOR = ['bg-amber-400', 'bg-zinc-400', 'bg-amber-700']
const PODIUM_ORDER = [1, 0, 2] // display order: 2nd, 1st, 3rd

interface Props {
  cards: Card[]
}

export default function Podium({ cards }: Props) {
  const top3 = [...cards]
    .sort((a, b) => (Number(b.current_value) || 0) - (Number(a.current_value) || 0))
    .slice(0, 3)

  if (top3.length < 2) return null

  return (
    <div>
      <h2 className="text-white font-semibold mb-3">Top Cards</h2>
      <div className="flex items-end justify-center gap-2">
        {PODIUM_ORDER.map((rank) => {
          const card = top3[rank]
          if (!card) return <div key={rank} className="flex-1" />
          return (
            <div key={rank} className="flex-1 flex flex-col items-center gap-2">
              {/* Card image */}
              <div className="relative">
                <span className="absolute -top-2 -right-2 text-lg z-10">{MEDAL[rank]}</span>
                {card.image_url ? (
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    width={80}
                    height={112}
                    className={`rounded-lg object-cover shadow-lg ${rank === 0 ? 'w-20 h-28' : 'w-16 h-22'}`}
                  />
                ) : (
                  <div className={`bg-zinc-800 rounded-lg flex items-center justify-center text-3xl shadow-lg ${rank === 0 ? 'w-20 h-28' : 'w-16 h-22'}`}>
                    🃏
                  </div>
                )}
              </div>
              {/* Name + value */}
              <div className="text-center w-full px-1">
                <p className="text-white text-xs font-medium truncate">{card.name}</p>
                <p className="text-amber-400 text-sm font-bold">${(Number(card.current_value) || 0).toFixed(2)}</p>
              </div>
              {/* Podium block */}
              <div className={`w-full rounded-t-lg ${PODIUM_HEIGHT[rank]} ${PODIUM_COLOR[rank]} flex items-start justify-center pt-1`}>
                <span className="text-black font-bold text-sm">{rank + 1}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
