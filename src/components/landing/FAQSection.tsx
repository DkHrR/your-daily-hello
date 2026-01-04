import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is Neuro-Read X Platinum?',
        answer: 'Neuro-Read X Platinum is an AI-powered diagnostic platform that uses multi-modal analysis—including eye tracking, voice analysis, and handwriting recognition—to identify dyslexia and other reading difficulties with 94% accuracy. It\'s designed for educators, clinicians, and researchers.',
      },
      {
        question: 'How accurate is the dyslexia screening?',
        answer: 'Our platform achieves 94% diagnostic accuracy, validated against the ETDD-70 clinical benchmark. We use a combination of webcam-based eye tracking, phonological analysis, and visual processing tests to ensure comprehensive assessment.',
      },
      {
        question: 'Who can use Neuro-Read X?',
        answer: 'Neuro-Read X is designed for special education teachers, school psychologists, clinical psychologists, speech-language pathologists, reading specialists, and parents seeking professional-grade screening tools.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'What equipment do I need?',
        answer: 'You only need a computer with a webcam and microphone. Our technology works with standard hardware—no special eye-tracking devices required. We recommend Chrome or Edge browsers for the best experience.',
      },
      {
        question: 'Is the platform FERPA and HIPAA compliant?',
        answer: 'Yes, Neuro-Read X is fully compliant with FERPA (for educational records) and HIPAA (for health information). All data is encrypted at rest and in transit, and we never share student data with third parties.',
      },
      {
        question: 'Can I export assessment data?',
        answer: 'Absolutely. You can export comprehensive PDF reports for each student, as well as CSV data exports for research purposes. Enterprise customers also have API access for integration with existing systems.',
      },
    ],
  },
  {
    category: 'Pricing',
    questions: [
      {
        question: 'Is there a free trial?',
        answer: 'Yes! All paid plans include a 14-day free trial with full access to all features. No credit card required to start. The free Starter plan is always available for up to 5 students.',
      },
      {
        question: 'Can I change plans later?',
        answer: 'You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, the change takes effect at your next billing cycle.',
      },
      {
        question: 'Do you offer educational discounts?',
        answer: 'Yes, we offer special pricing for schools, districts, and non-profit organizations. Contact our sales team for a custom quote tailored to your needs.',
      },
    ],
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium border-secondary/30 text-secondary">
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-gradient-neuro">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Neuro-Read X Platinum
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-8">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {category.category}
              </h3>
              
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${category.category}-${index}`}
                    className="bg-card rounded-xl border border-border px-6 data-[state=open]:shadow-lg transition-shadow"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <span className="font-medium text-foreground">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@neuroread.com"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Contact our support team →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
