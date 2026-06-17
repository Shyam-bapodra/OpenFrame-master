import { NextRequest, NextResponse } from 'next/server';
import { consumeVerificationToken } from '@/lib/email-verification';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';

// A raw 32-byte hex token is exactly 64 characters.
const TOKEN_REGEX = /^[0-9a-f]{64}$/;

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openframe-master.onrender.com';
  try {
    // Rate-limit by IP to prevent token enumeration attacks.
    const limited = await rateLimit(request, 'verify-email');
    if (limited) return limited;
    const token = request.nextUrl.searchParams.get('token');

    if (!token || !TOKEN_REGEX.test(token.trim())) {
      return NextResponse.redirect(new URL('/login?error=InvalidVerificationToken', baseUrl));
    }

    const email = await consumeVerificationToken(token.trim());

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=InvalidVerificationToken', baseUrl));
    }

    return NextResponse.redirect(new URL('/login?verified=true', baseUrl));
  } catch (err) {
    logError('Email verification error:', err);
    return NextResponse.redirect(new URL('/login?error=VerificationFailed', baseUrl));
  }
}
