import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Accepts POST with JSON body: { customer_id, csv_text }
// CSV format: name, category, current_stock, par_level, unit
// Header row is auto-detected and skipped.
// Returns: { imported, skipped, errors }

export async function POST(request) {
  try {
    const { customer_id, csv_text } = await request.json()

    if (!customer_id) return NextResponse.json({ error: 'missing customer_id' }, { status: 400 })
    if (!csv_text)    return NextResponse.json({ error: 'missing csv_text' }, { status: 400 })

    const lines = csv_text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (!lines.length) return NextResponse.json({ error: 'empty CSV' }, { status: 400 })

    // Detect and skip header row
    const firstLine = lines[0].toLowerCase()
    const hasHeader = firstLine.includes('name') || firstLine.includes('item') || firstLine.includes('product')
    const dataLines = hasHeader ? lines.slice(1) : lines

    const KNOWN_CATEGORIES = ['spirits', 'beer', 'wine', 'liqueur', 'mixer', 'garnish', 'food', 'supply', 'other']

    let imported = 0
    let skipped = 0
    const errors = []

    for (const line of dataLines) {
      if (!line.trim()) { skipped++; continue }

      // Parse CSV line (handles quoted fields)
      const cols = parseCsvLine(line)
      if (cols.length < 2) { skipped++; continue }

      const name = cols[0]?.trim()
      if (!name || name.length < 2) { skipped++; continue }

      // Try to parse columns flexibly:
      // name, category?, current_stock?, par_level?, unit?
      // Also handle: name, current_stock, par_level (no category)
      let category = 'other'
      let currentStock = 0
      let parLevel = 0
      let unit = 'bottles'

      // Check if col[1] looks like a category or a number
      const col1 = cols[1]?.trim() || ''
      const col1IsNum = !isNaN(parseFloat(col1)) && col1 !== ''

      if (col1IsNum) {
        // Format: name, current_stock, par_level, unit?
        currentStock = parseFloat(col1) || 0
        parLevel = parseFloat(cols[2]?.trim()) || 0
        unit = cols[3]?.trim() || 'bottles'
        // Try to infer category from name
        const nameLower = name.toLowerCase()
        if (/whiskey|whisky|bourbon|scotch|rye/.test(nameLower)) category = 'spirits'
        else if (/vodka|gin|rum|tequila|mezcal|brandy|cognac|amaro|aperol|campari/.test(nameLower)) category = 'spirits'
        else if (/beer|lager|ale|ipa|stout|pilsner|draft|keg/.test(nameLower)) category = 'beer'
        else if (/wine|champagne|prosecco|cava|ros/.test(nameLower)) category = 'wine'
        else if (/syrup|juice|soda|tonic|ginger|bitters|cordial|puree/.test(nameLower)) category = 'mixer'
        else if (/lime|lemon|orange|cherry|olive|mint|herb|fruit/.test(nameLower)) category = 'garnish'
        else if (/vermouth|liqueur|triple|cointreau|kahlua|baileys/.test(nameLower)) category = 'liqueur'
      } else {
        // Format: name, category, current_stock, par_level, unit?
        const catLower = col1.toLowerCase()
        category = KNOWN_CATEGORIES.find(c => catLower.includes(c)) || 'other'
        currentStock = parseFloat(cols[2]?.trim()) || 0
        parLevel = parseFloat(cols[3]?.trim()) || 0
        unit = cols[4]?.trim() || 'bottles'
      }

      // Clamp values
      currentStock = Math.max(0, Math.min(currentStock, 99999))
      parLevel = Math.max(0, Math.min(parLevel, 99999))
      if (!unit || unit.length > 20) unit = 'bottles'

      const { error } = await supabase.from('bar_inventory').upsert({
        customer_id,
        name,
        category,
        current_stock: currentStock,
        par_level: parLevel,
        unit,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'customer_id,name' })

      if (error) {
        errors.push(`${name}: ${error.message}`)
        skipped++
      } else {
        imported++
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 10) })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function parseCsvLine(line) {
  const cols = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur)
  return cols
}
