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
    targetAngle: 35, 
    angleTolerance: 5, 
    targetDepth: 12, 
    depthTolerance: 2, 
    isShallow: true 
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
    targetAngle: 25, 
    angleTolerance: 5, 
    targetDepth: 8, 
    depthTolerance: 1, 
    isShallow: false 
  },
};
