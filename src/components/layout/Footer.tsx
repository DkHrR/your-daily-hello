import { Link } from 'react-router-dom';
import { Brain, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-neuro flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">
                <span className="text-gradient-neuro">Neuro-Read</span>
                <span className="text-muted-foreground text-sm ml-1">X Platinum</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              The world's most comprehensive AI diagnostic ecosystem for
              learning differences. Empowering educators and clinicians to
              identify and support every student.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Made with <Heart className="w-4 h-4 text-destructive" /> for learners everywhere
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/assessment" className="hover:text-foreground transition-colors">Assessment</Link></li>
              <li><Link to="/reading" className="hover:text-foreground transition-colors">Reading Lab</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Research</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Neuro-Read X Platinum. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
