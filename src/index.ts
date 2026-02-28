import { serve } from "bun";
import index from "./index.html";
import { ProjectRepositoryFactory } from "./Project/infrastructure/ProjectRepositoryFactory";
import { AddProjectUseCase } from "./Project/application/AddProjectUseCase";
import { UpdateProjectUseCase } from "./Project/application/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "./Project/application/DeleteProjectUseCase";
import { GetTasksUseCase } from "./Project/application/GetTasksUseCase";
import { AddTaskUseCase } from "./Project/application/AddTaskUseCase";
import { UpdateTaskUseCase } from "./Project/application/UpdateTaskUseCase";
import { DeleteTaskUseCase } from "./Project/application/DeleteTaskUseCase";
import { SaveDocUseCase } from "./Project/application/SaveDocUseCase";
import { GetGovernanceUseCase } from "./Project/application/GetGovernanceUseCase";
import { ParseDocumentUseCase } from "./Project/application/ParseDocumentUseCase";
import { ImportTasksUseCase } from "./Project/application/ImportTasksUseCase";
import { CreatePhaseUseCase } from "./Project/application/CreatePhaseUseCase";
import { ParseDocDocumentUseCase } from "./Project/application/ParseDocDocumentUseCase";
import { ImportDocUseCase } from "./Project/application/ImportDocUseCase";
import { GetDocTreeUseCase } from "./Project/application/GetDocTreeUseCase";
import { DocMarkdownParser } from "./Project/infrastructure/parsers/DocMarkdownParser";
import { DocTextParser } from "./Project/infrastructure/parsers/DocTextParser";
import { DocPDFParser } from "./Project/infrastructure/parsers/DocPDFParser";
import { PaymentRepositoryFactory } from "./Payment/infrastructure/PaymentRepositoryFactory";
import { PaymentFactory } from "./Payment/infrastructure/PaymentFactory";
import { ProcessPaymentUseCase } from "./Payment/application/ProcessPaymentUseCase";
import { HandlePaymentWebhookUseCase } from "./Payment/application/HandlePaymentWebhookUseCase";
import { FirebaseAuthRepository } from "./Auth/infrastructure/Firebase/FirebaseAuthRepository";
import { AuthRepositoryMock } from "./Auth/infrastructure/Mocks/AuthRepositoryMock";
import { auth } from "./Auth/infrastructure/Firebase/config";
import { LoginUseCase } from "./Auth/application/LoginUseCase";
import { RegisterUseCase } from "./Auth/application/RegisterUseCase";
import { LogoutUseCase } from "./Auth/application/LogoutUseCase";
import { GetSessionUseCase } from "./Auth/application/GetSessionUseCase";

import { createAuthRoutes } from "./Auth/infrastructure/AuthRoutes";
import { createProjectRoutes } from "./Project/infrastructure/ProjectRoutes";
import { createPaymentRoutes } from "./Payment/infrastructure/PaymentRoutes";

process.env.NODE_ENV = "test";

const projectRepo = ProjectRepositoryFactory.createProjectRepository();
const taskRepo = ProjectRepositoryFactory.createTaskRepository();
const docRepo = ProjectRepositoryFactory.createDocRepository();
const phaseRepo = ProjectRepositoryFactory.createPhaseRepository();
const paymentRepo = PaymentRepositoryFactory.createPaymentRepository();

// Auth setup
const authRepository = (process.env.NODE_ENV === "test" || !process.env.VITE_FIREBASE_API_KEY)
  ? new AuthRepositoryMock() 
  : new FirebaseAuthRepository(auth);

const loginUseCase = new LoginUseCase(authRepository);
const registerUseCase = new RegisterUseCase(authRepository);
const logoutUseCase = new LogoutUseCase(authRepository);
const getSessionUseCase = new GetSessionUseCase(authRepository);

// Payment setup
const paymentProvider = PaymentFactory.create();
const processPaymentUseCase = new ProcessPaymentUseCase(paymentProvider, paymentRepo);
const handlePaymentWebhookUseCase = new HandlePaymentWebhookUseCase(paymentProvider, paymentRepo);

// Project setup
const addProjectUseCase = new AddProjectUseCase(projectRepo, taskRepo, phaseRepo);
const updateProjectUseCase = new UpdateProjectUseCase(projectRepo);
const deleteProjectUseCase = new DeleteProjectUseCase(projectRepo);
const getTasksUseCase = new GetTasksUseCase(taskRepo);
const addTaskUseCase = new AddTaskUseCase(taskRepo);
const updateTaskUseCase = new UpdateTaskUseCase(taskRepo);
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepo);
const getDocTreeUseCase = new GetDocTreeUseCase(docRepo);
const saveDocUseCase = new SaveDocUseCase(docRepo);
const getGovernanceUseCase = new GetGovernanceUseCase(taskRepo);
const parseDocumentUseCase = new ParseDocumentUseCase();
const importTasksUseCase = new ImportTasksUseCase(projectRepo, taskRepo, phaseRepo);
const createPhaseUseCase = new CreatePhaseUseCase(projectRepo, taskRepo, phaseRepo);

const docParsers = [
  new DocMarkdownParser(),
  new DocTextParser(),
  new DocPDFParser(),
];
const parseDocDocumentUseCase = new ParseDocDocumentUseCase(docParsers);
const importDocUseCase = new ImportDocUseCase(docRepo);

// Create route objects
const authRoutes = createAuthRoutes(loginUseCase, registerUseCase, logoutUseCase, getSessionUseCase);
const paymentRoutes = createPaymentRoutes(processPaymentUseCase, handlePaymentWebhookUseCase);
const projectRoutes = createProjectRoutes({
  projectRepo,
  phaseRepo,
  addProjectUseCase,
  updateProjectUseCase,
  deleteProjectUseCase,
  getTasksUseCase,
  addTaskUseCase,
  updateTaskUseCase,
  deleteTaskUseCase,
  getDocTreeUseCase,
  saveDocUseCase,
  getGovernanceUseCase,
  parseDocumentUseCase,
  importTasksUseCase,
  createPhaseUseCase,
  parseDocDocumentUseCase,
  importDocUseCase
});

const server = serve({
  routes: {
    // Static assets
    "/index.css": new Response(Bun.file("./src/index.css")),

    // Modular routes
    ...authRoutes,
    ...projectRoutes,
    ...paymentRoutes,

    // Catch-all for SPA
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
