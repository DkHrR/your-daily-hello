import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdaptiveTextDisplayProps {
  text: string;
  dyslexiaMode?: boolean;
  syllableHighlight?: boolean;
  warmBackground?: boolean;
  focusOverlay?: boolean;
  currentWord?: string;
  onWordHover?: (word: string) => void;
  gazePosition?: { x: number; y: number } | null;
}

// Simple syllable splitting (basic implementation)
function splitIntoSyllables(word: string): string[] {
  const vowels = 'aeiouyAEIOUY';
  const syllables: string[] = [];
  let current = '';
  let lastWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const isVowel = vowels.includes(char);
    
    current += char;
    
    if (lastWasVowel && !isVowel && i < word.length - 1) {
      syllables.push(current);
      current = '';
    }
    
    lastWasVowel = isVowel;
  }
  
  if (current) {
    if (syllables.length > 0 && current.length <= 2) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }
  
  return syllables.length > 0 ? syllables : [word];
}

export function AdaptiveTextDisplay({
  text,
  dyslexiaMode = false,
  syllableHighlight = false,
  warmBackground = false,
  focusOverlay = false,
  currentWord,
  onWordHover,
  gazePosition,
}: AdaptiveTextDisplayProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [stuckWord, setStuckWord] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const stuckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const words = text.split(/(\s+)/);

  // Detect if gaze is stuck on a word
  useEffect(() => {
    if (!gazePosition || !containerRef.current) return;

    const checkWordUnderGaze = () => {
      wordRefs.current.forEach((element, word) => {
        const rect = element.getBoundingClientRect();
        if (
          gazePosition.x >= rect.left &&
          gazePosition.x <= rect.right &&
          gazePosition.y >= rect.top &&
          gazePosition.y <= rect.bottom
        ) {
          if (stuckTimerRef.current) {
            clearTimeout(stuckTimerRef.current);
          }
          stuckTimerRef.current = setTimeout(() => {
            setStuckWord(word);
            if (audioEnabled) {
              speakWord(word);
            }
          }, 2000);
        }
      });
    };

    checkWordUnderGaze();

    return () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }
    };
  }, [gazePosition, audioEnabled]);

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleWordClick = (word: string) => {
    speakWord(word);
    onWordHover?.(word);
  };

  return (
    <div
      ref={containerRef}
      className={`relative p-8 rounded-2xl transition-all duration-500 ${
        warmBackground ? 'warm-background' : 'bg-card'
      } ${dyslexiaMode ? 'dyslexia-mode' : ''} ${focusOverlay ? 'focus-overlay' : ''}`}
    >
      {/* Audio toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? 'Disable audio hints' : 'Enable audio hints'}
        >
          {audioEnabled ? (
            <Volume2 className="w-5 h-5 text-primary" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Text content */}
      <div className="text-2xl leading-relaxed">
        {words.map((word, index) => {
          const trimmedWord = word.trim();
          if (!trimmedWord) {
            return <span key={index}>{word}</span>;
          }

          const syllables = syllableHighlight ? splitIntoSyllables(trimmedWord) : [trimmedWord];
          const isStuck = stuckWord === trimmedWord;
          const isHovered = hoveredWord === trimmedWord;
          const isCurrent = currentWord === trimmedWord;

          return (
            <motion.span
              key={index}
              ref={(el) => {
                if (el) wordRefs.current.set(trimmedWord, el);
              }}
              className={`relative inline cursor-pointer transition-all duration-200 rounded px-1 ${
                isStuck ? 'bg-warning/30 ring-2 ring-warning' : ''
              } ${isHovered ? 'bg-primary/10' : ''} ${isCurrent ? 'bg-accent/20' : ''}`}
              onMouseEnter={() => setHoveredWord(trimmedWord)}
              onMouseLeave={() => setHoveredWord(null)}
              onClick={() => handleWordClick(trimmedWord)}
              whileHover={{ scale: 1.05 }}
            >
              {syllableHighlight ? (
                syllables.map((syllable, sIndex) => (
                  <span
                    key={sIndex}
                    className={sIndex % 2 === 0 ? 'syllable-highlight' : ''}
                  >
                    {syllable}
                  </span>
                ))
              ) : (
                trimmedWord
              )}
              
              {/* Stuck word indicator */}
              {isStuck && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap"
                >
                  <Volume2 className="w-3 h-3 inline mr-1" />
                  Speaking...
                </motion.div>
              )}
            </motion.span>
          );
        })}
      </div>

      {/* Reading ruler indicator */}
      {focusOverlay && (
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Focus overlay active - peripheral content dimmed
        </div>
      )}
    </div>
  );
}
