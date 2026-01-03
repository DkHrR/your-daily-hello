import { HeroSection } from '@/components/landing/HeroSection';
import { ScienceSection } from '@/components/landing/ScienceSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { CTASection } from '@/components/landing/CTASection';
import { LiveCounter } from '@/components/landing/LiveCounter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <div className="container py-8">
          <LiveCounter className="max-w-xl mx-auto" />
        </div>
        <ScienceSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
      <p className="text-center text-xs text-muted-foreground py-4 border-t">
        Inspired by the research standards of IIT Madras and global clinical benchmarks
      </p>
    </div>
  );
};

export default Index;
