// Grade-appropriate reading passages for clinical assessment
// Each passage is 150-200 words for proper eye tracking and voice analysis

export interface ReadingPassage {
  id: string;
  grade: string;
  title: string;
  text: string;
  wordCount: number;
  difficulty: 'easy' | 'medium' | 'advanced';
}

export const readingPassages: ReadingPassage[] = [
  // Kindergarten - 1st Grade (Easy)
  {
    id: 'passage-k-1',
    grade: 'K-1',
    title: 'The Little Red Bird',
    text: `Once upon a time, there was a little red bird. The bird lived in a big tree near a pond. Every morning, the bird would sing a happy song. The song was so pretty that all the animals would stop to listen.

One day, the bird saw a small rabbit sitting alone. The rabbit looked sad. The kind bird flew down and asked, "Why are you sad?" The rabbit said, "I lost my way home."

The bird wanted to help. It flew up high into the sky and looked around. Soon, it found the rabbit's home near the big hill. The bird showed the rabbit the way. The rabbit was so happy! From that day on, the bird and the rabbit became the best of friends. They would play together every day by the pond.`,
    wordCount: 150,
    difficulty: 'easy',
  },

  // 2nd - 3rd Grade (Medium)
  {
    id: 'passage-2-3',
    grade: '2-3',
    title: 'The Magic Garden',
    text: `Maya discovered something extraordinary in her grandmother's backyard. Hidden behind the old wooden fence was a garden unlike any she had ever seen. The flowers there seemed to glow with soft, colorful light, and tiny butterflies with silver wings danced through the air.

Her grandmother smiled when Maya told her about the discovery. "That garden has been in our family for generations," she explained. "It's a special place where nature shows its true magic."

Maya began visiting the garden every afternoon. She learned to care for the unusual plants and even started keeping a journal about all the creatures she observed. The hummingbirds seemed to recognize her, and the flowers would turn their petals toward her when she approached.

By the end of summer, Maya understood something important. The magic wasn't just in the garden itself. It was in taking the time to notice the wonderful things that exist all around us. Sometimes the most amazing discoveries are waiting right in our own backyards.`,
    wordCount: 175,
    difficulty: 'medium',
  },

  // 4th - 5th Grade (Advanced)
  {
    id: 'passage-4-5',
    grade: '4-5',
    title: 'The Ocean Explorer',
    text: `Dr. Priya Sharma adjusted her diving equipment as the research submarine descended into the unexplored depths of the Indian Ocean. As a marine biologist from Chennai, she had spent fifteen years studying ocean ecosystems, but nothing had prepared her for what awaited below.

The submarine's lights illuminated a spectacular underwater canyon stretching for kilometers. Bioluminescent creatures of every imaginable color pulsed and glowed in the darkness, creating a mesmerizing display that resembled stars scattered across the night sky.

What fascinated Dr. Sharma most were the unique species that had adapted to survive in this extreme environment. Without sunlight, these organisms had developed extraordinary characteristics. Some produced their own light through chemical reactions, while others had evolved sensitive organs to detect the slightest movements in the water.

Her team documented seventeen previously unknown species during the expedition. Each discovery represented not just scientific achievement, but also a reminder of how much remains undiscovered on our own planet. The ocean, covering over seventy percent of Earth's surface, still holds countless mysteries waiting to be revealed by curious explorers willing to venture into the unknown.`,
    wordCount: 190,
    difficulty: 'advanced',
  },
];

// Get passage by grade level
export function getPassageForGrade(grade: string): ReadingPassage {
  const gradeLevel = grade.toLowerCase();
  
  if (gradeLevel === 'k' || gradeLevel === 'kindergarten' || gradeLevel === '1st') {
    return readingPassages[0];
  } else if (gradeLevel === '2nd' || gradeLevel === '3rd') {
    return readingPassages[1];
  } else {
    return readingPassages[2];
  }
}

// Get all passages
export function getAllPassages(): ReadingPassage[] {
  return readingPassages;
}
