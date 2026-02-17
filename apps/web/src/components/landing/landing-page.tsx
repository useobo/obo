import { LandingNav } from "./navigation/landing-nav";
import { HeroSection } from "./sections/hero-section";
import { ProblemSolutionSection } from "./sections/problem-solution";
import { HowItWorksSection } from "./sections/how-it-works";
import { FeaturesGridSection } from "./sections/features-grid";
import { ComparisonSection } from "./sections/comparison-section";
import { GettingStartedSection } from "./sections/getting-started";
import { Footer } from "./sections/footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <FeaturesGridSection />
        <ComparisonSection />
        <GettingStartedSection />
      </main>
      <Footer />
    </div>
  );
}
