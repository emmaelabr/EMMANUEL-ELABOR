
export interface ExperimentState {
  id: string;
  name: string;
  type: 'physics' | 'chemistry' | 'electronics';
  description: string;
  parameters: Record<string, number>;
  dataPoints: Array<{ x: number; y: number; label?: string }>;
  apparatus: ApparatusType[];
  status: 'idle' | 'running' | 'completed';
}

export type ApparatusType = 
  | 'beaker' 
  | 'burner' 
  | 'pendulum' 
  | 'projectile_launcher' 
  | 'test_tube' 
  | 'spring'
  | 'battery'
  | 'resistor'
  | 'bulb'
  | 'wire'
  | 'switch';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isAction?: boolean;
  showGraph?: boolean;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ImageData {
  data: string;
  mimeType: string;
}
