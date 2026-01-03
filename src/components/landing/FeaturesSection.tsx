import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Sparkles, 
  Type, 
  Palette, 
  Volume2, 
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Settings2,
  Layers
} from 'lucide-react';

const interventionFeatures = [
  {
    icon: Type,
    title: 'OpenDyslexic Font',
    description: 'Automatically switch to dyslexia-friendly typography with weighted bottoms to prevent letter rotation.',
  },
  {
    icon: Sparkles,
    title: 'Syllable Highlighting',
    description: 'Akshar Mitra-style syllable-level highlighting helps decode complex words progressively.',
  },
  {
    icon: Palette,
    title: 'Irlen Syndrome Support',
    description: 'Warm yellow background overlay reduces visual stress and improves reading comfort.',
  },
  {
    icon: Volume2,
    title: 'Gaze-Triggered Tutor',
    description: 'AI whispers phonetics when a student fixates on a word for >2 seconds.',
  },
  {
    icon: BookOpen,
    title: 'Focus Overlays',
    description: 'Reading rulers and line isolation tools minimize visual distractions.',
  },
  {
    icon: Settings2,
    title: 'Zen Mode',
    description: 'Distraction-free reading interface optimized for focus and comprehension.',
  },
];

const dashboardFeatures = [
  {
    icon: FileText,
    title: 'Clinical Reports',
    description: 'Generate medical-grade PDF reports with gaze heatmaps, fixation graphs, and saccade charts.',
  },
  {
    icon: Users,
    title: 'School-Wide Analytics',
    description: "Principal's dashboard to view risk profiles across 1,000+ students simultaneously.",
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Longitudinal analysis shows intervention effectiveness over time.',
  },
  {
    icon: Layers,
    title: 'Cohort Comparison',
    description: 'Benchmark student performance against grade-level norms and historical data.',
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24">
      <div className="container">
        {/* Adaptive Interventions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Adaptive Intervention System</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Dynamic UI <span className="text-gradient-neuro">Morphing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              When risk is detected, the interface automatically adapts to provide
              optimal support for the student's specific needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interventionFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enterprise Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Enterprise Dashboard</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Clinician & <span className="text-gradient-neuro">Admin Tools</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive reporting and analytics for educators, clinicians,
              and school administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {dashboardFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border hover:border-secondary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
