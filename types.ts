
export interface ExperimentState {
  id: string;
  name: string;
  type: string;
  description: string;
  parameters: Record<string, number>;
  dataPoints: Array<{ x: number; y: number; label?: string }>;
  apparatus: string[];
  status: 'idle' | 'running' | 'completed';
  entities?: Entity[];
  physicsRules?: PhysicsRule[];
}

export interface Entity {
  id: string;
  type: 'circle' | 'box' | 'line' | 'atom' | 'container' | 'ray';
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  label?: string;
  mass?: number;
  charge?: number;
  parentId?: string;
}

export interface PhysicsRule {
  type: 'gravity' | 'collision' | 'attraction' | 'reflection' | 'oscillation' | 'brownian';
  strength?: number;
  targetType?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isAction?: boolean;
  showGraph?: boolean;
  sources?: GroundingSource[];
  newExperiment?: Partial<ExperimentState>;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AttachmentData {
  data: string;
  mimeType: string;
  name?: string;
}
