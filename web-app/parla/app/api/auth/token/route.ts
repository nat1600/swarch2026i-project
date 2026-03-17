import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@auth0/nextjs-auth0';

export async function GET(request: NextRequest) {
  try {
    const result = await getAccessToken(request);
    
    if (!result || typeof result === 'string') {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const { accessToken } = result;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}
