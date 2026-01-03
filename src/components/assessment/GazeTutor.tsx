import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, HelpCircle } from 'lucide-react';

interface GazeTutorProps {
  word: string | null;
  position: { x: number; y: number } | null;
  duration: number; // How long they've been stuck in ms
  onDismiss?: () => void;
}

// Phonetic breakdown helper
function getPhoneticHint(word: string): string {
  // Simple syllable approximation
  const syllables = word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/([aeiou]+)/g, '-$1-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .filter(s => s.length > 0);
  
  return syllables.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ');
}

// Common word pronunciations
const PRONUNCIATIONS: Record<string, string> = {
  'the': 'thuh',
  'through': 'throo',
  'thought': 'thawt',
  'though': 'thoh',
  'enough': 'ee-nuf',
  'dyslexia': 'dis-LEK-see-uh',
  'reading': 'REE-ding',
  'pathways': 'PATH-wayz',
  'challenging': 'CHAL-en-jing',
  'impossible': 'im-POSS-uh-bul'
};

export function GazeTutor({ word, position, duration, onDismiss }: GazeTutorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show hint after 2 seconds of fixation
  useEffect(() => {
    if (duration >= 2000 && word && position) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [duration, word, position]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (isVisible) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 5000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, onDismiss]);

  const speakWord = useCallback(() => {
    if (!word || isSpeaking) return;
    
    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.7; // Slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.cancel(); // Cancel any ongoing speech
    speechSynthesis.speak(utterance);
  }, [word, isSpeaking]);

  if (!word || !position) return null;

  const phonetic = PRONUNCIATIONS[word.toLowerCase()] || getPhoneticHint(word);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: Math.max(20, Math.min(position.x - 100, window.innerWidth - 220)),
            top: position.y + 30
          }}
        >
          <div className="bg-card border border-border shadow-lg rounded-xl p-4 min-w-[200px]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Need help?</span>
            </div>
            
            {/* Word */}
            <div className="text-xl font-bold text-foreground mb-2">
              {word}
            </div>
            
            {/* Phonetic hint */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span className="font-mono bg-muted px-2 py-1 rounded">
                {phonetic}
              </span>
            </div>
            
            {/* Speak button */}
            <button
              onClick={speakWord}
              disabled={isSpeaking}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
              <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
            </button>
            
            {/* Arrow pointing up */}
            <div 
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid hsl(var(--border))'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}