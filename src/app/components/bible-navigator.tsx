'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea is installed/available
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

// Interfaces based on the provided API response
interface ChapterInfo {
  toc: boolean;
  usfm: string;
  human: string;
  canonical: boolean;
}

interface BookInfo {
  text: boolean;
  usfm: string; // e.g., "GEN"
  audio: boolean;
  canon: string;
  human: string; // e.g., "Génesis"
  first_chapter: ChapterInfo;
  last_chapter: ChapterInfo;
  human_long?: string;
  abbreviation?: string;
}

export interface BibleVersionData {
  title: string;
  usfm: string;
  books: BookInfo[];
  language: string;
  direction: string;
  publisher: Array<{
    name: string;
    description: string | null;
    url: string;
  }>;
  notes: Array<{}>;
}

interface BibleNavigatorProps {
  lng: string;
  currentVersionUsfm: string; // Add version prop
  currentBookUsfm: string;
  onChapterSelect: (bookUsfm: string, chapter: string) => void;
  versionData: BibleVersionData | null;
  isLoading: boolean;
  error: string | null;
}

export function BibleNavigator({
  lng,
  currentVersionUsfm, // Destructure new prop
  currentBookUsfm,
  onChapterSelect,
  versionData,
  isLoading,
  error
}: BibleNavigatorProps) {
  // Remove internal state for data, loading, error
  // const [versionData, setVersionData] = useState<BibleVersionData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // Remove useEffect for data fetching
  // useEffect(() => { ... }, [lng, bibleId]);

  // Helper function to remove accents and convert to lowercase
  const normalizeString = (str: string): string => {
    return str
      .normalize("NFD") // Decompose combined graphemes into base characters and diacritics
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics (accents)
      .toLowerCase();
  };

  const filteredBooks = useMemo(() => {
    if (!versionData) return [];
    const normalizedSearchTerm = normalizeString(searchTerm);
    if (!normalizedSearchTerm) return versionData.books; // Show all books if search is empty

    return versionData.books.filter(book =>
      normalizeString(book.human).includes(normalizedSearchTerm) ||
      (book.human_long && normalizeString(book.human_long).includes(normalizedSearchTerm)) ||
      (book.abbreviation && normalizeString(book.abbreviation).includes(normalizedSearchTerm))
    );
  }, [versionData, searchTerm]); // Keep dependency on versionData prop

  const handleBookSelect = (book: BookInfo) => {
    setSelectedBook(book);
    setSearchTerm(''); // Clear search when a book is selected
  };

  const handleChapterSelect = (chapter: ChapterInfo) => {
    if (!selectedBook) return;
    const chapterNumber = chapter.human;
    // Call the callback function instead of navigating directly
    onChapterSelect(selectedBook.usfm, chapterNumber);
  };

  const canonicalChapters = useMemo(() => {
    if (!selectedBook) return [];
    // Generate chapters array from first to last chapter
    const chapters = [];
    const firstNum = parseInt(selectedBook.first_chapter.usfm.split('.')[1]);
    const lastNum = parseInt(selectedBook.last_chapter.usfm.split('.')[1]);
    
    for (let i = firstNum; i <= lastNum; i++) {
      chapters.push({
        usfm: `${selectedBook.usfm}.${i}`,
        human: i.toString(),
        canonical: true,
        toc: true
      });
    }
    return chapters;
  }, [selectedBook]);

  // Use props for conditional rendering
  if (isLoading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error loading navigator: {error}</div>;
  }

  if (!versionData) {
     return <div className="p-4 text-center">No Bible data available.</div>;
  }

  return (
    <Card className="mb-6">
      <CardContent>
        {!selectedBook ? (
          <>
            <Input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {/* Replace ScrollArea with a 4-column grid */}
            <div className="grid grid-cols-6 gap-1">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book: BookInfo) => (
                  <Button
                    key={book.usfm}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left p-2 h-auto", // Adjust styling for grid
                      book.usfm === currentBookUsfm && "bg-accent text-accent-foreground" // Highlight current book
                    )}
                    onClick={() => handleBookSelect(book)}
                  >
                    {book.human}
                  </Button>
                ))
              ) : (
                 // Span across all columns if no books found
                <p className="col-span-4 text-center text-muted-foreground">No books found.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setSelectedBook(null)} className="mb-4 w-full">
              &larr; Back to Books
            </Button>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {canonicalChapters.map((chapter: ChapterInfo) => (
                <Button
                  key={chapter.usfm}
                  variant="outline"
                  size="sm" // Make buttons smaller for grid
                  className="aspect-square p-0" // Make them square
                  onClick={() => handleChapterSelect(chapter)}
                >
                  {chapter.human}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
