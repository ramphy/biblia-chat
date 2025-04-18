'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play, Pause, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AudioBibleButtonProps {
  bibleUsfm: string;
  bibleBook: string;
  bibleChapter: string;
  bibleLang: string;
}

export function AudioBibleButton({
  bibleUsfm,
  bibleBook,
  bibleChapter,
  bibleLang,
}: AudioBibleButtonProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayAudio = async () => {
    // Si el reproductor está visible y hay audio, cerrarlo
    if (isPlayerVisible && audioUrl) {
      setAudioUrl(null);
      setIsPlayerVisible(false);
      return;
    }

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
          bible_usfm: bibleUsfm,
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
        setIsPlaying(true);
        setIsPlayerVisible(true);
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
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 bg-card border rounded-lg shadow-lg px-3 space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <div className="flex-1 mx-4" style={{ marginTop: '18px' }}>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-24">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVolumeChange([volume > 0 ? 0 : 1])}
                aria-label={volume > 0 ? 'Silenciar' : 'Activar sonido'}
              >
                {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>

            {/* <Button
              variant="link"
              size="icon"
              onClick={() => {
                setAudioUrl(null);
                setIsPlayerVisible(false);
              }}
              className="absolute bottom-0 right-0 m-0 p-2 text-muted-foreground transform rotate-90"
              aria-label="Cerrar reproductor de audio"
            >
              <X className="h-6 w-6" />
            </Button> */}
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            autoPlay
            className="hidden"
          >
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      )}
    </>
  );
}
