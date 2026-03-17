import { NextRequest, NextResponse } from 'next/server';
import { phrasesService } from '@/lib/services/phrasesService';
import { auth0 } from '@/lib/auth0';
import { ApiError } from '@/lib/types/phrases';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const phraseId = parseInt(params.id);
    const phrase = await phrasesService.getPhraseById(phraseId);
    return NextResponse.json(phrase);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching phrase:', apiError);
    return NextResponse.json(
      { error: apiError.detail || 'Failed to fetch phrase' },
      { status: apiError.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const phraseId = parseInt(params.id);
    const body = await request.json();
    const phrase = await phrasesService.updatePhrase(phraseId, body);
    return NextResponse.json(phrase);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error updating phrase:', apiError);
    return NextResponse.json(
      { error: apiError.detail || 'Failed to update phrase' },
      { status: apiError.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const phraseId = parseInt(params.id);
    await phrasesService.deletePhrase(phraseId);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error deleting phrase:', apiError);
    return NextResponse.json(
      { error: apiError.detail || 'Failed to delete phrase' },
      { status: apiError.status || 500 }
    );
  }
}
