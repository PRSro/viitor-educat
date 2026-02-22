import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ProgramsSection } from "@/components/ProgramsSection";
import { AdmissionsSection } from "@/components/AdmissionsSection";
import { StudentLifeSection } from "@/components/StudentLifeSection";
import { NewsSection } from "@/components/NewsSection";
import { Footer } from "@/components/Footer";

const Index = () => {
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
