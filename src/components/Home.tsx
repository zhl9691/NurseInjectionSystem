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
      className="h-screen overflow-hidden bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-6 md:p-8"
    >
      <div className="max-w-6xl w-full">
        <div className="flex flex-col items-center gap-5 mb-10 md:mb-12 justify-center">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-blue-50 rounded-3xl border border-blue-200 flex items-center justify-center overflow-hidden p-3 shadow-sm">
            {!imgError ? (
              <img 
                src="/logo.png" 
                alt="系统图标" 
                className="w-full h-full object-contain drop-shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <Activity className="w-12 h-12 md:w-14 md:h-14 text-blue-600" />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-slate-900 text-center">药物注射教学训练系统</h1>
          <p className="text-sm md:text-base text-slate-500 tracking-[0.18em]">MEDICATION INJECTION TRAINING SYSTEM</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {(Object.keys(INJECTION_CONFIGS) as InjectionModeId[]).map((modeId) => {
            const config = INJECTION_CONFIGS[modeId];
            return (
              <button
                key={modeId}
                onClick={() => onSelectMode(modeId)}
                className="group relative flex min-h-[150px] md:min-h-[170px] flex-col items-center justify-center p-8 md:p-10 bg-white border border-slate-200 rounded-3xl shadow-md hover:border-blue-300 hover:bg-blue-50/60 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
                <h2 className="relative text-2xl md:text-3xl font-bold tracking-widest text-slate-800 mb-3">{config.name}</h2>
                <div className="relative flex flex-wrap justify-center gap-4 md:gap-5 text-slate-600 text-sm md:text-base mt-3">
                  <span className="bg-slate-100 px-5 py-2 md:px-6 md:py-2.5 rounded-full border border-slate-200 tracking-wider">
                    角度: {modeId === 'intravenous' ? '15–30°' : modeId === 'subcutaneous' ? '30–40°' : `${config.targetAngle}°`}
                  </span>
                  <span className="bg-slate-100 px-5 py-2 md:px-6 md:py-2.5 rounded-full border border-slate-200 tracking-wider">
                    {modeId === 'subcutaneous' ? '模拟深度: 12mm' : modeId === 'intravenous' ? '见回血后推进导管' : `深度: ${config.targetDepth}mm`}
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
