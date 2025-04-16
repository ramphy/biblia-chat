'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, X } from 'lucide-react'; // Using icons for the button and close

interface AudioBibleButtonProps {
  bibleAbbreviation: string;
  bibleBook: string;
  bibleChapter: string;
  bibleLang: string;
}

export function AudioBibleButton({
  bibleAbbreviation,
  bibleBook,
  bibleChapter,
  bibleLang,
}: AudioBibleButtonProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayAudio = async () => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(null); // Reset audio URL on new request

    try {
      // Use the internal proxy API route
      const response = await fetch('/api/audio-bible-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bible_abbreviation: bibleAbbreviation,
          bible_book: bibleBook,
          bible_chapter: bibleChapter,
          bible_lang: bibleLang,
        }),
      });

      if (!response.ok) {
        // Attempt to read error message from response body
        let errorBody = 'Error desconocido del servidor.';
        try {
          const errorData = await response.json();
          errorBody = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(`Error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();

      // Use the correct key 'audio_url' based on user feedback
      if (data.audio_url) {
        setAudioUrl(data.audio_url);
      } else {
        console.warn('Audio URL (audio_url) not found in response:', data);
        setError('No se pudo obtener la URL del audio desde la respuesta.');
      }
    } catch (err) {
      console.error('Error fetching audio bible:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al solicitar el audio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handlePlayAudio} disabled={isLoading} variant="outline" size="icon" aria-label="Escuchar capítulo">
        {isLoading ? (
          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" role="status" aria-live="polite"></span>
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

      {audioUrl && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 bg-card border rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <audio controls autoPlay src={audioUrl} className="flex-grow">
            Tu navegador no soporta el elemento de audio.
          </audio>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAudioUrl(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar reproductor de audio"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
