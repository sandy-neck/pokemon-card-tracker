'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/lib/types'

const RARITY_COLORS: Record<string, string> = {
  'Common': '#71717a',
  'Uncommon': '#22c55e',
  'Rare': '#3b82f6',
  'Holo Rare': '#a855f7',
  'Ultra Rare': '#f59e0b',
  'Secret Rare': '#ef4444',
  'Other': '#64748b',
}

function normalizeRarity(rarity: string | null): string {
  if (!rarity) return 'Other'
  const r = rarity.toLowerCase()
  if (r.includes('secret')) return 'Secret Rare'
  if (r.includes('ultra')) return 'Ultra Rare'
  if (r.includes('holo')) return 'Holo Rare'
  if (r.includes('rare')) return 'Rare'
  if (r.includes('uncommon')) return 'Uncommon'
  if (r.includes('common')) return 'Common'
  return 'Other'
}

interface Props {
  cards: Card[]
}

export default function RarityChart({ cards }: Props) {
  const counts: Record<string, number> = {}
  cards.forEach((c) => {
    const r = normalizeRarity(c.rarity)
    counts[r] = (counts[r] || 0) + 1
  })

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  if (data.length === 0) return null

  return (
    <div>
      <h2 className="text-white font-semibold mb-3">Collection Breakdown</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={RARITY_COLORS[entry.name] ?? RARITY_COLORS['Other']} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            formatter={(value: number, name: string) => [value, name]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#a1a1aa', fontSize: '11px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
