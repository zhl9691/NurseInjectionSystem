export type InjectionModeId = 'intradermal' | 'subcutaneous' | 'intramuscular' | 'intravenous';

export interface InjectionConfig {
  id: InjectionModeId;
  name: string;
  targetAngle: number;
  angleTolerance: number;
  targetDepth: number; // mm
  depthTolerance: number; // mm
  isShallow: boolean;
}

export type MachineStage = 'IDLE' | 'CONTACT' | 'ANGLE' | 'DEPTH' | 'READY';
