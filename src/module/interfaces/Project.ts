export type ProjectType = 'jogo' | 'aplicativo';

export interface ProjectData {
  id: number;
  user_id: string;
  name: string;
  type: ProjectType;
  current_phase_id: number;
  current_phase?: string; // Kept for legacy support during transition if needed
  created_at: string;
}