import { useState, useEffect, useCallback, useRef } from 'react';
import { InjectionConfig, MachineStage } from './types';

export interface SimulationState {
  stage: MachineStage;
  angle: number | null;
  depth: number | null;
  overshootTarget: boolean;
  stableTime: number;
}

export function useSimulator(config: InjectionConfig | null) {
  const [state, setState] = useState<SimulationState>({
    stage: 'IDLE',
    angle: null,
    depth: null,
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
      overshootTarget: config?.isShallow || false,
      stableTime: 0,
    });
  }, [config]);

  const resetSimulation = useCallback(() => {
    setState({
      stage: 'IDLE',
      angle: null,
      depth: null,
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
      let nextOvershoot = current.overshootTarget;
      let nextStableTime = current.stableTime;

      if (current.stage === 'CONTACT') {
        nextStableTime += TICK_MS;
        if (nextStableTime >= 400) {
          nextStage = 'ANGLE';
          nextStableTime = 0;
          // 初始角度偏离目标值，模拟初始姿势不准确
          const startOffset = Math.random() > 0.5 ? (config.angleTolerance + 4) : -(config.angleTolerance + 4);
          nextAngle = Math.max(0, config.targetAngle + startOffset);
        }
      } else if (current.stage === 'ANGLE') {
        nextStableTime += TICK_MS;
        if (nextAngle !== null) {
          const diff = config.targetAngle - nextAngle;
          if (Math.abs(diff) > config.angleTolerance) {
             // 快速靠近目标并伴随轻微随机抖动
             nextAngle += diff * 0.3 + (Math.random() - 0.5) * 0.5;
          } else {
             // 在目标值附近产生随机抖动，模拟真实手部轻微不稳定
             nextAngle = config.targetAngle + (Math.random() - 0.5) * 0.5;
          }
        }
        
        // 角度变化领先深度约0.5秒
        if (nextStableTime >= 500) {
          nextStage = 'DEPTH';
          nextStableTime = 0;
          nextDepth = 0;
        }
      } else if (current.stage === 'DEPTH' || current.stage === 'READY') {
        if (nextAngle !== null) {
          const diff = config.targetAngle - nextAngle;
          if (Math.abs(diff) > config.angleTolerance) {
             nextAngle += diff * 0.3 + (Math.random() - 0.5) * 0.5;
          } else {
             nextAngle = config.targetAngle + (Math.random() - 0.5) * 0.5;
          }
        }

        if (nextDepth !== null) {
          if (current.stage === 'READY') {
            nextDepth = config.targetDepth + (Math.random() - 0.5) * 0.05;
          } else {
            // 如果是浅层注射且开启了过冲逻辑，目标会暂时更深
            const actualTargetDepth = nextOvershoot 
              ? config.targetDepth + config.depthTolerance + (config.isShallow ? 2.5 : 0)
              : config.targetDepth;
              
            const depthDiff = actualTargetDepth - nextDepth;
            // 非线性增加：距离越远速度越快，靠近目标时减速，模拟推进阻力
            if (Math.abs(depthDiff) > config.depthTolerance) {
              nextDepth += depthDiff * 0.12 + (Math.random() - 0.5) * 0.2;
            } else {
              nextDepth += depthDiff * 0.2 + (Math.random() - 0.5) * 0.05;
            }

            // 如果当前深度超过了误差范围，取消过冲目标，模拟操作者发现过深后"回撤"的动作
            if (nextOvershoot && nextDepth > config.targetDepth + config.depthTolerance + 0.5) {
              nextOvershoot = false; 
            }
          }
        }

        if (current.stage === 'DEPTH') {
          const angleOk = nextAngle !== null && Math.abs(nextAngle - config.targetAngle) <= config.angleTolerance;
          const depthOk = nextDepth !== null && Math.abs(nextDepth - config.targetDepth) <= config.depthTolerance;

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
  if (stage === 'IDLE') return { text: '等待注射……', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
  if (stage === 'CONTACT') return { text: '开始进针……', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  if (stage === 'READY') return { text: '✓ 已到达目标位置\n可以注射', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/50', isReady: true };

  let angleError = 'NONE';
  if (angle !== null) {
    if (angle > config.targetAngle + config.angleTolerance) angleError = 'TOO_LARGE';
    else if (angle < config.targetAngle - config.angleTolerance) angleError = 'TOO_SMALL';
  }

  let depthError = 'NONE';
  if (depth !== null) {
    if (depth > config.targetDepth + config.depthTolerance) depthError = 'TOO_DEEP';
    else if (depth < config.targetDepth - config.depthTolerance) depthError = 'TOO_SHALLOW';
  }

  if (angleError === 'TOO_LARGE') return { text: '⚠ 角度过大', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
  if (angleError === 'TOO_SMALL') return { text: '⚠ 角度过小', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };

  if (stage === 'ANGLE') {
    if (angleError === 'NONE') return { text: '✓ 角度正常', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    return { text: '角度检测中……', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  }

  if (stage === 'DEPTH') {
    if (depthError === 'TOO_DEEP') return { text: '⚠ 进针过深', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (depthError === 'TOO_SHALLOW') return { text: '深度检测中……', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    
    return { text: '✓ 深度正常', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
  }

  return { text: '检测中……', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
}

export function getMetricStatus(value: number | null, target: number, tolerance: number, isDepth = false) {
  if (value === null) return { color: 'text-slate-500', barColor: 'bg-slate-700' };
  
  if (value > target + tolerance) return { color: 'text-red-400', barColor: 'bg-red-500' };
  if (value < target - tolerance) {
    if (isDepth) return { color: 'text-yellow-400', barColor: 'bg-yellow-500' };
    return { color: 'text-red-400', barColor: 'bg-red-500' };
  }
  
  return { color: 'text-green-400', barColor: 'bg-green-500' };
}
