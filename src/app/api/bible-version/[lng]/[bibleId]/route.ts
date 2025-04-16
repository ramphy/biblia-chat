// src/app/api/bible-version/[lng]/[bibleId]/route.ts
// NOTE: The route parameter is named 'bibleId' due to Next.js constraints,
// but its VALUE is expected to be the Bible ABBREVIATION (e.g., 'RVR1960').
import { NextResponse } from 'next/server';

// Define the expected structure for the parameters in the context
interface RouteParams {
  params: {
    lng: string;
    bibleId: string; // Route param name is 'bibleId'
  };
}

// Define the structure of the external API response
interface ExternalBibleApiResponse {
  id: number;
  abbreviation: string;
  local_abbreviation: string;
  title: string;
  local_title: string;
  books: any[];
}

export async function GET(request: Request, { params: paramsProp }: RouteParams) {
  // Await the params object before accessing its properties
  const params = await paramsProp;
  // Destructure bibleId, but treat its value as the abbreviation
  const { lng, bibleId: bibleAbbreviation } = params; // Rename bibleId to bibleAbbreviation internally

  if (!lng || !bibleAbbreviation) {
    // Use the internal variable name in the error message for clarity
    return NextResponse.json({ error: 'Missing language or Bible abbreviation parameter' }, { status: 400 });
  }

  // Use the bibleAbbreviation value (from the bibleId route param) in the external API URL
  const externalApiUrl = `https://data.biblia.chat/api/${lng}/${bibleAbbreviation}`;
  console.log(`Internal API route fetching from: ${externalApiUrl}`);

  try {
    const response = await fetch(externalApiUrl, { cache: 'force-cache' });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`External API Error (${response.status}): ${response.statusText}`);
      console.error(`External API URL: ${externalApiUrl}`);
      console.error(`External API Response Body: ${errorBody}`);
      return NextResponse.json(
        { error: `Failed to fetch data from external Bible API: ${response.statusText}`, details: errorBody },
        { status: response.status }
      );
    }

    const data: ExternalBibleApiResponse = await response.json();

    if (!data || !data.books) {
        console.error('Invalid data structure received from external API.');
        console.error(`External API URL: ${externalApiUrl}`);
        console.error('Data:', data);
        return NextResponse.json({ error: 'Invalid data structure received from external API' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in internal API route:', error);
    return NextResponse.json(
        { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
    );
  }
}
