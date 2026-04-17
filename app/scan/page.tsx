'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ScanResult } from '@/lib/types'
import CameraCapture from '@/components/CameraCapture'

type State = 'camera' | 'analyzing' | 'review' | 'saving'

function conditionColor(condition: string) {
  const c = condition.toLowerCase()
  if (c.includes('mint')) return 'text-green-400'
  if (c.includes('lightly')) return 'text-yellow-400'
  if (c.includes('moderately')) return 'text-orange-400'
  return 'text-red-400'
}

export default function ScanPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('camera')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCapture(blob: Blob, base64: string) {
    setCapturedBlob(blob)
    setCapturedUrl(URL.createObjectURL(blob))
    setState('analyzing')
    setError(null)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      })
      if (!res.ok) throw new Error('Scan failed')
      setResult(await res.json())
      setState('review')
    } catch {
      setError('Could not identify the card. Try again with better lighting and a flat surface.')
      setState('camera')
    }
  }

  async function handleSave() {
    if (!result || !capturedBlob) return
    setState('saving')

    try {
      // Use official TCG image if available, otherwise fall back to Supabase Storage
      let imageUrl: string | null = result.official_image_url || null

      if (!imageUrl) {
        const fileName = `${Date.now()}.jpg`
        const { data: uploadData } = await supabase.storage
          .from('card-images')
          .upload(fileName, capturedBlob, { contentType: 'image/jpeg' })
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(uploadData.path)
          imageUrl = publicUrl
        }
      }

      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          name: result.name,
          set_name: result.set_name,
          card_number: result.card_number,
          rarity: result.rarity,
          hp: result.hp,
          card_type: result.card_type,
          pokemon_type: result.pokemon_type,
          condition: result.condition,
          condition_notes: result.condition_notes,
          image_url: imageUrl,
          ai_description: result.ai_description,
          ai_valuation_notes: result.ai_valuation_notes,
          current_value: result.estimated_value_usd,
        })
        .select()
        .single()

      if (cardError || !card) throw new Error('Failed to save')

      await supabase.from('price_snapshots').insert({
        card_id: card.id,
        estimated_value: result.estimated_value_usd,
        notes: result.ai_valuation_notes,
      })

      router.push(`/cards/${card.id}`)
    } catch {
      setError('Failed to save card. Please try again.')
      setState('review')
    }
  }

  function handleRetake() {
    setState('camera')
    setCapturedBlob(null)
    setCapturedUrl(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
      <h1 className="text-2xl font-bold text-white mb-4">Scan Card</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {state === 'camera' && (
        <>
          <p className="text-zinc-400 text-sm mb-3">
            Center your card in the yellow frame, then tap the white button.
          </p>
          <CameraCapture onCapture={handleCapture} />
        </>
      )}

      {state === 'analyzing' && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {capturedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedUrl} alt="Captured" className="w-36 rounded-xl mb-6 opacity-50 object-cover" />
          )}
          <p className="text-4xl mb-4 animate-bounce">🔍</p>
          <p className="text-white font-medium text-lg">Identifying card...</p>
          <p className="text-zinc-400 text-sm mt-2">Claude is analyzing your card</p>
        </div>
      )}

      {state === 'review' && result && (
        <div className="space-y-4">
          {capturedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedUrl}
              alt="Captured card"
              className="w-44 mx-auto rounded-xl shadow-2xl shadow-amber-400/10 object-cover block"
            />
          )}

          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-white font-bold text-xl">{result.name}</h2>
                <p className="text-zinc-400 text-sm truncate">
                  {result.set_name}{result.card_number ? ` · ${result.card_number}` : ''}
                </p>
              </div>
              <p className="text-amber-400 font-bold text-2xl whitespace-nowrap">
                ${result.estimated_value_usd.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                ['Rarity', result.rarity],
                ['Type', result.card_type],
                ['HP', result.hp],
                ['Pokémon Type', result.pokemon_type],
              ].map(([label, value]) =>
                value ? (
                  <div key={label}>
                    <span className="text-zinc-500">{label}: </span>
                    <span className="text-white">{value}</span>
                  </div>
                ) : null
              )}
            </div>

            <div>
              <span className="text-zinc-500 text-sm">Condition: </span>
              <span className={`text-sm font-medium ${conditionColor(result.condition)}`}>
                {result.condition}
              </span>
              {result.condition_notes && (
                <p className="text-zinc-400 text-xs mt-1">{result.condition_notes}</p>
              )}
            </div>

            {result.ai_valuation_notes && (
              <p className="text-zinc-400 text-xs border-t border-zinc-800 pt-3">
                {result.ai_valuation_notes}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium"
            >
              Retake
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-3 rounded-xl bg-amber-400 text-black text-sm font-bold"
            >
              Save to Collection
            </button>
          </div>
        </div>
      )}

      {state === 'saving' && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">💾</p>
          <p className="text-white font-medium text-lg">Saving to collection...</p>
        </div>
      )}
    </div>
  )
}
