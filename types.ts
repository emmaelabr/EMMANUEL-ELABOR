
export interface ExperimentState {
  id: string;
  name: string;
  type: 'physics' | 'chemistry';
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
  | 'spring';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isAction?: boolean;
}

export interface GroundingSource {
  uri: string;
  title: string;
}
