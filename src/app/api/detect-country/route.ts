import { NextRequest, NextResponse } from 'next/server';

interface IPApiResponse {
  country_code?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers (works behind proxies)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    // Extract the first IP if there are multiple
    let clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || '';

    // For localhost / private IPs / empty → return detected country from env or default
    if (
      !clientIp ||
      clientIp === '::1' ||
      clientIp === '127.0.0.1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.') ||
      clientIp === 'localhost'
    ) {
      // In dev, try calling the external API with no IP (gets server IP instead)
      // If that fails too, fall back to the DEFAULT_COUNTRY env var or 'FR'
      try {
        const selfResponse = await fetch('https://ipapi.co/json/', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        });
        if (selfResponse.ok) {
          const selfData: IPApiResponse = await selfResponse.json();
          if (selfData.country_code && !selfData.error) {
            return NextResponse.json({
              countryCode: selfData.country_code,
              country: selfData.country || 'Unknown',
              city: selfData.city || null,
              latitude: typeof selfData.latitude === 'number' ? selfData.latitude : null,
              longitude: typeof selfData.longitude === 'number' ? selfData.longitude : null,
              ip: 'server-ip',
              isDevelopment: true
            });
          }
        }
      } catch {
        // Self-lookup failed, continue to fallback
      }

      const defaultCountry = process.env.DEFAULT_COUNTRY || 'FR';
      return NextResponse.json({
        countryCode: defaultCountry,
        country: defaultCountry === 'FR' ? 'France' : defaultCountry,
        city: null,
        latitude: null,
        longitude: null,
        ip: 'localhost',
        isDevelopment: true
      });
    }

    // Use ipapi.co for geolocation (free tier: 1000 requests/month)
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error('IP API request failed');
    }

    const data: IPApiResponse = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'IP API error');
    }

    return NextResponse.json({
      countryCode: data.country_code || 'FR',
      country: data.country || 'Unknown',
      city: data.city || null,
      latitude: typeof data.latitude === 'number' ? data.latitude : null,
      longitude: typeof data.longitude === 'number' ? data.longitude : null,
      ip: clientIp
    });

  } catch (error) {
    // QRTags : erreur silencieuse (l'API IP peut être indisponible, non bloquant)
    // Return default French on error
    return NextResponse.json({
      countryCode: 'FR',
      country: 'France',
      city: null,
      latitude: null,
      longitude: null,
      ip: 'unknown',
      error: true
    });
  }
}
