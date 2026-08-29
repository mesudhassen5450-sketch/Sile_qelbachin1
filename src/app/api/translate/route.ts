import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let fallbackText = '';

  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text || body.q || '';
    const target = body.targetLang || body.targetLanguage || 'am';
    fallbackText = text;

    // If text is empty or target is Amharic (default source), return directly
    if (!text || target === 'am') {
      return NextResponse.json({ translatedText: text });
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      // Safe fallback when API key is not set
      return NextResponse.json({ translatedText: text });
    }

    // Call Google Cloud Translate REST API
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: target,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ translatedText: text });
    }

    // Safely parse JSON without throwing on HTML error pages
    const textResponse = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(textResponse);
    } catch {
      return NextResponse.json({ translatedText: text });
    }

    const translatedText = data.data?.translations?.[0]?.translatedText || text;

    return NextResponse.json({ translatedText });
  } catch (error) {
    // Never return 500 error — always return status 200 with fallback text
    return NextResponse.json({ translatedText: fallbackText }, { status: 200 });
  }
}
