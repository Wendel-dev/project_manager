import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ProjectRepositoryAPI } from "../infrastructure/ProjectRepositoryAPI";
import type { ProjectData, ProjectType } from "../module/interfaces/Project";
import { useAuth } from "./AuthContext";

export type Project = ProjectData;

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  area: string;
  status: 'todo' | 'doing' | 'done';
  doc_element_version_id?: number;
  updated_at: string;
  started_doing_at?: string;
}

export interface DocElement {
  id: number;
  project_id: number;
  title: string;
  current_version_id?: number;
  current_content?: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  tasks: Task[];
  docs: DocElement[];
  selectProject: (id: number) => void;
  addProject: (name: string, type: ProjectType) => Promise<void>;
  fetchProjects: () => Promise<void>;
  addTask: (title: string, area: string, description?: string, doc_element_version_id?: number) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  addDoc: (title: string, content: string, element_id?: number) => Promise<void>;
  fetchDocs: (projectId: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<DocElement[]>([]);
  const { user, token } = useAuth();

  // Instantiate Repository and UseCase for the frontend
  const projectRepository = useMemo(() => new ProjectRepositoryAPI(), []);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  });

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const data = await projectRepository.findAll(user.id);
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async (projectId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        headers: getHeaders()
      });
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    }
  };

  const fetchDocs = async (projectId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/docs`, {
        headers: getHeaders()
      });
      const data = await response.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching docs:", error);
      setDocs([]);
    }
  };

  const selectProject = (id: number) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setSelectedProject(project);
      fetchTasks(project.id);
      fetchDocs(project.id);
    }
  };

  const addProject = async (name: string, type: ProjectType) => {
    if (!user) return;
    try {
      await projectRepository.create(user.id, name, type, ""); // Initial phase is handled by backend
      await fetchProjects();
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const addTask = async (title: string, area: string, description?: string, doc_element_version_id?: number) => {
    if (!selectedProject || !token) return;
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, area, description, doc_element_version_id }),
      });
      if (response.ok) {
        await fetchTasks(selectedProject.id);
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    if (!selectedProject || !token) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchTasks(selectedProject.id);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const addDoc = async (title: string, content: string, element_id?: number) => {
    if (!selectedProject || !token) return;
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/docs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, content, element_id }),
      });
      if (response.ok) {
        await fetchDocs(selectedProject.id);
        await fetchTasks(selectedProject.id); // Versions might change relevance to tasks
      }
    } catch (error) {
      console.error("Error adding/updating doc:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProject(null);
    }
  }, [user]);

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      selectedProject, 
      tasks, 
      docs,
      selectProject, 
      addProject, 
      fetchProjects,
      addTask,
      updateTask,
      addDoc,
      fetchDocs
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
