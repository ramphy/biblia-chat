import { notFound } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation

interface BiblePageProps {
  params: {
    lng: string;
    book: string;
    chapter: string;
  };
}

// NOTE: This BUILD_ID might change over time, potentially breaking the data fetching.
// A more robust solution would be needed for production.
const BUILD_ID = 'odPN62GeIjyJdC15r-ASU';
const BIBLE_ID = '149'; // Assuming Reina Valera 1960 based on the example

async function getChapterContent(lng: string, book: string, chapter: string) {
  const apiUrl = `https://www.bible.com/_next/data/${BUILD_ID}/${lng}/bible/${BIBLE_ID}/${book}.${chapter}/${BIBLE_ID}.json`;

  try {
    const response = await fetch(apiUrl, { cache: 'force-cache' }); // Cache data aggressively

    if (!response.ok) {
      console.error(`Failed to fetch Bible data: ${response.status} ${response.statusText}`);
      console.error(`URL: ${apiUrl}`);
      return null; // Indicate failure
    }

    const data = await response.json();

    // Validate the expected structure
    if (data && data.pageProps && data.pageProps.chapterInfo && data.pageProps.chapterInfo.content) {
      return data.pageProps.chapterInfo.content;
    } else {
      console.error('Unexpected data structure received from Bible API.');
      console.error(`URL: ${apiUrl}`);
      console.error('Data:', data);
      return null; // Indicate failure due to structure
    }
  } catch (error) {
    console.error('Error fetching or parsing Bible data:', error);
    console.error(`URL: ${apiUrl}`);
    return null; // Indicate fetch/parse error
  }
}

// Using inferred type for params as suggested by some Next.js patterns
export default async function BiblePage({ params: paramsProp }: { params: { lng: string; book: string; chapter: string } }) {

  // Await the params object as required by newer Next.js versions
  const params = await paramsProp;

  // Validate params object and its properties before destructuring
  if (!params || !params.lng || !params.book || !params.chapter) {
    console.error('Missing language, book, or chapter parameter in params object.');
    notFound(); // Or show a specific error message
  }
  // Destructure after validation
  const { lng, book, chapter } = params;

  const contentHtml = await getChapterContent(lng, book.toUpperCase(), chapter);

  if (contentHtml === null) {
    // Handle the case where fetching failed or data structure was wrong
    // You could show a user-friendly error message here
    return (
      <div>
        <h1>Error</h1>
        <p>Could not load the requested Bible chapter. Please try again later.</p>
        <p>(Details: lang={lng}, book={book}, chapter={chapter})</p>
      </div>
    );
  }

  // --- Chapter Navigation Logic ---
  const currentChapter = parseInt(chapter, 10);
  const prevChapter = currentChapter > 1 ? currentChapter - 1 : null;
  const nextChapter = currentChapter + 1; // Note: Doesn't check for last chapter of the book

  const navButtonStyle = {
    padding: '0.5rem 1rem',
    margin: '0 0.5rem',
    textDecoration: 'none',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#eee',
    color: 'black',
    cursor: 'pointer',
  };

  const disabledButtonStyle = {
    ...navButtonStyle,
    backgroundColor: '#ddd',
    color: '#888',
    cursor: 'not-allowed',
  };
  // --- End Chapter Navigation Logic ---


  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', textAlign: 'center' }}>
      <h1>{book.toUpperCase()} {chapter} ({lng.toUpperCase()})</h1>

      {/* Render the fetched HTML content - centered */}
      <div
        dangerouslySetInnerHTML={{ __html: contentHtml }}
        style={{ textAlign: 'left', marginTop: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}
      />

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        {prevChapter ? (
          <Link href={`/${lng}/bible/${book}/${prevChapter}`} style={navButtonStyle}>
            &larr; Chapter {prevChapter}
          </Link>
        ) : (
          <span style={disabledButtonStyle}>&larr; Previous</span>
        )}

        {/* We don't know the last chapter, so Next is always enabled for now */}
        <Link href={`/${lng}/bible/${book}/${nextChapter}`} style={navButtonStyle}>
          Chapter {nextChapter} &rarr;
        </Link>
      </div>
    </div>
  );
}

// Optional: Add metadata generation if needed
// export async function generateMetadata({ params }: BiblePageProps) {
//   return {
//     title: `${params.book} ${params.chapter} - Bible Viewer`,
//   };
// }
