import { motion } from 'framer-motion';
import { Check, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export function PricingSection() {
  const features = [
    'Unlimited assessments',
    'Eye tracking analysis',
    'Voice analysis',
    'Handwriting analysis (optional)',
    'AI-powered insights',
    'PDF report generation',
    'Assessment history',
    'Regional language support',
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-hero">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium border-primary/30 text-primary">
            Early Access Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Free During <span className="text-gradient-neuro">Beta</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're currently in early access. Enjoy full platform access at no cost 
            while we refine and improve based on your feedback.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative rounded-2xl bg-gradient-neuro text-white shadow-2xl p-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-white text-primary font-semibold px-4 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Beta Access
              </Badge>
            </div>

            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl font-bold mb-2">Full Platform Access</h3>
              <p className="text-white/80 text-sm">
                Everything included, no limitations
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">₹0</span>
                <span className="text-white/70 line-through">₹999/mo</span>
              </div>
              <p className="text-center text-white/60 text-sm mt-2">
                Free while in early access
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />
                  <span className="text-white/90 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth">
              <Button
                className="w-full bg-white text-primary hover:bg-white/90"
                size="lg"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Have questions about enterprise or school-wide licensing?
          </p>
          <a href="mailto:noreply.nueroread@gmail.com">
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Contact Our Team
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
