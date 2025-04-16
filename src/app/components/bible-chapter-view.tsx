'use client'; // This is the client component

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BibleSelectorPopover } from '@/app/components/bible-selector-popover';
import { VersionSelectorPopover } from '@/app/components/version-selector-popover';
import { AudioBibleButton } from '@/app/components/audio-bible-button';
import type { ApiVersion } from '@/app/components/version-selector-popover'; // Assuming type is defined here
import { cn } from "@/lib/utils"; // Import cn utility for conditional classes

// Re-define necessary types here or import from a shared types file if available
interface ContentItem {
  type: string;
  text?: string;
  number?: number;
  usfm?: string;
  notes?: any[];
}

interface ChapterLink {
  canonical: boolean;
  usfm: string[];
  human: string;
  toc: boolean;
  version_id: number;
}

interface BibleApiResponse {
  title: string;
  usfm: string;
  locale: string;
  content: ContentItem[];
  copyright?: {
    html: string;
    text: string;
  };
  next_chapter: ChapterLink | null;
  previous_chapter: ChapterLink | null;
  version?: any;
  audio_info?: any;
}

interface BibleChapterViewProps {
  lng: string;
  version: string;
  book: string;
  chapter: string;
  chapterData: BibleApiResponse; // Pass fetched data as prop
  allVersions: ApiVersion[]; // Pass fetched versions as prop
}

// Helper function to render content items (copied from original page)
const renderContentItem = (item: ContentItem, index: number) => {
  if (typeof item.number === 'number' && item.usfm && item.text) {
    return (
      <p key={item.usfm} className="leading-relaxed tracking-wide">
        <sup className="font-semibold mr-1 align-super">{item.number}</sup>
        {item.text}
        {item.notes && item.notes.length > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            [{item.notes.map(note => `${note.label || ''}${note.body}`).join('; ')}]
          </span>
        )}
      </p>
    );
  }
  switch (item.type) {
    case 'heading':
      return <h2 key={index} className="mt-2 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight">{item.text}</h2>;
    case 'reference':
      return (
         <span key={index} className="block text-sm italic text-muted-foreground my-2">
           {item.text}
         </span>
      );
    default:
      // console.warn(`Unexpected content item structure or type:`, item);
      return item.text ? <p key={index} className="text-muted-foreground">{item.text}</p> : null;
  }
};

// Helper function to parse USFM (copied from original page)
const parseUsfm = (usfm: string | undefined): { book: string; chapter: string } | null => {
  if (!usfm || !usfm.includes('.')) return null;
  const parts = usfm.split('.');
  if (parts.length < 2) return null;
  return { book: parts[0], chapter: parts[1] };
};

export function BibleChapterView({
  lng,
  version,
  book,
  chapter,
  chapterData,
  allVersions
}: BibleChapterViewProps) {

  const { title, content, previous_chapter, next_chapter } = chapterData;
  const prevLinkData = previous_chapter ? parseUsfm(previous_chapter.usfm[0]) : null;
  const nextLinkData = next_chapter ? parseUsfm(next_chapter.usfm[0]) : null;

  return (
    <>
      {/* Main container: Apply max-width conditionally */}
      <div className="container mx-auto py-8 max-w-3xl">

        {/* Bible Text Card: Keep original classes, let flexbox handle width */}
        <Card className="w-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-2">
            {/* Use h1 with specific Tailwind classes, displaying the title */}
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {/* Container for buttons */}
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <BibleSelectorPopover
                    lng={lng}
                    currentVersionAbbr={version} // Pass current version
                    currentBookUsfm={book}
                    currentChapter={chapter}
                    currentReferenceHuman={title} // Pass the title (formerly reference.human)
                  />
                </div>
                <div className="w-40"> {/* Give version selector a fixed width */}
                  <VersionSelectorPopover
                    lng={lng}
                    allVersions={allVersions || []} // Pass the fetched versions (or empty array if fetch failed)
                    currentVersionAbbr={version}
                    currentBookUsfm={book} // Pass current book/chapter for navigation
                    currentChapter={chapter}
                  />
                </div>
              </div>
              {/* Add the AudioBibleButton, passing necessary props */}
              <AudioBibleButton
                bibleAbbreviation={version} // Pass the version abbreviation
                bibleBook={book} // Pass the book USFM code
                bibleChapter={chapter} // Pass the chapter number
                bibleLang={lng} // Pass the language
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6"> {/* Added padding top to CardContent for spacing */}
            {/* Adjusted spacing for potentially mixed content (headings, verses) */}
            <div className="text-base md:text-lg leading-relaxed space-y-4">
              {content.map(renderContentItem)}
            </div>

            {/* Navigation Buttons using shadcn Button */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              {previous_chapter && prevLinkData ? (
                <Button asChild variant="outline">
                  {/* Add version to the link */}
                  <Link href={`/${lng}/bible/${version}/${prevLinkData.book}/${prevLinkData.chapter}`}>
                    &larr; {previous_chapter.human}
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  &larr; Previous
                </Button>
              )}

              {next_chapter && nextLinkData ? (
                <Button asChild variant="outline">
                  {/* Add version to the link */}
                  <Link href={`/${lng}/bible/${version}/${nextLinkData.book}/${nextLinkData.chapter}`}>
                    {next_chapter.human} &rarr;
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next &rarr;
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optional: Display Copyright - Consider styling if uncommented */}
        {/* <div style={{ marginTop: '2rem', fontSize: '0.8em', color: '#666', textAlign: 'center' }}
             dangerouslySetInnerHTML={{ __html: chapterData.copyright?.html }} /> */}
      </div>
    </>
  );
}
