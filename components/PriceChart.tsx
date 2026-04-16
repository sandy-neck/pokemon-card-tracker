'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PriceSnapshot } from '@/lib/types'

export default function PriceChart({ data }: { data: PriceSnapshot[] }) {
  const chartData = data.map((s) => ({
    date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Number(s.estimated_value),
  }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={45}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Value']}
        />
        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
