import { NextResponse } from 'next/server';

const SQUARE_APP_ID = process.env.SQUARE_APP_ID;
const SQUARE_ENV = process.env.SQUARE_ENVIRONMENT || 'production';
const BASE_URL = 'https://portal.sidecarhq.cc';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id');
  if (!customerId) return NextResponse.json({ error: 'Missing customer_id' }, { status: 400 });
  if (!SQUARE_APP_ID) return NextResponse.json({ error: 'Square not configured' }, { status: 500 });

  const baseUrl = SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
  const scopes = ['MERCHANT_PROFILE_READ','INVENTORY_READ','INVENTORY_WRITE','ITEMS_READ','ORDERS_READ'].join('+');
  const state = Buffer.from(JSON.stringify({ customerId, ts: Date.now() })).toString('base64');
  const authUrl = `${baseUrl}/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=${scopes}&session=false&state=${state}&redirect_uri=${BASE_URL}/api/square/callback`;

  return NextResponse.redirect(authUrl);
}
