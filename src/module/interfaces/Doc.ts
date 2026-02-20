export interface DocElementData {
  id: number;
  user_id: string;
  project_id: number;
  title: string;
  current_version_id: number | null;
  current_content?: string;
  version_created_at?: string;
}

export interface DocVersionData {
  id: number;
  element_id: number;
  content: string;
  created_at: string;
}
