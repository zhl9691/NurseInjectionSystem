import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InjectionConfig } from '../types';
import { useSimulator, getStatusInfo, getMetricStatus } from '../simulator';
import { ArrowLeft, Play, RotateCcw, Syringe, Home, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TrainingProps {
  key?: string;
  config: InjectionConfig;
  onBack: () => void;
}

export function Training({ config, onBack }: TrainingProps) {
  const { state, startSimulation, resetSimulation } = useSimulator(config);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const statusInfo = getStatusInfo(state.stage, state.angle, state.depth, config);
  const angleStatus = getMetricStatus(state.angle, config.targetAngle, config.angleTolerance, false);
  const depthStatus = getMetricStatus(state.depth, config.targetDepth, config.depthTolerance, true);

  const handleInject = useCallback(() => {
    setShowSuccess(true);
    
    // Firework animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#3b82f6', '#eab308']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#3b82f6', '#eab308']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleRetry = useCallback(() => {
    setShowSuccess(false);
    resetSimulation();
  }, [resetSimulation]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-screen overflow-hidden bg-[#050B14] text-slate-200 flex flex-col p-4 relative ${state.stage === 'IDLE' ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (state.stage === 'IDLE' && !showSuccess) {
          startSimulation();
        }
      }}
    >
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050B14]/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center max-w-lg w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Syringe className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-widest text-center">恭喜你完成注射</h2>
              <p className="text-slate-400 mb-10 tracking-wider text-center">系统检测到各项指标均符合规范标准</p>
              
              <div className="flex flex-col sm:flex-row w-full gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); onBack(); }}
                  className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-800 hover:bg-slate-700 text-white tracking-widest"
                >
                  <Home className="w-5 h-5" />
                  回到主页面
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                  className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-blue-600 hover:bg-blue-500 text-white tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <RotateCw className="w-5 h-5" />
                  再试一次
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors tracking-wider"
        >
          <ArrowLeft className="w-5 h-5" />
          返回首页
        </button>
        <h1 className="text-xl font-bold text-white tracking-widest">{config.name} - 监测面板</h1>
        <div className="w-28" /> {/* Spacer for centering */}
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full mt-2 min-h-0">
        {/* Left Column: Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Angle Panel */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden min-h-[220px]">
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-2 shrink-0">CURRENT ANGLE (当前角度)</h2>
            <div className="flex items-end gap-3 mb-4 shrink-0">
              <span className={`text-6xl font-light tabular-nums tracking-tighter ${angleStatus.color}`}>
                {state.angle !== null ? state.angle.toFixed(2) : '--'}
              </span>
              <span className="text-2xl text-slate-600 mb-1 font-sans">°</span>
            </div>
            
            {/* Visual Bar for Angle */}
            <div className="mt-auto relative w-full h-8 shrink-0 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
              <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-slate-600 font-sans font-medium z-10 pointer-events-none">
                <span>0°</span>
                <span>90°</span>
              </div>
              {/* Target Zone Marker */}
              <div 
                className="absolute top-0 bottom-0 bg-slate-800 border-x border-slate-600/50"
                style={{ 
                  left: `${Math.max(0, ((config.targetAngle - config.angleTolerance) / 90) * 100)}%`,
                  width: `${(config.angleTolerance * 2 / 90) * 100}%` 
                }}
              />
              {state.angle !== null && (
                <motion.div 
                  className={`absolute top-0 bottom-0 w-1.5 ${angleStatus.barColor} shadow-[0_0_12px_currentColor] z-20`}
                  style={{ left: `${Math.min(100, (state.angle / 90) * 100)}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                />
              )}
            </div>
            <div className="text-xs text-slate-500 mt-3 flex justify-between tracking-wider shrink-0">
              <span>实时读数: {state.angle !== null ? state.angle.toFixed(2) + '°' : '--'}</span>
              <span>标准靶区: {config.targetAngle}° ±{config.angleTolerance}°</span>
            </div>
          </div>

          {/* Depth Panel */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden min-h-[220px]">
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-2 shrink-0">CURRENT DEPTH (当前深度)</h2>
            <div className="flex items-end gap-3 mb-4 shrink-0">
              <span className={`text-6xl font-light tabular-nums tracking-tighter ${depthStatus.color}`}>
                {state.depth !== null ? state.depth.toFixed(2) : '--'}
              </span>
              <span className="text-2xl text-slate-600 mb-1 font-sans">mm</span>
            </div>
            
            {/* Visual Bar for Depth */}
            <div className="mt-auto relative w-full h-8 shrink-0 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
              <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-slate-600 font-sans font-medium z-10 pointer-events-none">
                <span>0mm</span>
                <span>40mm</span>
              </div>
              {/* Target Zone Marker */}
              <div 
                className="absolute top-0 bottom-0 bg-slate-800 border-x border-slate-600/50"
                style={{ 
                  left: `${Math.max(0, ((config.targetDepth - config.depthTolerance) / 40) * 100)}%`,
                  width: `${(config.depthTolerance * 2 / 40) * 100}%` 
                }}
              />
              {state.depth !== null && (
                <motion.div 
                  className={`absolute top-0 bottom-0 w-1.5 ${depthStatus.barColor} shadow-[0_0_12px_currentColor] z-20`}
                  style={{ left: `${Math.min(100, (state.depth / 40) * 100)}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                />
              )}
            </div>
            <div className="text-xs text-slate-500 mt-3 flex justify-between tracking-wider shrink-0">
              <span>实时读数: {state.depth !== null ? state.depth.toFixed(2) + 'mm' : '--'}</span>
              <span>标准靶区: {config.targetDepth}mm ±{config.depthTolerance}mm</span>
            </div>
          </div>
        </div>

        {/* Right Column: Status and Controls */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Main Status Panel */}
          <div className={`flex-1 border rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-colors duration-500 ${statusInfo.bg} ${statusInfo.border}`}>
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-4 w-full text-left self-start shrink-0">SYSTEM STATUS</h2>
            <motion.div
              key={statusInfo.text}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-bold whitespace-pre-line leading-relaxed tracking-widest ${statusInfo.color}`}
            >
              {statusInfo.text}
            </motion.div>
          </div>

          {/* Controls */}
          <div className="shrink-0 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-1">CONTROLS</h2>
            <button
              onClick={(e) => { e.stopPropagation(); resetSimulation(); }}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-300 tracking-widest"
            >
              <RotateCcw className="w-5 h-5" />
              重置系统
            </button>
            
            {/* Ready state injection button */}
            {statusInfo.isReady && (
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleInject(); }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] tracking-widest"
              >
                <Syringe className="w-5 h-5" />
                执行注射
              </motion.button>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
}
