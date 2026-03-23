import { NextResponse } from 'next/server';

export async function GET() {
  console.log('✅ Test API route called');
  return NextResponse.json({ success: true, message: 'API is working' });
}

export async function POST() {
  console.log('✅ Test API route POST called');
  return NextResponse.json({ success: true, message: 'POST working' });
}