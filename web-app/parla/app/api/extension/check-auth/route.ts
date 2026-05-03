import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (session && session.user) {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Extension auth check failed:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}