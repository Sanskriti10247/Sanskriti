import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import {
  About,
  Contact,
  Experience,
  Hero,
  Recognition,
  Ribbon,
  Toolkit,
  Work,
} from '@/components/sections';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

export default function App() {
  useRevealOnScroll();

  return (
    <div id="top">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Ribbon />
        <Work />
        <About />
        <Experience />
        <Toolkit />
        <Recognition />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
