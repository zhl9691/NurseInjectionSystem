import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InjectionConfig, MachineStage } from '../types';
import { useSimulator, getStatusInfo, getMetricStatus } from '../simulator';
import { ArrowLeft, Play, RotateCcw, Syringe, Home, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TrainingProps {
  key?: string;
  config: InjectionConfig;
  onBack: () => void;
}

interface IntravenousFlowVisualProps {
  stage: MachineStage;
  flashback: boolean;
  progress: number;
}

interface AngleVisualProps {
  angle: number | null;
  targetAngle: number;
  tolerance: number;
}

function AngleVisual({ angle, targetAngle, tolerance }: AngleVisualProps) {
  const displayAngle = Math.max(0, Math.min(90, angle ?? 0));
  const originX = 20;
  const originY = 108;
  const needleLength = 142;
  const radians = (displayAngle * Math.PI) / 180;
  const tipX = originX + needleLength * Math.cos(radians);
  const tipY = originY - needleLength * Math.sin(radians);

  const getTargetPoint = (target: number) => {
    const targetRadians = (Math.max(0, Math.min(90, target)) * Math.PI) / 180;
    return {
      x: originX + 72 * Math.cos(targetRadians),
      y: originY - 72 * Math.sin(targetRadians),
    };
  };

  const targetStart = getTargetPoint(targetAngle - tolerance);
  const targetEnd = getTargetPoint(targetAngle + tolerance);

  return (
    <div
      role="img"
      aria-label={angle === null ? '等待角度读数' : `当前角度 ${angle.toFixed(2)} 度`}
      className="relative h-24 w-40 shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50/70 sm:h-28 sm:w-52"
    >
      <svg viewBox="0 0 190 120" className="h-full w-full" aria-hidden="true">
        <path d="M 76 108 A 56 56 0 0 0 20 52" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 4" />
        <line x1="20" y1="108" x2="176" y2="108" stroke="#94a3b8" strokeWidth="2" />
        <line x1={originX} y1={originY} x2={targetStart.x} y2={targetStart.y} stroke="#86efac" strokeWidth="2" strokeDasharray="4 4" />
        <line x1={originX} y1={originY} x2={targetEnd.x} y2={targetEnd.y} stroke="#86efac" strokeWidth="2" strokeDasharray="4 4" />
        <motion.line
          x1={originX}
          y1={originY}
          animate={{ x2: tipX, y2: tipY, opacity: angle === null ? 0.25 : 1 }}
          initial={false}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          stroke="#2563eb"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={originX} cy={originY} r="6" fill="#1d4ed8" />
        <circle cx={originX} cy={originY} r="2.5" fill="white" />
        <text x="22" y="118" fill="#64748b" fontSize="9">0°</text>
        <text x="6" y="48" fill="#64748b" fontSize="9">90°</text>
      </svg>
      <div className="absolute right-3 top-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-sm font-bold tabular-nums text-blue-700 shadow-sm">
        {angle === null ? '--°' : `${angle.toFixed(1)}°`}
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] tracking-wider text-slate-500">实时角度示意</div>
    </div>
  );
}

function IntravenousFlowVisual({ stage, flashback, progress }: IntravenousFlowVisualProps) {
  const angleLowered = stage === 'FLASHBACK' || stage === 'ADVANCE' || stage === 'READY';
  const showFlashback = flashback;
  const statusText = stage === 'DEPTH'
    ? '针尖寻找静脉'
    : stage === 'FLASHBACK'
      ? '见到回血，可以继续进针'
      : stage === 'ADVANCE'
        ? '沿静脉推进软导管'
        : stage === 'READY'
          ? '导管推进完成'
          : '准备穿刺';

  return (
    <div
      role="img"
      aria-label="静脉穿刺回血和导管推进示意动画"
      className="relative mt-1 mb-3 h-32 shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-slate-50 to-blue-50/60"
    >
      <div className="absolute left-8 right-8 top-1/2 h-10 -translate-y-1/2 rounded-full border border-red-200 bg-red-50 shadow-inner">
        <motion.div
          className="absolute inset-y-2 left-3 right-3 rounded-full bg-red-500/35"
          animate={{ opacity: showFlashback ? [0.45, 0.8, 0.45] : 0.35 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {showFlashback && (
          <motion.div
            className="absolute inset-y-2 left-3 w-14 rounded-full bg-red-500/60"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 130, opacity: [0, 1, 0.2] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {showFlashback && (
        <motion.div
          className="absolute left-[36%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-400/80"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: `${Math.max(0, Math.min(52, progress - 48))}%`, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      )}

      <motion.div
        className="absolute bottom-1/2 left-[36%] h-28 w-5 origin-bottom"
        animate={{ rotate: angleLowered ? -10 : -22 }}
        transition={{ type: 'spring', stiffness: 130, damping: 18 }}
      >
        <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 rounded-full border border-slate-300 bg-white/75 shadow-sm" />
        <motion.div
          className="absolute bottom-1 left-1/2 w-1 -translate-x-1/2 rounded-full bg-red-600"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: showFlashback ? 48 : 0, opacity: showFlashback ? 1 : 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
        <div className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-500 shadow-sm" />
      </motion.div>

      {stage === 'FLASHBACK' && (
        <motion.div
          className="absolute left-[35.3%] top-[47%] h-3 w-3 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.6, 1.2, 0.8], opacity: [0, 1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <AnimatePresence>
        {stage === 'FLASHBACK' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 px-4 text-center backdrop-blur-[2px]"
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="text-2xl font-black tracking-widest text-red-700"
            >
              见到回血
            </motion.div>
            <div className="mt-1 text-xl font-bold tracking-wider text-slate-900">可以继续进针</div>
            <div className="mt-2 text-xs tracking-wider text-slate-600">降低角度后缓慢推进导管</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-medium tracking-wider text-slate-600">
        {statusText}
      </div>
    </div>
  );
}

export function Training({ config, onBack }: TrainingProps) {
  const { state, startSimulation, resetSimulation } = useSimulator(config);
  const [showSuccess, setShowSuccess] = useState(false);
  const isIntravenous = config.id === 'intravenous';
  
  const statusInfo = getStatusInfo(state.stage, state.angle, state.depth, config);
  const angleStatus = isIntravenous && state.flashback
    ? { color: 'text-blue-700', barColor: 'bg-blue-500' }
    : getMetricStatus(state.angle, config.targetAngle, config.angleTolerance, false);
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
      className={`relative flex min-h-screen flex-col overflow-y-auto bg-slate-100 p-4 text-slate-800 lg:h-screen lg:overflow-hidden ${state.stage === 'IDLE' ? 'cursor-pointer' : ''}`}
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
            className="fixed inset-0 z-50 bg-slate-100/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center max-w-lg w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Syringe className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-widest text-center">恭喜你完成注射</h2>
              <p className="text-slate-600 mb-10 tracking-wider text-center">系统检测到各项指标均符合规范标准</p>
              
              <div className="flex flex-col sm:flex-row w-full gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); onBack(); }}
                  className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-200 hover:bg-slate-300 text-slate-800 tracking-widest"
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

      <header className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors tracking-wider"
        >
          <ArrowLeft className="w-5 h-5" />
          返回首页
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-widest">{config.name} - 监测面板</h1>
        <div className="w-28" /> {/* Spacer for centering */}
      </header>

      <main className="grid w-full max-w-7xl flex-none grid-cols-1 gap-4 mx-auto mt-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        {/* Left Column: Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Angle Panel */}
          <div className="relative flex min-h-[250px] flex-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-1">
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-2 shrink-0">CURRENT ANGLE (当前角度)</h2>
            <div className="mb-4 flex min-h-24 shrink-0 flex-row items-center justify-between gap-2 sm:min-h-28 sm:gap-4">
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-light tabular-nums tracking-tighter sm:text-6xl ${angleStatus.color}`}>
                  {state.angle !== null ? state.angle.toFixed(2) : '--'}
                </span>
                <span className="text-2xl text-slate-500 mb-1 font-sans">°</span>
              </div>
              <AngleVisual
                angle={state.angle}
                targetAngle={config.targetAngle}
                tolerance={config.angleTolerance}
              />
            </div>
            
            {/* Visual Bar for Angle */}
            <div className="mt-auto relative w-full h-8 shrink-0 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
              <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-slate-500 font-sans font-medium z-10 pointer-events-none">
                <span>0°</span>
                <span>90°</span>
              </div>
              {/* Target Zone Marker */}
              <div 
                className="absolute top-0 bottom-0 bg-slate-200 border-x border-slate-300/50"
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
              <span>{isIntravenous && state.flashback ? '回血后：降低角度推进' : isIntravenous ? '参考范围: 15–30°' : config.id === 'subcutaneous' ? '参考范围: 30–40°' : `标准靶区: ${config.targetAngle}° ±${config.angleTolerance}°`}</span>
            </div>
          </div>

          {/* Depth Panel */}
          <div className="relative flex min-h-[220px] flex-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-1">
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-2 shrink-0">
              {isIntravenous ? 'CATHETER PROGRESS (导管推进)' : 'SIMULATED DEPTH (模拟深度)'}
            </h2>
            {isIntravenous && (
              <IntravenousFlowVisual
                stage={state.stage}
                flashback={state.flashback}
                progress={state.progress}
              />
            )}
            <div className="flex items-end gap-3 mb-4 shrink-0">
              <span className={`text-6xl font-light tabular-nums tracking-tighter ${depthStatus.color}`}>
                {isIntravenous ? state.progress : state.depth !== null ? state.depth.toFixed(2) : '--'}
              </span>
              <span className="text-2xl text-slate-500 mb-1 font-sans">{isIntravenous ? '%' : 'mm'}</span>
            </div>
            
            {/* Visual Bar for Depth */}
            <div className="mt-auto relative w-full h-8 shrink-0 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
              <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-slate-500 font-sans font-medium z-10 pointer-events-none">
                {isIntravenous ? <><span>见回血</span><span>推进完成</span></> : <><span>0mm</span><span>40mm</span></>}
              </div>
              {/* Target Zone Marker */}
              {!isIntravenous && config.targetDepth !== null && config.depthTolerance !== null && <div
                className="absolute top-0 bottom-0 bg-slate-200 border-x border-slate-300/50"
                style={{ 
                  left: `${Math.max(0, ((config.targetDepth - config.depthTolerance) / 40) * 100)}%`,
                  width: `${(config.depthTolerance * 2 / 40) * 100}%` 
                }}
              />}
              {isIntravenous ? (
                <motion.div
                  className="absolute top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_12px_currentColor] z-20"
                  style={{ left: `${Math.min(100, state.progress)}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                />
              ) : state.depth !== null && (
                <motion.div 
                  className={`absolute top-0 bottom-0 w-1.5 ${depthStatus.barColor} shadow-[0_0_12px_currentColor] z-20`}
                  style={{ left: `${Math.min(100, (state.depth / 40) * 100)}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                />
              )}
            </div>
            <div className="text-xs text-slate-500 mt-3 flex justify-between tracking-wider shrink-0">
              {isIntravenous ? <><span>{state.flashback ? '状态: 已见回血' : '状态: 等待回血'}</span><span>回血后降低角度推进导管</span></> : <><span>模拟读数: {state.depth !== null ? state.depth.toFixed(2) + 'mm' : '--'}</span><span>模拟参考范围: {config.targetDepth}mm ±{config.depthTolerance}mm</span></>}
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
          <div className="shrink-0 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
            <h2 className="text-slate-500 text-sm tracking-[0.2em] mb-1">CONTROLS</h2>
            <button
              onClick={(e) => { e.stopPropagation(); resetSimulation(); }}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-200 hover:bg-slate-300 text-slate-700 tracking-widest"
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
