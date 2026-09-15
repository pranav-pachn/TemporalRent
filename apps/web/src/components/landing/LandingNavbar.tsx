'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border ${
      scrolled ? 'bg-background/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-background/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-text font-mono">
            TemporalRent
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link href="#problem" className="hover:text-text transition-colors">
              Problem
            </Link>
            <Link href="#how-it-works" className="hover:text-text transition-colors">
              How it works
            </Link>
            <Link href="#operations" className="hover:text-text transition-colors">
              Operations
            </Link>
            <Link href="#audit" className="hover:text-text transition-colors">
              Audit
            </Link>
          </div>
        </div>
        
        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Sign in
          </Link>
          <Link 
            href="/signup" 
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primaryHover transition-colors font-semibold"
          >
            Get started &rarr;
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <Link 
            href="/login" 
            className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md"
          >
            Sign in
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-muted hover:text-text rounded-md hover:bg-surface border border-border"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border px-6 py-5 space-y-4">
          <div className="flex flex-col space-y-3 font-medium text-sm text-text-muted">
            <Link 
              href="#problem" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-text transition-colors"
            >
              Problem
            </Link>
            <Link 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-text transition-colors"
            >
              How it works
            </Link>
            <Link 
              href="#operations" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-text transition-colors"
            >
              Operations
            </Link>
            <Link 
              href="#audit" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-text transition-colors"
            >
              Audit
            </Link>
          </div>
          <div className="pt-4 border-t border-border flex flex-col gap-2">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-surfaceHover"
            >
              Sign in
            </Link>
            <Link 
              href="/signup" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primaryHover"
            >
              Get started &rarr;
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

