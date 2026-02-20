export type ProjectType = 'jogo' | 'aplicativo';

export interface ProjectData {
  id: number;
  user_id: string;
  name: string;
  type: ProjectType;
  current_phase: string;
  created_at: string;
}