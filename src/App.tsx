import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { Training } from './components/Training';
import { InjectionModeId } from './types';
import { INJECTION_CONFIGS } from './config';

export default function App() {
  const [activeMode, setActiveMode] = useState<InjectionModeId | null>(null);

  return (
    <AnimatePresence mode="wait">
      {activeMode === null ? (
        <Home key="home" onSelectMode={setActiveMode} />
      ) : (
        <Training 
          key="training" 
          config={INJECTION_CONFIGS[activeMode]} 
          onBack={() => setActiveMode(null)} 
        />
      )}
    </AnimatePresence>
  );
}
