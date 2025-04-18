// src/app/components/bible-selector-popover.tsx
'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
// Import BibleNavigator and its data type
import { BibleNavigator, type BibleVersionData } from './bible-navigator';
// Import the caching service
import { getCachedBibleVersionByUsfm } from '@/lib/bible-version-service';
import { ChevronDown } from 'lucide-react';

interface BibleSelectorPopoverProps {
  lng: string;
  currentVersionUsfm: string; // Changed from abbreviation to usfm
  currentBookUsfm: string;
  currentChapter: string;
  currentReferenceHuman: string; // e.g., "Génesis 1"
}

export function BibleSelectorPopover({
  lng,
  currentVersionUsfm, // Use usfm instead of abbreviation
  currentBookUsfm,
  currentChapter,
  currentReferenceHuman,
}: BibleSelectorPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [versionData, setVersionData] = useState<BibleVersionData | null>(null);
  // Initialize isLoading to false, as we only load when popover opens
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to get data using the cache service when the popover opens
  useEffect(() => {
    // Only attempt to get data if the popover is open and we have lng/currentVersionAbbr
    if (isOpen && lng && currentVersionUsfm) { // Use currentVersionUsfm
      // Indicate loading only if data isn't already present
      if (!versionData) {
        setIsLoading(true);
      }
      setError(null); // Clear previous errors

      // Fetch data based on the current version abbreviation
      getCachedBibleVersionByUsfm(currentVersionUsfm)
        .then(data => {
          // Check if the fetched data's abbreviation matches the current prop
          // This prevents updating state with stale data if the version changed while fetching
          if (data?.usfm === currentVersionUsfm) {
             setVersionData(data);
          } else if (data) {
             // If abbreviations don't match, it means the version changed.
             // We could potentially trigger a new fetch here, but for now,
             // let's just clear the old data to avoid showing incorrect books/chapters.
             setVersionData(null);
             console.warn("Stale Bible data detected, clearing.");
          }
        })
        .catch(err => {
          console.error('Error getting Bible version data from service:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setVersionData(null); // Clear data on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isOpen) {
      // Optional: Clear data when popover closes to ensure fresh data next time?
      // setVersionData(null);
    }
    // Dependency array: run when popover opens/closes or identifiers change
  }, [isOpen, lng, currentVersionUsfm]); // Use currentVersionUsfm in dependency array


  const handleChapterSelect = (bookUsfm: string, chapter: string) => {
    setIsOpen(false); // Close the popover on selection
    // Only navigate if the selection is different from the current page
    if (bookUsfm !== currentBookUsfm || chapter !== currentChapter) {
        // Include the current version abbreviation in the navigation URL
        router.push(`/${lng}/bible/${currentVersionUsfm}/${bookUsfm}/${chapter}`);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between text-sm font-medium">
          <span>{currentReferenceHuman}</span>
          <ChevronDown className="ml-2 h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-3xl max-h-[--radix-popover-content-available-height] p-0">
        {/* Render BibleNavigator only when popover is open to fetch data */}
        {/* We pass isOpen to conditionally render, preventing unnecessary data fetching when closed */}
        {/* Render BibleNavigator only when popover is open */}
        {/* Pass fetched data, loading state, and error state down */}
        {isOpen && (
            <BibleNavigator
              lng={lng}
              currentVersionUsfm={currentVersionUsfm} // Pass version down
              currentBookUsfm={currentBookUsfm}
              onChapterSelect={handleChapterSelect}
              versionData={versionData}
              isLoading={isLoading}     // Pass loading state
              error={error}           // Pass error state
            />
        )}
      </PopoverContent>
    </Popover>
  );
}
