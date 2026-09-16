export type InjectionModeId = 'intradermal' | 'subcutaneous' | 'intramuscular' | 'intravenous';

export interface InjectionConfig {
  id: InjectionModeId;
  name: string;
  targetAngle: number;
  angleTolerance: number;
  targetDepth: number | null; // mm; IV uses flashback/catheter advancement instead of a fixed depth
  depthTolerance: number | null; // mm
  isShallow: boolean;
  // Optional motion parameters used by the simulator to model angle correction.
  initialAngleOffset?: number;
  angleCorrectionRate?: number;
  angleJitter?: number;
}

export type MachineStage = 'IDLE' | 'CONTACT' | 'ANGLE' | 'DEPTH' | 'FLASHBACK' | 'ADVANCE' | 'READY';
