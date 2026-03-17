import { NextRequest, NextResponse } from 'next/server';
import { phrasesService } from '@/lib/services/phrasesService';
import { auth0 } from '@/lib/auth0';
import { ApiError } from '@/lib/types/phrases';

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const phrases = await phrasesService.getAllPhrases();
    return NextResponse.json(phrases);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching phrases:', apiError);
    return NextResponse.json(
      { error: apiError.detail || 'Failed to fetch phrases' },
      { status: apiError.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const phrase = await phrasesService.createPhrase(body);
    return NextResponse.json(phrase, { status: 201 });
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error creating phrase:', apiError);
    return NextResponse.json(
      { error: apiError.detail || 'Failed to create phrase' },
      { status: apiError.status || 500 }
    );
  }
}
