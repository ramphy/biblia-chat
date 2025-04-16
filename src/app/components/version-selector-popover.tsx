'use client';

import React, { useState, useMemo } from 'react'; // Removed useEffect
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
// Use the type from the service if needed, or keep local if identical/sufficient
// Assuming the local definition is fine for now.
// Interface for the version data from the API - Exported for use elsewhere
export interface ApiVersion {
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


interface VersionSelectorPopoverProps {
  lng: string;
  allVersions: ApiVersion[]; // Added prop for pre-fetched versions
  currentVersionAbbr: string;
  currentBookUsfm: string;
  currentChapter: string;
}

// Helper function to remove accents and convert to lowercase
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize("NFD") // Decompose combined graphemes into base characters and diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics (accents)
    .toLowerCase();
};


export function VersionSelectorPopover({
  lng,
  allVersions, // Destructure the new prop here
  currentVersionAbbr,
  currentBookUsfm,
  currentChapter,
}: VersionSelectorPopoverProps) {
  // Removed the duplicated destructuring block
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  // Removed versions, isLoading, error states
  const [searchTerm, setSearchTerm] = useState('');

  // Removed useEffect for fetching

  const filteredVersions = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    // Use the allVersions prop directly
    if (!normalizedSearch) return allVersions;

    return allVersions.filter((version: ApiVersion) =>
      normalizeString(version.abbreviation).includes(normalizedSearch) ||
      normalizeString(version.local_abbreviation).includes(normalizedSearch) ||
      normalizeString(version.title).includes(normalizedSearch) ||
      normalizeString(version.local_title).includes(normalizedSearch)
    );
  }, [allVersions, searchTerm]); // Depend on the prop and search term

  const handleVersionSelect = (selectedVersionAbbr: string) => {
    setIsOpen(false); // Close the popover
    // Navigate only if the version is different
    if (selectedVersionAbbr !== currentVersionAbbr) {
      // Use the current book and chapter for the new URL
      router.push(`/${lng}/bible/${selectedVersionAbbr}/${currentBookUsfm}/${currentChapter}`);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* Display the current version abbreviation */}
        <Button variant="outline" className="w-full justify-between text-sm font-medium">
          <span>Version: {currentVersionAbbr}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        {/* Removed loading/error states - handled by parent */}
        <>
          <div className="p-2">
            <Input
                type="text"
                placeholder="Search versions..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2 pt-0">
              {/* Check if allVersions exists and has items */}
              {allVersions && allVersions.length > 0 ? (
                filteredVersions.length > 0 ? (
                  filteredVersions.map((version: ApiVersion) => (
                    <Button
                      key={version.id} // Use version.id which should be unique
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left h-auto py-2 px-3 mb-1",
                        version.abbreviation === currentVersionAbbr && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleVersionSelect(version.abbreviation)}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{version.local_title || version.title}</span>
                        <span className="text-xs text-muted-foreground">{version.abbreviation}</span>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No matching versions found.</p>
                )
              ) : (
                 <p className="p-4 text-center text-sm text-muted-foreground">No versions available.</p> // Handle case where prop might be empty/null initially
              )}
            </div>
          </ScrollArea>
        </>
      </PopoverContent>
    </Popover>
  );
}
