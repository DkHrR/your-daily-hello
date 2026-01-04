import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "Neuro-Read X has transformed how we identify students with reading difficulties. The eye-tracking technology caught issues we missed for years.",
    author: "Dr. Sarah Mitchell",
    role: "Special Education Director",
    organization: "Lincoln Elementary School District",
    avatar: null,
    rating: 5,
  },
  {
    quote: "As a dyslexia specialist, I've used many tools. This platform's multi-modal approach gives me confidence in my assessments like never before.",
    author: "James Chen, Ph.D.",
    role: "Clinical Psychologist",
    organization: "Bay Area Learning Center",
    avatar: null,
    rating: 5,
  },
  {
    quote: "The AI-powered reports save me hours each week. Parents love the clear visualizations and actionable recommendations.",
    author: "Maria Rodriguez",
    role: "Reading Intervention Specialist",
    organization: "Austin Independent Schools",
    avatar: null,
    rating: 5,
  },
  {
    quote: "We reduced our screening time by 60% while improving accuracy. The ROI is incredible for our district.",
    author: "Dr. Michael Thompson",
    role: "Superintendent",
    organization: "Riverside Unified School District",
    avatar: null,
    rating: 5,
  },
  {
    quote: "The handwriting analysis feature identified my son's dysgraphia in minutes. Finally, we got the support he needed.",
    author: "Jennifer Park",
    role: "Parent",
    organization: "Portland, OR",
    avatar: null,
    rating: 5,
  },
  {
    quote: "Research-grade accuracy in a user-friendly package. This is what educational technology should look like.",
    author: "Prof. David Williams",
    role: "Education Technology Researcher",
    organization: "Stanford University",
    avatar: null,
    rating: 5,
  },
];

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
            Trusted Worldwide
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            What Our <span className="text-gradient-neuro">Users Say</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of educators, clinicians, and parents who trust Neuro-Read X 
            for accurate dyslexia screening and intervention.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-background rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={testimonial.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-primary">{testimonial.organization}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: '50K+', label: 'Students Assessed' },
            { value: '2,500+', label: 'Schools Using' },
            { value: '94%', label: 'Accuracy Rate' },
            { value: '4.9/5', label: 'User Rating' },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-neuro mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
