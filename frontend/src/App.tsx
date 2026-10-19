import { Callback } from './components/Callback';
import { CallFab } from './components/CallFab';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { ScrollProgress } from './components/ScrollProgress';
import { Services } from './components/Services';
import { Strip } from './components/Strip';
import { WaveDivider } from './components/WaveDivider';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#content">
        Перейти к содержимому
      </a>
      <ScrollProgress />
      <Header />
      <main id="content" tabIndex={-1}>
        <Hero />
        <Strip />
        <Services />
        <HowItWorks />
        <Faq />
        <WaveDivider />
        <Callback />
      </main>
      <Footer />
      <CallFab />
    </>
  );
}
