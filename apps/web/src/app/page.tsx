import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { TemporalAvailabilitySection } from '../components/landing/TemporalAvailabilitySection';
import { SafeConfirmationSection } from '../components/landing/SafeConfirmationSection';
import { WhyItMattersSection } from '../components/landing/WhyItMattersSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { WarehouseWorkflowSection } from '../components/landing/WarehouseWorkflowSection';
import { AuditSection } from '../components/landing/AuditSection';
import { BuiltForOperationsSection } from '../components/landing/BuiltForOperationsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';

import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <TemporalAvailabilitySection />
        <SafeConfirmationSection />
        <WhyItMattersSection />
        <HowItWorksSection />
        <WarehouseWorkflowSection />
        <AuditSection />
        <BuiltForOperationsSection />
        <FeaturesSection />

        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
