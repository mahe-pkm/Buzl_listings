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
    const placeId = (searchParams.get('placeId') || searchParams.get('place_id') || '').trim();
    const sessionToken = (searchParams.get('sessionToken') || searchParams.get('session_token') || '').trim();

    if (!placeId) {
      return NextResponse.json(
        { success: false, error: 'Missing placeId parameter', errorCode: 'INVALID_REQUEST' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (placeId.length > 255) {
      return NextResponse.json(
        { success: false, error: 'placeId exceeds maximum length of 255 characters', errorCode: 'INVALID_REQUEST' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // Disallow dangerous or malformed placeId strings
    if (!/^[a-zA-Z0-9_\-.:+=]+$/.test(placeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid placeId format', errorCode: 'INVALID_REQUEST' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const provider = getPlacesProvider();
    const result = await provider.getDetails(placeId, sessionToken || undefined);

    let status = 200;
    if (!result.success) {
      if (result.errorCode === 'NOT_FOUND') status = 404;
      else if (result.errorCode === 'NOT_CONFIGURED') status = 503;
      else if (result.errorCode === 'INVALID_REQUEST') status = 400;
      else status = 500;
    }

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
