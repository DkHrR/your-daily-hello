import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdaptiveTextDisplay } from '@/components/reading/AdaptiveTextDisplay';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Type, 
  Palette, 
  Sparkles, 
  Eye, 
  Settings2,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const sampleTexts = [
  {
    id: 1,
    title: 'The Adventure Begins',
    text: `Once upon a time, in a land far away, there lived a young explorer named Maya. She loved to discover new places and learn about the world around her. Every morning, she would wake up with excitement, wondering what adventures the day would bring.`,
    level: 'Beginner',
  },
  {
    id: 2,
    title: 'Ocean Mysteries',
    text: `The ocean covers more than seventy percent of our planet's surface. Beneath the waves lies a world of incredible diversity. Scientists estimate that we have explored less than five percent of the ocean floor. Many creatures living in the deep sea remain undiscovered, waiting for curious minds to find them.`,
    level: 'Intermediate',
  },
  {
    id: 3,
    title: 'The Science of Reading',
    text: `Phonological awareness refers to the ability to recognize and manipulate the sound structures of language. This includes identifying rhymes, segmenting words into syllables, and blending individual phonemes. Research demonstrates that explicit instruction in phonological awareness significantly improves reading outcomes for students with dyslexia.`,
    level: 'Advanced',
  },
];

export default function ReadingLabPage() {
  const [selectedTextIndex, setSelectedTextIndex] = useState(0);
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [syllableHighlight, setSyllableHighlight] = useState(false);
  const [warmBackground, setWarmBackground] = useState(false);
  const [focusOverlay, setFocusOverlay] = useState(false);
  const [fontSize, setFontSize] = useState([18]);
  const [lineSpacing, setLineSpacing] = useState([1.8]);

  const currentText = sampleTexts[selectedTextIndex];

  const nextText = () => {
    setSelectedTextIndex((prev) => (prev + 1) % sampleTexts.length);
  };

  const prevText = () => {
    setSelectedTextIndex((prev) => (prev - 1 + sampleTexts.length) % sampleTexts.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Adaptive Reading Lab</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-gradient-neuro">Zen Mode</span> Reading Interface
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Customize your reading experience with dyslexia-friendly adaptations,
              focus overlays, and syllable highlighting.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Reading Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dyslexia Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Type className="w-5 h-5 text-primary" />
                      <Label htmlFor="dyslexia-mode">OpenDyslexic Font</Label>
                    </div>
                    <Switch
                      id="dyslexia-mode"
                      checked={dyslexiaMode}
                      onCheckedChange={setDyslexiaMode}
                    />
                  </div>

                  {/* Syllable Highlight */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-accent-foreground" />
                      <Label htmlFor="syllable-highlight">Syllable Highlighting</Label>
                    </div>
                    <Switch
                      id="syllable-highlight"
                      checked={syllableHighlight}
                      onCheckedChange={setSyllableHighlight}
                    />
                  </div>

                  {/* Warm Background */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-warning" />
                      <Label htmlFor="warm-bg">Warm Background (Irlen)</Label>
                    </div>
                    <Switch
                      id="warm-bg"
                      checked={warmBackground}
                      onCheckedChange={setWarmBackground}
                    />
                  </div>

                  {/* Focus Overlay */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-secondary" />
                      <Label htmlFor="focus-overlay">Focus Overlay</Label>
                    </div>
                    <Switch
                      id="focus-overlay"
                      checked={focusOverlay}
                      onCheckedChange={setFocusOverlay}
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-3">
                    <Label>Font Size: {fontSize[0]}px</Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={14}
                      max={32}
                      step={2}
                    />
                  </div>

                  {/* Line Spacing */}
                  <div className="space-y-3">
                    <Label>Line Spacing: {lineSpacing[0]}x</Label>
                    <Slider
                      value={lineSpacing}
                      onValueChange={setLineSpacing}
                      min={1.2}
                      max={2.5}
                      step={0.1}
                    />
                  </div>

                  {/* Quick presets */}
                  <div className="pt-4 border-t border-border">
                    <Label className="mb-3 block">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDyslexiaMode(true);
                          setSyllableHighlight(true);
                          setWarmBackground(true);
                          setFocusOverlay(false);
                          setFontSize([22]);
                          setLineSpacing([2]);
                        }}
                      >
                        Dyslexia Support
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDyslexiaMode(false);
                          setSyllableHighlight(false);
                          setWarmBackground(false);
                          setFocusOverlay(true);
                          setFontSize([20]);
                          setLineSpacing([1.8]);
                        }}
                      >
                        Focus Mode
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDyslexiaMode(false);
                          setSyllableHighlight(false);
                          setWarmBackground(false);
                          setFocusOverlay(false);
                          setFontSize([18]);
                          setLineSpacing([1.8]);
                        }}
                      >
                        Reset All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDyslexiaMode(true);
                          setSyllableHighlight(true);
                          setWarmBackground(true);
                          setFocusOverlay(true);
                          setFontSize([24]);
                          setLineSpacing([2.2]);
                        }}
                      >
                        Maximum Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reading Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentText.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Level: {currentText.level}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={prevText}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        {selectedTextIndex + 1} / {sampleTexts.length}
                      </span>
                      <Button variant="outline" size="icon" onClick={nextText}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    style={{
                      fontSize: `${fontSize[0]}px`,
                      lineHeight: lineSpacing[0],
                    }}
                  >
                    <AdaptiveTextDisplay
                      text={currentText.text}
                      dyslexiaMode={dyslexiaMode}
                      syllableHighlight={syllableHighlight}
                      warmBackground={warmBackground}
                      focusOverlay={focusOverlay}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-xl bg-muted/50"
              >
                <h3 className="font-semibold mb-2">Reading Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click on any word to hear it pronounced</li>
                  <li>• Enable syllable highlighting to break down complex words</li>
                  <li>• The warm background can reduce visual stress</li>
                  <li>• Focus overlay dims peripheral content for better concentration</li>
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
