export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface TaskData {
  id: number;
  user_id: string;
  project_id: number;
  title: string;
  description: string | null;
  area: string;
  status: 'todo' | 'doing' | 'done';
  target_date?: string | null;
  checklists?: string | null;
  doc_element_version_id: number | null;
  started_doing_at?: string | null;
  created_at: string;
  updated_at: string;
}
