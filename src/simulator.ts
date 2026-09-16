import { useState, useEffect, useCallback, useRef } from 'react';
import { InjectionConfig, MachineStage } from './types';

function updateAngle(currentAngle: number, config: InjectionConfig) {
  const correctionRate = config.angleCorrectionRate ?? 0.3;
  const jitter = config.angleJitter ?? 0.5;
  const diff = config.targetAngle - currentAngle;
  const noise = (Math.random() - 0.5) * jitter;

  if (Math.abs(diff) > config.angleTolerance) {
    return Math.min(90, Math.max(0, currentAngle + diff * correctionRate + noise));
  }

  // 达到容差范围后，只保留轻微手部抖动，不再大幅摆动。
  return config.targetAngle + (Math.random() - 0.5) * jitter;
}

export interface SimulationState {
  stage: MachineStage;
  angle: number | null;
  depth: number | null;
  progress: number;
  flashback: boolean;
  overshootTarget: boolean;
  stableTime: number;
}

export function useSimulator(config: InjectionConfig | null) {
  const [state, setState] = useState<SimulationState>({
    stage: 'IDLE',
    angle: null,
    depth: null,
    progress: 0,
    flashback: false,
    overshootTarget: false,
    stableTime: 0,
  });

  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<SimulationState>(state);
  stateRef.current = state;

  const startSimulation = useCallback(() => {
    setState({
      stage: 'CONTACT',
      angle: null,
      depth: null,
      progress: 0,
      flashback: false,
      overshootTarget: config?.isShallow || false,
      stableTime: 0,
    });
  }, [config]);

  const resetSimulation = useCallback(() => {
    setState({
      stage: 'IDLE',
      angle: null,
      depth: null,
      progress: 0,
      flashback: false,
      overshootTarget: false,
      stableTime: 0,
    });
  }, []);

  useEffect(() => {
    if (!config) return;
    if (state.stage === 'IDLE') return;

    const TICK_MS = 100; // 刷新频率 ~100ms
    
    timerRef.current = window.setInterval(() => {
      const current = stateRef.current;
      let nextStage = current.stage;
      let nextAngle = current.angle;
      let nextDepth = current.depth;
      let nextProgress = current.progress;
      let nextFlashback = current.flashback;
      let nextOvershoot = current.overshootTarget;
      let nextStableTime = current.stableTime;
      const isIntravenous = config.id === 'intravenous';
      const targetDepth = config.targetDepth;
      const depthTolerance = config.depthTolerance;

      if (current.stage === 'CONTACT') {
        nextStableTime += TICK_MS;
        if (nextStableTime >= (isIntravenous ? 1000 : 400)) {
          nextStage = 'ANGLE';
          nextStableTime = 0;
          // 初始角度偏离目标值，模拟初始姿势不准确
          const initialOffset = config.initialAngleOffset ?? (config.angleTolerance + 4);
          const startOffset = Math.random() > 0.5 ? initialOffset : -initialOffset;
          nextAngle = Math.max(0, config.targetAngle + startOffset);
        }
      } else if (current.stage === 'ANGLE') {
        nextStableTime += TICK_MS;
        if (nextAngle !== null) {
          nextAngle = updateAngle(nextAngle, config);
        }
        
        // 角度变化领先深度约0.5秒
        if (nextStableTime >= (isIntravenous ? 1500 : 500)) {
          nextStage = 'DEPTH';
          nextStableTime = 0;
          nextDepth = isIntravenous ? null : 0;
          nextProgress = 0;
        }
      } else if (isIntravenous && current.stage === 'DEPTH') {
        // 静脉穿刺不以固定毫米数判定，而是先寻找回血。
        nextStableTime += TICK_MS;
        if (nextAngle !== null) {
          nextAngle = updateAngle(nextAngle, config);
        }
        nextProgress = Math.min(45, current.progress + 2 + Math.random());

        if (nextStableTime >= 2200) {
          nextStage = 'FLASHBACK';
          nextStableTime = 0;
          nextFlashback = true;
          nextProgress = 50;
        }
      } else if (isIntravenous && current.stage === 'FLASHBACK') {
        // 见回血后先降低针身角度，再进入导管推进阶段。
        nextStableTime += TICK_MS;
        if (nextAngle !== null) {
          const loweredAngle = 12;
          nextAngle = nextAngle + (loweredAngle - nextAngle) * 0.35 + (Math.random() - 0.5) * 0.3;
        }
        nextProgress = Math.max(current.progress, 50);

        if (nextStableTime >= 4000) {
          nextStage = 'ADVANCE';
          nextStableTime = 0;
        }
      } else if (isIntravenous && current.stage === 'ADVANCE') {
        // 角度降低后推进软导管；完成条件是推进流程，而非固定深度。
        nextStableTime += TICK_MS;
        if (nextAngle !== null) {
          const loweredAngle = 12;
          nextAngle = loweredAngle + (Math.random() - 0.5) * 0.3;
        }
        nextProgress = Math.min(100, current.progress + 2.5 + Math.random() * 1.5);

        if (nextStableTime >= 2200) {
          nextStage = 'READY';
          nextStableTime = 0;
          nextProgress = 100;
        }
      } else if (isIntravenous && current.stage === 'READY') {
        nextProgress = 100;
        if (nextAngle !== null) {
          nextAngle = 12 + (Math.random() - 0.5) * 0.3;
        }
      } else if (current.stage === 'DEPTH' || current.stage === 'READY') {
        if (targetDepth === null || depthTolerance === null) {
          return;
        }

        if (nextAngle !== null) {
          nextAngle = updateAngle(nextAngle, config);
        }

        if (nextDepth !== null) {
          if (current.stage === 'READY') {
            nextDepth = config.targetDepth + (Math.random() - 0.5) * 0.05;
          } else {
            // 如果是浅层注射且开启了过冲逻辑，目标会暂时更深
            const actualTargetDepth = nextOvershoot 
              ? targetDepth + depthTolerance + (config.isShallow ? 2.5 : 0)
              : targetDepth;
              
            const depthDiff = actualTargetDepth - nextDepth;
            // 非线性增加：距离越远速度越快，靠近目标时减速，模拟推进阻力
            if (Math.abs(depthDiff) > depthTolerance) {
              nextDepth += depthDiff * 0.12 + (Math.random() - 0.5) * 0.2;
            } else {
              nextDepth += depthDiff * 0.2 + (Math.random() - 0.5) * 0.05;
            }

            // 如果当前深度超过了误差范围，取消过冲目标，模拟操作者发现过深后"回撤"的动作
            if (nextOvershoot && nextDepth > targetDepth + depthTolerance + 0.5) {
              nextOvershoot = false; 
            }
          }
        }

        if (current.stage === 'DEPTH') {
          const angleOk = nextAngle !== null && Math.abs(nextAngle - config.targetAngle) <= config.angleTolerance;
          const depthOk = nextDepth !== null && Math.abs(nextDepth - targetDepth) <= depthTolerance;

          // 角度正常 AND 深度正常
          if (angleOk && depthOk && !nextOvershoot) {
            nextStableTime += TICK_MS;
            // 维持稳定状态一段时间后，进入最终可注射状态
            if (nextStableTime >= 600) {
              nextStage = 'READY';
            }
          } else {
            nextStableTime = 0;
          }
        }
      }

      setState({
        stage: nextStage,
        angle: nextAngle !== null ? Number(nextAngle.toFixed(2)) : null,
        depth: nextDepth !== null ? Number(nextDepth.toFixed(2)) : null,
        progress: Number(nextProgress.toFixed(0)),
        flashback: nextFlashback,
        overshootTarget: nextOvershoot,
        stableTime: nextStableTime,
      });

    }, TICK_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [config, state.stage]);

  return { state, startSimulation, resetSimulation };
}

export function getStatusInfo(stage: MachineStage, angle: number | null, depth: number | null, config: InjectionConfig) {
  if (stage === 'IDLE') return { text: '等待注射……', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  if (stage === 'CONTACT') return { text: '开始进针……', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  if (stage === 'READY') {
    if (config.id === 'intravenous') {
      return { text: '✓ 导管推进完成\n可以固定', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', isReady: true };
    }
    return { text: '✓ 已到达目标位置\n可以注射', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', isReady: true };
  }

  if (config.id === 'intravenous') {
    if (stage === 'DEPTH') return { text: '寻找回血……', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (stage === 'FLASHBACK') return { text: '见到回血\n可以继续进针', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (stage === 'ADVANCE') return { text: '角度已降低\n推进导管……', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  }

  let angleError = 'NONE';
  if (angle !== null) {
    if (angle > config.targetAngle + config.angleTolerance) angleError = 'TOO_LARGE';
    else if (angle < config.targetAngle - config.angleTolerance) angleError = 'TOO_SMALL';
  }

  let depthError = 'NONE';
  if (depth !== null && config.targetDepth !== null && config.depthTolerance !== null) {
    if (depth > config.targetDepth + config.depthTolerance) depthError = 'TOO_DEEP';
    else if (depth < config.targetDepth - config.depthTolerance) depthError = 'TOO_SHALLOW';
  }

  if (angleError === 'TOO_LARGE') return { text: '⚠ 角度过大', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  if (angleError === 'TOO_SMALL') return { text: '⚠ 角度过小', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };

  if (stage === 'ANGLE') {
    if (angleError === 'NONE') return { text: '✓ 角度正常', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    return { text: '角度检测中……', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  }

  if (stage === 'DEPTH') {
    if (depthError === 'TOO_DEEP') return { text: '⚠ 进针过深', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (depthError === 'TOO_SHALLOW') return { text: '深度检测中……', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    
    return { text: '✓ 深度正常', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
  }

  return { text: '检测中……', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
}

export function getMetricStatus(value: number | null, target: number | null, tolerance: number | null, isDepth = false) {
  if (value === null || target === null || tolerance === null) return { color: 'text-slate-500', barColor: 'bg-slate-300' };
  
  if (value > target + tolerance) return { color: 'text-red-600', barColor: 'bg-red-500' };
  if (value < target - tolerance) {
    if (isDepth) return { color: 'text-yellow-600', barColor: 'bg-yellow-500' };
    return { color: 'text-red-600', barColor: 'bg-red-500' };
  }
  
  return { color: 'text-green-600', barColor: 'bg-green-500' };
}
