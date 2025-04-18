import { cache } from 'react'; // Import cache
import { Metadata } from 'next'; // Import Metadata type
import { notFound } from 'next/navigation';
// Import the function to get all versions and its type definition
import { getAllBibleVersions } from '@/lib/bible-version-service';
import type { ApiVersion } from '@/app/components/version-selector-popover'; // Assuming type is defined here
import { BibleChapterView } from '@/app/components/bible-chapter-view'; // Import the new client component view
import BibliaChat from '@/app/components/BibliaChat';

interface BiblePageProps {
  params: {
    lng: string;
    version: string; // Add version parameter
    book: string;
    chapter: string;
  };
}

// Define interfaces for the expected API response structure
// Removed Verse interface as its properties are merged into ContentItem

interface ContentItem {
  type: string;
  text?: string; // For headings, references, etc.
  number?: number; // For verses
  usfm?: string; // For verses
  notes?: any[]; // For verses, define more specific type if needed
}

interface ChapterLink {
  canonical: boolean;
  usfm: string[];
  human: string;
  toc: boolean;
  version_id: number;
}

interface BibleApiResponse {
  title: string; // Changed from reference.human
  usfm: string; // Top-level USFM for the chapter
  locale: string; // Language locale
  content: ContentItem[]; // Array of content items (headings, verses, etc.)
  copyright?: string;
  next_chapter: ChapterLink | null;
  previous_chapter: ChapterLink | null;
  version?: any; // Made optional, define more specific type if needed
  audio_info?: any; // Made optional, define more specific type if needed
}



// Remove hardcoded abbreviation
// const BIBLE_ABBREVIATION = 'RVR1960';

// Update function signature to accept version and wrap with cache
const getChapterData = cache(async (lng: string, version: string, book: string, chapter: string): Promise<BibleApiResponse | null> => {
  // Ensure book is in the correct format (e.g., psa for Psalms)
  const formattedBook = book.toLowerCase(); // Use lowercase based on example URL
  // Use the version parameter in the external API URL
  const apiUrl = `https://data.biblia.chat/api/${version}/${formattedBook}/${chapter}`; // Use version parameter

  console.log(`Fetching Bible data from: ${apiUrl}`); // Log the dynamic URL

  try {
    // Use 'no-store' to ensure fresh data as content might change or API might not cache well
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Failed to fetch Bible data: ${response.status} ${response.statusText}`);
      console.error(`URL: ${apiUrl}`);
      // Attempt to read error body if possible
      try {
        const errorBody = await response.text();
        console.error('Error Body:', errorBody);
      } catch (e) {
        console.error('Could not read error body.');
      }
      return null; // Indicate failure
    }
    const responseData = await response.json();
    // Verify the new data structure
    if (!responseData || !responseData.data) {
      console.error('Unexpected data structure received from Bible API. Expected response.data property.');
      console.error('Response Data:', responseData);
      throw new Error('Invalid API response structure');
    }
    
    const data: BibleApiResponse = responseData.data;

    // Basic validation for the new structure (checking title and content)
    if (data && data.title && data.content) {
      return data;
    } else {
      console.error('Unexpected data structure received from Bible API. Expected title and content.');
      console.error(`URL: ${apiUrl}`);
      console.error('Data:', data);
      return null; // Indicate failure due to structure
    }
  } catch (error) {
    console.error('Error fetching or parsing Bible data:', error);
    console.error(`URL: ${apiUrl}`);
    return null; // Indicate fetch/parse error
  }
});

export default async function BiblePage({ params: paramsProp }: { params: { lng: string; version: string; book: string; chapter: string } }) {

  // Await the params object as required by newer Next.js versions
  const params = await paramsProp;

  // Validate params object and its properties before destructuring
  if (!params || !params.lng || !params.version || !params.book || !params.chapter) { // Add version validation
    console.error('Missing language, version, book, or chapter parameter in params object.');
    notFound(); // Or show a specific error message
  }
  // Destructure after validation, including version
  const { lng, version, book, chapter } = params;

  // Initialize Assistant UI Runtime
  // NOTE: This hook needs to be called unconditionally within the component body.
  // We'll handle the provider wrapping later in the return statement.
  // const runtime = useChatRuntime({ api: "/api/chat" }); // This needs to be inside the component render logic

  // Fetch chapter data and all versions data in parallel
  const [chapterData, allVersions] = await Promise.all([
    getChapterData(lng, version, book, chapter),
    getAllBibleVersions(lng) // Fetch all versions for the language
  ]);

  // Handle potential error fetching all versions (optional, depends on desired behavior)
  // If allVersions is critical, you might want to show an error or notFound()
  // For now, we'll assume it's okay if it fails, the popover will show "No versions available"

  if (chapterData === null) {
    // Handle the case where fetching failed or data structure was wrong
    // Add version to error details
    return (
      <div>
        <h1>Error</h1>
        <p>Could not load the requested Bible chapter. Please try again later.</p>
        <p>(Details: lang={lng}, version={version}, book={book}, chapter={chapter})</p>
      </div>
    );
  }

  // Extract data for rendering (using title instead of reference)
  const { title, content, previous_chapter, next_chapter } = chapterData;

  // Helper function to render content items based on the new structure
  const renderContentItem = (item: ContentItem, index: number) => {
    // Check if it's a verse (has a number)
    if (typeof item.number === 'number' && item.usfm && item.text) {
      // Render verse - using paragraph for spacing, adjust as needed
      // TODO: Consider how to handle notes if necessary
      return (
        <p key={item.usfm} className="leading-relaxed tracking-wide">
          <sup className="font-semibold mr-1 align-super">{item.number}</sup>
          {item.text}
          {/* Render notes if they exist - basic example */}
          {item.notes && item.notes.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              [{item.notes.map(note => `${note.label || ''}${note.body}`).join('; ')}]
            </span>
          )}
        </p>
      );
    }

    // Check for specific types like heading or reference
    switch (item.type) {
      case 'heading':
        // Use larger text, bold, and margin for headings
        return <h2 key={index} className="mt-2 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight">{item.text}</h2>;
      case 'reference':
        // Italic, smaller text, muted color for references
        return (
           <span key={index} className="block text-sm italic text-muted-foreground my-2">
             {item.text}
           </span>
        );
      // Add cases for other potential types if the API might return them
      // e.g., case 'footnote': return <...>
      default:
        // Log unexpected item structure but don't crash
        console.warn(`Unexpected content item structure or type:`, item);
        // Render the text if available, otherwise indicate an issue
        return item.text ? <p key={index} className="text-muted-foreground">[Debug: {item.text}]</p> : null;
    }
  };

    // Helper function to extract book/chapter from USFM (e.g., "PSA.118" -> { book: "PSA", chapter: "118" })
  const parseUsfm = (usfm: string | undefined): { book: string; chapter: string } | null => {
    if (!usfm || !usfm.includes('.')) return null;
    const parts = usfm.split('.');
    if (parts.length < 2) return null;
    // Handle potential multi-part book codes if necessary (e.g., 1JN)
    return { book: parts[0], chapter: parts[1] };
  };

  const prevLinkData = previous_chapter ? parseUsfm(previous_chapter.usfm[0]) : null;
  const nextLinkData = next_chapter ? parseUsfm(next_chapter.usfm[0]) : null;

  // Assistant UI Runtime is now handled within BibleChatInterface

  // Render the client component, passing data as props
  return (
    <>
      <BibleChapterView
        lng={lng}
        version={version}
        book={book}
        chapter={chapter}
        chapterData={chapterData}
        allVersions={allVersions || []} // Pass empty array if fetch failed
      />
    </>
  );
}

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params: paramsProp }: BiblePageProps, // Rename to avoid conflict
): Promise<Metadata> {
  // Await the params object as suggested by the error message
  const params = await paramsProp;
  const { lng, version, book, chapter } = params;
  const chapterData = await getChapterData(lng, version, book, chapter);

  if (!chapterData) {
    // Fallback metadata if data fetching fails
    return {
      title: `Bible Chapter | Biblia.chat`,
      description: `Explore the Bible chapter by chapter.`,
    };
  }

  // Use chapterData.title for metadata
  const pageTitle = `${chapterData.title} (${version.toUpperCase()}) | Biblia.chat`;
  // You can create a more specific description if needed, e.g., using the first few verses
  const description = `Read ${chapterData.title} from the ${version.toUpperCase()} Bible version on Biblia.chat. Explore the scriptures with our AI assistant.`;

  return {
    title: pageTitle, // Use the constructed title
    description: description,
    // Add other relevant metadata tags if desired
    // keywords: ['Bible', 'Scripture', chapterData.reference.human, version, book, chapter],
    // openGraph: {
    //   title: title,
    //   description: description,
    //   url: `/${lng}/bible/${version}/${book}/${chapter}`,
    //   siteName: 'Biblia.chat',
    //   // Add an image if available
    // },
  };
}
