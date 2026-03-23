import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')
  const type = searchParams.get('type') || 'tasks'
  const days = parseInt(searchParams.get('days') || '30')

  if (!customerId) return NextResponse.json({ error: 'missing customer_id' }, { status: 400 })

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  try {
    if (type === 'inventory') {
      const { data } = await supabase.from('bar_inventory')
        .select('name,category,current_stock,par_level,unit,updated_at')
        .eq('customer_id', customerId)
        .order('category').order('name')

      const csv = toCSV(data || [], ['name','category','current_stock','par_level','unit','updated_at'])
      return csvResponse(csv, 'sidecar-inventory.csv')
    }

    if (type === 'tasks') {
      const { data } = await supabase.from('tasks')
        .select('category,summary,status,urgency,created_at,completed_at')
        .eq('customer_id', customerId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })

      const csv = toCSV(data || [], ['category','summary','status','urgency','created_at','completed_at'])
      return csvResponse(csv, 'sidecar-tasks.csv')
    }

    if (type === 'messages') {
      const { data } = await supabase.from('messages')
        .select('direction,message,action_taken,created_at')
        .eq('customer_id', customerId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })

      const csv = toCSV(data || [], ['direction','message','action_taken','created_at'])
      return csvResponse(csv, 'sidecar-messages.csv')
    }

    return NextResponse.json({ error: 'invalid type' }, { status: 400 })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function toCSV(rows, cols) {
  const header = cols.join(',')
  const lines = rows.map(r =>
    cols.map(c => {
      const v = r[c] ?? ''
      const s = String(v).replace(/"/g, '""')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    }).join(',')
  )
  return [header, ...lines].join('\n')
}

function csvResponse(csv, filename) {
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  })
}
