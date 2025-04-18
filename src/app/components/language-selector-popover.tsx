'use client';

import React, { useState, useEffect } from 'react';
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

interface Language {
  iso_639_3: string;
  iso_639_1: string | null;
  language_tag: string;
  local_name: string;
  name: string;
  text_direction: string;
  id: number;
  total_versions: number;
  has_audio: boolean;
  font: string | null;
  has_text: boolean;
}

interface LanguageSelectorPopoverProps {
  lng: string;
  currentBookUsfm: string;
  currentChapter: string;
}

export function LanguageSelectorPopover({
  lng,
  currentBookUsfm,
  currentChapter,
}: LanguageSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchLanguages = async () => {
    try {
      const response = await fetch('https://data.biblia.chat/api/versions/');
      const data = await response.json();
      setLanguages(data.data);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && languages.length === 0) {
      fetchLanguages();
    }
  };


  const handleLanguageSelect = (languageTag: string) => {
    setIsOpen(false);
    router.push(`/${languageTag}/bible/${currentBookUsfm}/${currentChapter}`);
  };

  const filteredLanguages = languages.filter(language => {
    const searchLower = searchTerm.toLowerCase();
    return (
      language.name.toLowerCase().includes(searchLower) ||
      language.local_name.toLowerCase().includes(searchLower) ||
      (language.iso_639_1?.toLowerCase().includes(searchLower) ?? false) ||
      language.iso_639_3.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between text-sm font-medium">
          <span>Language</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-2">
          <Input
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 pt-0">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <Button
                  key={language.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-3 mb-1"
                  onClick={() => handleLanguageSelect(language.language_tag)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{language.local_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {language.name}
                    </span>
                  </div>
                </Button>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No matching languages found.
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
