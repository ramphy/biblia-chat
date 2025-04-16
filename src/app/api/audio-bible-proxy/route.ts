import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bible_abbreviation, bible_book, bible_chapter, bible_lang } = body;

    // Validate required parameters
    if (!bible_abbreviation || !bible_book || !bible_chapter || !bible_lang) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Proxying audio request for: ${bible_abbreviation}, ${bible_book}, ${bible_chapter}, ${bible_lang}`);

    const externalApiResponse = await fetch('https://data.biblia.chat/api/audio-bible', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other necessary headers if required by the external API
      },
      body: JSON.stringify({
        bible_abbreviation,
        bible_book,
        bible_chapter,
        bible_lang,
      }),
      // Consider caching strategy if appropriate, but default is fine for now
      // cache: 'no-store',
    });

    if (!externalApiResponse.ok) {
      // Forward the error status and potentially the error message from the external API
      let errorBody = `External API error: ${externalApiResponse.status}`;
      try {
        const externalErrorData = await externalApiResponse.json();
        errorBody = externalErrorData.message || externalErrorData.error || JSON.stringify(externalErrorData);
      } catch (e) {
        // Ignore if response body is not JSON or empty
      }
      console.error(`External API request failed: ${externalApiResponse.status}`, errorBody);
      return NextResponse.json({ error: errorBody }, { status: externalApiResponse.status });
    }

    const data = await externalApiResponse.json();

    // Forward the successful response from the external API
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in audio-bible-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
