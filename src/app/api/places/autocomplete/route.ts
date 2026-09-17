import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/server';
import { getPlacesProvider } from '@/lib/places';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', errorCode: 'UNAUTHORIZED' },
        { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (user.accountStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is not active', errorCode: 'UNAUTHORIZED' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || searchParams.get('input') || '').trim();
    const sessionToken = (searchParams.get('sessionToken') || searchParams.get('session_token') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { success: true, suggestions: [] },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (q.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Query exceeds maximum length of 100 characters', errorCode: 'INVALID_REQUEST' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (sessionToken && (sessionToken.length > 64 || !/^[a-zA-Z0-9_\-]+$/.test(sessionToken))) {
      return NextResponse.json(
        { success: false, error: 'Invalid sessionToken format', errorCode: 'INVALID_REQUEST' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const provider = getPlacesProvider();
    const result = await provider.autocomplete(q, sessionToken || undefined);

    const status = result.success ? 200 : result.errorCode === 'NOT_CONFIGURED' ? 503 : 500;

    return NextResponse.json(result, {
      status,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message, errorCode: 'PROVIDER_ERROR' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
