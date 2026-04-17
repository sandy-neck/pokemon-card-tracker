export async function fetchOfficialImage(name: string, setName?: string | null, cardNumber?: string | null): Promise<string | null> {
  try {
    const q = encodeURIComponent(`name:"${name}"`)
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=10`, {
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const cards: Array<{ number?: string; set?: { name?: string }; images?: { large?: string; small?: string } }> = data.data || []
    if (cards.length === 0) return null

    const cardNum = cardNumber?.split('/')[0]
    const match =
      cards.find((c) => c.number === cardNum && c.set?.name?.toLowerCase().includes((setName ?? '').toLowerCase())) ||
      cards.find((c) => c.set?.name?.toLowerCase().includes((setName ?? '').toLowerCase())) ||
      cards.find((c) => c.number === cardNum) ||
      cards[0]

    return match?.images?.large || match?.images?.small || null
  } catch {
    return null
  }
}
