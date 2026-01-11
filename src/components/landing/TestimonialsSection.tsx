import { motion } from 'framer-motion';
import { Sparkles, Users, Shield, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-card">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium border-accent/30 text-accent">
            Early Access
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Be Part of Our <span className="text-gradient-neuro">Journey</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Neuro-Read X is currently in early access. Join educators, clinicians, and parents 
            who are pioneering the future of learning difference detection.
          </p>
        </motion.div>

        {/* Early Access Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {[
            {
              icon: Users,
              title: 'Growing Community',
              description: 'Join early adopters shaping the platform with their feedback'
            },
            {
              icon: Shield,
              title: 'Free During Beta',
              description: 'Full access to all features at no cost while we refine the experience'
            },
            {
              icon: Award,
              title: 'Research-Backed',
              description: 'Built on validated research methodologies and clinical standards'
            }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-background rounded-2xl p-6 shadow-lg border border-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Limited Early Access Spots Available
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button variant="hero" size="lg">
                Join Early Access
              </Button>
            </Link>
            <Link to="/assessment">
              <Button variant="outline" size="lg">
                Try Demo Assessment
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
