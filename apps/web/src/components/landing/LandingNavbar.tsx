import Link from 'next/link';

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-text">
          TemporalRent
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
          <Link href="#product" className="hover:text-text transition-colors">
            Product
          </Link>
          <Link href="#how-it-works" className="hover:text-text transition-colors">
            How it works
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Link 
          href="/login" 
          className="text-sm font-medium text-text-muted hover:text-text transition-colors"
        >
          Sign in
        </Link>
        <Link 
          href="/login" 
          className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primaryHover transition-colors"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
