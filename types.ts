
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
  type: 
    | 'circle' | 'box' | 'line' | 'atom' | 'container' | 'ray' 
    | 'beaker' | 'flask' | 'test_tube' | 'bunsen' | 'pipette' 
    | 'magnet' | 'prism' | 'lens_convex' | 'lens_concave' | 'mirror'
    | 'pulley' | 'weight' | 'battery' | 'bulb' | 'resistor' | 'thermometer';
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
  angle?: number;
  fluidLevel?: number;
  // Included 'idle' state to support entities that have finished a reaction or are inactive
  state?: 'on' | 'off' | 'burning' | 'reacting' | 'idle';
  // Reactive Properties
  consumptionRate?: number; // Rate at which radius/size decreases
  trailColor?: string; // Color of the path left behind (pH indicator)
  gasEvolutionRate?: number; // Probability of spawning gas particles
  buoyancy?: number; // 0 to 1 (0 sinks, 1 floats on surface)
}

export interface PhysicsRule {
  type: 'gravity' | 'collision' | 'attraction' | 'reflection' | 'oscillation' | 'brownian' | 'optics' | 'circuit' | 'chemical_reaction';
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
