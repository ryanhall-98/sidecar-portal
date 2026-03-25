import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')
  if (!customerId) return NextResponse.json({ error: 'missing customer_id' }, { status: 400 })

  try {
    const [posRes, sqRes] = await Promise.all([
      supabase.from('pos_connections').select('pos_type,updated_at').eq('customer_id', customerId),
      supabase.from('square_connections').select('access_token,location_id,updated_at').eq('customer_id', customerId).single(),
    ])

    const connections = {}

    // Square (stored in square_connections table)
    if (sqRes.data?.access_token) {
      connections.square = { connected: true, updated_at: sqRes.data.updated_at }
    }

    // Toast, Lightspeed, Clover (stored in pos_connections table)
    for (const row of posRes.data || []) {
      connections[row.pos_type] = { connected: true, updated_at: row.updated_at }
    }

    return NextResponse.json({ connections })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Save POS credentials from portal (POST)
export async function POST(request) {
  try {
    const { customer_id, pos_type, credentials } = await request.json()
    if (!customer_id || !pos_type || !credentials) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    if (pos_type === 'square') {
      const { error } = await supabase.from('square_connections').upsert({
        customer_id,
        access_token: credentials.access_token,
        location_id: credentials.location_id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'customer_id' })
      if (error) throw new Error(error.message)
    } else {
      // Toast, Lightspeed, Clover
      const row = {
        customer_id,
        pos_type,
        updated_at: new Date().toISOString(),
      }
      if (credentials.client_id)       row.client_id = credentials.client_id
      if (credentials.client_secret)   row.client_secret = credentials.client_secret
      if (credentials.restaurant_guid) row.restaurant_guid = credentials.restaurant_guid
      if (credentials.sandbox !== undefined) row.sandbox = credentials.sandbox

      const { error } = await supabase.from('pos_connections').upsert(row, { onConflict: 'customer_id,pos_type' })
      if (error) throw new Error(error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
