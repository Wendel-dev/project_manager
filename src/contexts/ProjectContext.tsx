import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ProjectRepositoryAPI } from "../infrastructure/ProjectRepositoryAPI";
import type { ProjectData, ProjectType } from "../module/interfaces/Project";
import type { ParsedPhase } from "../module/interfaces/ParsedProject";
import type { DocElementData, ParsedDocSection } from "../module/interfaces/Doc";
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

export interface DocElement extends DocElementData {
  children?: DocElement[];
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  tasks: Task[];
  docs: DocElement[];
  selectProject: (id: number) => void;
  addProject: (name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedPhase['tasks']) => Promise<void>;
  fetchProjects: () => Promise<void>;
  addTask: (title: string, area: string, description?: string, doc_element_version_id?: number) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  addDoc: (title: string, content: string, element_id?: number, parent_id?: number | null) => Promise<void>;
  fetchDocs: (projectId: number) => Promise<void>;
  parseDocument: (file: File) => Promise<ParsedPhase>;
  parseDocHierarchy: (file: File) => Promise<ParsedDocSection[]>;
  importDocHierarchy: (sections: ParsedDocSection[]) => Promise<void>;
  importProject: (parsedProject: ParsedPhase) => Promise<void>;
  transitionPhase: (projectId: number, nextPhaseName: string, tasks?: ParsedPhase['tasks']) => Promise<void>;
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

  const addProject = async (name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedPhase['tasks']) => {
    if (!user) return;
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, type, initialPhaseName, tasks }),
      });
      if (response.ok) {
        await fetchProjects();
      }
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const transitionPhase = async (projectId: number, nextPhaseName: string, tasks?: ParsedPhase['tasks']) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/transition`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ nextPhaseName, tasks }),
      });
      if (response.ok) {
        await fetchProjects();
        // Update selected project if it's the one that transitioned
        if (selectedProject?.id === projectId) {
          const updatedProjects = await projectRepository.findAll(user!.id);
          const updated = updatedProjects.find(p => p.id === projectId);
          if (updated) {
            setSelectedProject(updated);
            await fetchTasks(projectId);
          }
        }
      }
    } catch (error) {
      console.error("Error transitioning phase:", error);
      throw error;
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

  const addDoc = async (title: string, content: string, element_id?: number, parent_id?: number | null) => {
    if (!selectedProject || !token) return;
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/docs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, content, element_id, parent_id }),
      });
      if (response.ok) {
        await fetchDocs(selectedProject.id);
        await fetchTasks(selectedProject.id);
      }
    } catch (error) {
      console.error("Error adding/updating doc:", error);
    }
  };

  const parseDocHierarchy = async (file: File): Promise<ParsedDocSection[]> => {
    if (!token) throw new Error("Unauthorized");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-doc-hierarchy", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to parse document hierarchy");
    }

    return await response.json();
  };

  const importDocHierarchy = async (sections: ParsedDocSection[]) => {
    if (!selectedProject || !token) return;
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/import-docs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(sections),
      });
      if (response.ok) {
        await fetchDocs(selectedProject.id);
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to import documents");
      }
    } catch (error) {
      console.error("Error importing documents:", error);
      throw error;
    }
  };

  const parseDocument = async (file: File): Promise<ParsedPhase> => {
    if (!token) throw new Error("Unauthorized");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-document", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to parse document");
    }

    return await response.json();
  };

  const importProject = async (parsedProject: ParsedPhase) => {
    if (!token) return;
    try {
      const response = await fetch("/api/import-project", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(parsedProject),
      });
      if (response.ok) {
        await fetchProjects();
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to import project");
      }
    } catch (error) {
      console.error("Error importing project:", error);
      throw error;
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
      fetchDocs,
      parseDocument,
      parseDocHierarchy,
      importDocHierarchy,
      importProject,
      transitionPhase
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
