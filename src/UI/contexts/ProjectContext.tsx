import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { ProjectData, ProjectType } from "../../Project/module/interfaces/Project";
import type { PhaseData } from "../../Project/module/interfaces/Phase";
import type { ParsedPhase } from "../../Project/module/interfaces/ParsedProject";
import type { DocElementData, ParsedDocSection } from "../../Project/module/interfaces/Doc";
import { useAuth } from "./AuthContext";
import { ExportDocUseCase } from "../../Project/application/ExportDocUseCase";
import type { DocTreeNode } from "../../Project/application/GetDocTreeUseCase";

// API Services
import { ProjectApiService } from "../infrastructure/ProjectApiService";
import { TaskApiService } from "../infrastructure/TaskApiService";
import { PhaseApiService } from "../infrastructure/PhaseApiService";
import { DocApiService } from "../infrastructure/DocApiService";
import { ParsingApiService } from "../infrastructure/ParsingApiService";

export type Project = ProjectData;
export type Phase = PhaseData;

export interface Task {
  id: number;
  project_id: number;
  phase_id: number | null;
  title: string;
  description: string | null;
  area: string;
  status: 'todo' | 'doing' | 'done';
  target_date?: string | null;
  checklists?: string | null; // JSON string of ChecklistItem[]
  doc_element_version_id?: number | null;
  updated_at: string;
  started_doing_at?: string | null;
}

export interface DocElement extends DocElementData {
  children?: DocElement[];
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  tasks: Task[];
  phases: Phase[];
  docs: DocElement[];
  selectProject: (id: number) => void;
  addProject: (name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedPhase['tasks']) => Promise<void>;
  fetchProjects: () => Promise<void>;
  addTask: (title: string, area: string, description?: string, doc_element_version_id?: number|null, phase_id?: number|null) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  addDoc: (title: string, content: string, element_id?: number, parent_id?: number | null) => Promise<void>;
  fetchDocs: (projectId: number) => Promise<void>;
  fetchPhases: (projectId: number) => Promise<void>;
  parseDocument: (file: File) => Promise<ParsedPhase>;
  parseDocHierarchy: (file: File) => Promise<ParsedDocSection[]>;
  importDocHierarchy: (sections: ParsedDocSection[]) => Promise<void>;
  importProject: (parsedProject: ParsedPhase) => Promise<void>;
  createPhase: (projectId: number, phaseName: string, tasks?: ParsedPhase['tasks']) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  exportProjectDocs: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [docs, setDocs] = useState<DocElement[]>([]);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const data = await ProjectApiService.findAll();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async (projectId: number) => {
    if (!user) return;
    try {
      const data = await TaskApiService.findByProject(projectId);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    }
  };

  const fetchPhases = async (projectId: number) => {
    if (!user) return;
    try {
      const data = await PhaseApiService.findByProject(projectId);
      setPhases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching phases:", error);
      setPhases([]);
    }
  };

  const fetchDocs = async (projectId: number) => {
    if (!user) return;
    try {
      const data = await DocApiService.getTree(projectId);
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
      fetchPhases(project.id);
      fetchDocs(project.id);
    }
  };

  const addProject = async (name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedPhase['tasks']) => {
    if (!user) return;
    try {
      await ProjectApiService.create({ name, type, initialPhaseName, tasks });
      await fetchProjects();
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const createPhase = async (projectId: number, phaseName: string, tasks?: ParsedPhase['tasks']) => {
    if (!user) return;
    try {
      await PhaseApiService.create(projectId, { phaseName, tasks });
      await fetchProjects();
      
      // Update selected project if it's the one that transitioned
      if (selectedProject?.id === projectId) {
        const updated = await ProjectApiService.findById(projectId);
        if (updated) {
          setSelectedProject(updated);
          await fetchPhases(projectId);
          await fetchTasks(projectId);
        }
      }
    } catch (error) {
      console.error("Error creating phase:", error);
      throw error;
    }
  };

  const deleteProject = async (id: number) => {
    if (!user) return;
    try {
      await ProjectApiService.delete(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setTasks([]);
        setPhases([]);
        setDocs([]);
      }
      await fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  };

  const exportProjectDocs = async () => {
    if (!selectedProject || docs.length === 0) return;

    const exportUseCase = new ExportDocUseCase();
    const markdown = await exportUseCase.execute(docs as DocTreeNode[]);

    // Trigger download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}-docs.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addTask = async (title: string, area: string, description?: string, doc_element_version_id?: number|null, phase_id?: number|null) => {
    if (!selectedProject || !user) return;
    try {
      await TaskApiService.create(selectedProject.id, { title, area, description, doc_element_version_id, phase_id });
      await fetchTasks(selectedProject.id);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    if (!selectedProject || !user) return;
    try {
      await TaskApiService.update(id, updates);
      await fetchTasks(selectedProject.id);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!selectedProject || !user) return;
    try {
      await TaskApiService.delete(id);
      await fetchTasks(selectedProject.id);
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const addDoc = async (title: string, content: string, element_id?: number, parent_id?: number | null) => {
    if (!selectedProject || !user) return;
    try {
      await DocApiService.save(selectedProject.id, { title, content, element_id, parent_id });
      await fetchDocs(selectedProject.id);
      await fetchTasks(selectedProject.id);
    } catch (error) {
      console.error("Error adding/updating doc:", error);
    }
  };

  const parseDocHierarchy = async (file: File): Promise<ParsedDocSection[]> => {
    if (!user) throw new Error("Unauthorized");
    return await ParsingApiService.parseDocHierarchy(file);
  };

  const importDocHierarchy = async (sections: ParsedDocSection[]) => {
    if (!selectedProject || !user) return;
    try {
      await DocApiService.importHierarchy(selectedProject.id, sections);
      await fetchDocs(selectedProject.id);
    } catch (error) {
      console.error("Error importing documents:", error);
      throw error;
    }
  };

  const parseDocument = async (file: File): Promise<ParsedPhase> => {
    if (!user) throw new Error("Unauthorized");
    return await ParsingApiService.parseProjectFile(file);
  };

  const importProject = async (parsedProject: ParsedPhase) => {
    if (!user) return;
    try {
      await ParsingApiService.importProject(parsedProject);
      await fetchProjects();
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
      phases,
      docs,
      selectProject, 
      addProject, 
      fetchProjects,
      addTask,
      updateTask,
      deleteTask,
      addDoc,
      fetchDocs,
      fetchPhases,
      parseDocument,
      parseDocHierarchy,
      importDocHierarchy,
      importProject,
      createPhase,
      deleteProject,
      exportProjectDocs
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
