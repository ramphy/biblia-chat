import type { BibleVersionData } from '@/app/components/bible-navigator'; // Assuming type is exported

// Interface for the version data from the API (matching version-selector-popover)
interface ApiVersion {
  id: number;
  abbreviation: string;
  local_abbreviation: string;
  title: string;
  local_title: string;
  language: {
    name: string;
    local_name: string;
  };
}

interface AllVersionsApiResponse {
  response: {
    data: {
      versions: ApiVersion[];
    };
  };
}


// Simple in-memory cache for specific version data
const specificVersionCache: Record<string, BibleVersionData> = {};
// Simple in-memory cache for the list of all versions per language
const allVersionsCache: Record<string, ApiVersion[]> = {};

// Flags to track ongoing fetches for the same key to prevent race conditions
const ongoingSpecificVersionFetches: Record<string, Promise<BibleVersionData>> = {};
const ongoingAllVersionsFetches: Record<string, Promise<ApiVersion[]>> = {};


/**
 * Fetches data for a SPECIFIC Bible version (e.g., books), utilizing an in-memory cache.
 * for the same language and bible abbreviation within the session.
 * @param lng - Language code
 * @param bibleAbbreviation - Bible version abbreviation (e.g., 'RVR1960')
 * @returns Promise resolving to the BibleVersionData
 */
export async function getCachedBibleVersionByAbbreviation(
  lng: string,
  bibleAbbreviation: string
): Promise<BibleVersionData> {
  const cacheKey = `${lng}-${bibleAbbreviation}`;

  // 1. Check specific version cache first
  if (specificVersionCache[cacheKey]) {
    return specificVersionCache[cacheKey];
   }

   // 2. Check if a fetch for this specific version is already in progress
   if (cacheKey in ongoingSpecificVersionFetches) {
     return ongoingSpecificVersionFetches[cacheKey];
   }

  // 3. Fetch specific version data from the internal API
  const fetchPromise = (async () => {
    // This still uses the internal API route, as it fetches specific version details (books etc.)
    const apiUrl = `/api/bible-version/${lng}/${bibleAbbreviation}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        let errorDetails = `Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (parseError) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(`Failed to fetch Bible data (${cacheKey}): ${errorDetails}`);
      }
      const data: BibleVersionData = await response.json();
      if (!data || !data.books) { // Ensure the expected structure for specific version data
        throw new Error(`Invalid data structure received from API (${cacheKey}).`);
      }

      // Store in specific version cache upon successful fetch
      specificVersionCache[cacheKey] = data;
      return data;
    } catch (error) {
      console.error(`[Cache] Error fetching data for ${cacheKey}:`, error);
      // Re-throw the error so the caller can handle it
      throw error;
    } finally {
      // Remove the promise from ongoingSpecificVersionFetches once it resolves or rejects
      delete ongoingSpecificVersionFetches[cacheKey];
    }
  })();

  // Store the promise in ongoingSpecificVersionFetches
  ongoingSpecificVersionFetches[cacheKey] = fetchPromise;

  return fetchPromise;
}


/**
 * Fetches the list of ALL available Bible versions for a given language,
 * utilizing an in-memory cache. Fetches directly from the external API.
 * @param lng - Language code
 * @returns Promise resolving to an array of ApiVersion objects
 */
export async function getAllBibleVersions(lng: string): Promise<ApiVersion[]> {
  const cacheKey = `all-${lng}`;

  // 1. Check all versions cache first
  if (allVersionsCache[cacheKey]) {
    // console.log(`[Cache] Returning cached list of versions for ${lng}`);
    return allVersionsCache[cacheKey];
  }

  // 2. Check if a fetch for this list is already in progress
  if (cacheKey in ongoingAllVersionsFetches) {
    // console.log(`[Cache] Waiting for ongoing fetch for all versions list (${lng})`);
    return ongoingAllVersionsFetches[cacheKey];
  }

  // 3. Fetch data from the EXTERNAL API
  // console.log(`[Cache] Fetching all versions list for ${lng} from external API`);
  const fetchPromise = (async () => {
    const apiUrl = `https://data.biblia.chat/api/${lng}/`; // Direct external API URL
    try {
      // Use { cache: 'no-store' } to ensure fresh data from the external API on each server-side fetch,
      // relying on our own in-memory cache (allVersionsCache) for subsequent requests within the same server instance/session.
      const response = await fetch(apiUrl, { cache: 'no-store' });
      if (!response.ok) {
        let errorDetails = `Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (parseError) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(`Failed to fetch all Bible versions (${lng}): ${errorDetails}`);
      }
      const data: AllVersionsApiResponse = await response.json();

      // Validate the structure before caching
      if (!data?.response?.data?.versions || !Array.isArray(data.response.data.versions)) {
         throw new Error(`Invalid data structure received from external API for all versions (${lng}).`);
      }

      const versions = data.response.data.versions;

      // Store in all versions cache upon successful fetch
      allVersionsCache[cacheKey] = versions;
      // console.log(`[Cache] Stored fetched list of versions for ${lng}`);
      return versions;
    } catch (error) {
      console.error(`[Cache] Error fetching all versions list for ${lng}:`, error);
      // Re-throw the error so the caller can handle it
      throw error;
    } finally {
      // Remove the promise from ongoingAllVersionsFetches once it resolves or rejects
      delete ongoingAllVersionsFetches[cacheKey];
    }
  })();

   // Store the promise in ongoingAllVersionsFetches
   ongoingAllVersionsFetches[cacheKey] = fetchPromise;

   return fetchPromise;
}
