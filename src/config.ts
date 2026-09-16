import { InjectionModeId, InjectionConfig } from './types';

export const INJECTION_CONFIGS: Record<InjectionModeId, InjectionConfig> = {
  intradermal: { 
    id: 'intradermal', 
    name: '皮内注射', 
    targetAngle: 5, 
    angleTolerance: 2, 
    targetDepth: 2, 
    depthTolerance: 0.5, 
    isShallow: true 
  },
  subcutaneous: { 
    id: 'subcutaneous', 
    name: '皮下注射', 
    // 教学模拟以 35° 为中心，30–40° 均判定为合格。
    targetAngle: 35,
    angleTolerance: 5, 
    targetDepth: 12, 
    depthTolerance: 2, 
    isShallow: true,
    // 皮下注射的模拟：从轻微偏差逐步收敛，并在目标附近保持小幅抖动。
    initialAngleOffset: 8,
    angleCorrectionRate: 0.24,
    angleJitter: 0.4
  },
  intramuscular: { 
    id: 'intramuscular', 
    name: '肌肉注射', 
    targetAngle: 90, 
    angleTolerance: 5, 
    targetDepth: 25, 
    depthTolerance: 3, 
    isShallow: false 
  },
  intravenous: { 
    id: 'intravenous', 
    name: '静脉注射', 
    targetAngle: 22.5,
    angleTolerance: 7.5,
    targetDepth: null,
    depthTolerance: null,
    isShallow: false,
    initialAngleOffset: 8,
    angleCorrectionRate: 0.24,
    angleJitter: 0.5
  },
};
