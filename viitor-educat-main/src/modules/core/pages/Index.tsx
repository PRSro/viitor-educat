import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ProgramsSection } from "@/components/ProgramsSection";
import { AdmissionsSection } from "@/components/AdmissionsSection";
import { StudentLifeSection } from "@/components/StudentLifeSection";
import { NewsSection } from "@/components/NewsSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // Small delay to let the page render first
      setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash]);

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <ProgramsSection />
      <AdmissionsSection />
      <StudentLifeSection />
      <NewsSection />
      <Footer />
    </main>
  );
};

export default Index;
