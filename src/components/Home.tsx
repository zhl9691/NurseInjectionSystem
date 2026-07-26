import { useState } from 'react';
import { motion } from 'motion/react';
import { INJECTION_CONFIGS } from '../config';
import { InjectionModeId } from '../types';
import { Activity } from 'lucide-react';

interface HomeProps {
  key?: string;
  onSelectMode: (mode: InjectionModeId) => void;
}

export function Home({ onSelectMode }: HomeProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen overflow-hidden bg-[#050B14] text-slate-200 flex flex-col items-center justify-center p-4"
    >
      <div className="max-w-4xl w-full">
        <div className="flex flex-col items-center gap-4 mb-10 justify-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl border border-blue-500/30 flex items-center justify-center overflow-hidden p-2">
            {!imgError ? (
              <img 
                src="/logo.png" 
                alt="系统图标" 
                className="w-full h-full object-contain drop-shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <Activity className="w-10 h-10 text-blue-500" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-widest text-white text-center">药物注射教学训练系统</h1>
          <p className="text-slate-500 tracking-wider">MEDICATION INJECTION TRAINING SYSTEM</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(INJECTION_CONFIGS) as InjectionModeId[]).map((modeId) => {
            const config = INJECTION_CONFIGS[modeId];
            return (
              <button
                key={modeId}
                onClick={() => onSelectMode(modeId)}
                className="group relative flex flex-col items-center p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <h2 className="text-xl font-bold tracking-widest text-slate-100 mb-2">{config.name}</h2>
                <div className="flex gap-4 text-slate-400 text-xs mt-3">
                  <span className="bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 tracking-wider">
                    角度: {config.targetAngle}°
                  </span>
                  <span className="bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 tracking-wider">
                    深度: {config.targetDepth}mm
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
