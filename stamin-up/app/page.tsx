import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturedServicesSection from "@/components/home/FeaturedServicesSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
      <FeaturedServicesSection />
    </main>
  );
}
