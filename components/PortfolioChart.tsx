'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PortfolioSnapshot } from '@/lib/types'

export default function PortfolioChart({ data }: { data: PortfolioSnapshot[] }) {
  const chartData = data.map((s) => ({
    date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Number(s.total_value),
  }))

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Value']}
        />
        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#grad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
