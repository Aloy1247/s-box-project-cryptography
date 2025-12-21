import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MainLayout } from './components/layout/MainLayout';
import { HelpModal } from './components/layout/HelpModal';
import { SelectionSidebar } from './components/selection/SelectionSidebar';
import { ConstructionWorkspace } from './components/workspace/ConstructionWorkspace';
import { AnalysisSidebar } from './components/analysis/AnalysisSidebar';
import { AESPage } from './components/aes/AESPage';
import { ImageEncryptionPage } from './components/stego/ImageEncryptionPage';
import { AboutPage } from './components/about/AboutPage';
import { InteractiveBackground } from './components/layout/InteractiveBackground';
import { useAppStore } from './store/useAppStore';
import { useEffect } from 'react';

function App() {
  const { currentPage } = useAppStore();

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'sbox-research':
        return (
          <MainLayout
            leftSidebar={<SelectionSidebar />}
            center={<ConstructionWorkspace />}
            rightSidebar={<AnalysisSidebar />}
          />
        );
      case 'aes-encrypt':
        return <AESPage />;
      case 'steganography':
        return <ImageEncryptionPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <AESPage />;
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden relative selection:bg-blue-500/30">
      <InteractiveBackground />

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* Main Content Area - Fills screen, pages handle their own padding/scrolling */}
      <div className="absolute inset-0 z-10">
        {renderPage()}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Footer />
      </div>

      <HelpModal />
    </div>
  );
}

export default App;
