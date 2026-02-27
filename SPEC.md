# SPEC: Refactoring Routes and Dependencies

## 1. Overview
Currently, `src/index.ts` handles all dependencies, route definitions, and domain logic. This project aims to decouple these responsibilities by delegating route definitions to their respective domain-specific infrastructure layers. This is highly viable and aligns with the Clean Architecture/DDD principles already present in the codebase.

## 2. Technical Viability and Potential Issues
- **Viability:** High. Each domain is already separated into `application`, `infrastructure`, and `model`. Adding a `routes` layer in `infrastructure` is a natural extension.
- **Potential Problems:**
    - **Bun `serve` Structure:** Bun's router expects a flat `routes` object. We must ensure no route collisions between modules (e.g., `/api/projects` vs `/api/projects/:id`).
    - **Dependency Injection:** Repositories and Use Cases must be instantiated in `index.ts` (or a separate DI container) and passed down to the route factories.
    - **Unified Error Handling:** We need a consistent way to handle errors and status codes across all modular routes.
    - **Auth Middleware:** All modules depend on the same `authenticate` logic, which must be accessible globally.

## 3. Shared Infrastructure
- **`src/Shared/infrastructure/HttpHandlers.ts`**:
    - `handleProtected`: Wrapper for authenticated requests.
    - `handleResponse`: Unified success/error response formatter.
    - `parseFormData`: Helper for multipart/form-data parsing.

## 4. Modular Routes
Each module will define a factory function that takes its dependencies and returns a subset of the Bun routes object.

### 4.1 Auth Routes (`src/Auth/infrastructure/AuthRoutes.ts`)
**Dependencies:** `LoginUseCase`, `RegisterUseCase`, `LogoutUseCase`, `GetSessionUseCase`.
**Routes:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### 4.2 Project Routes (`src/Project/infrastructure/ProjectRoutes.ts`)
**Dependencies:** All Project-related Use Cases and Repositories.
**Routes:**
- `GET /api/projects`, `POST /api/projects`
- `GET /api/projects/:id`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- `GET /api/projects/:id/phases`, `POST /api/projects/:id/phases`
- `GET /api/projects/:id/tasks`, `POST /api/projects/:id/tasks`
- `GET /api/projects/:id/docs`, `POST /api/projects/:id/docs`
- `GET /api/projects/:id/governance`
- `POST /api/projects/:id/import-docs`
- `POST /api/parse-document`
- `POST /api/parse-doc-hierarchy`
- `POST /api/import-project`
- `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`

### 4.3 Payment Routes (`src/Payment/infrastructure/PaymentRoutes.ts`)
**Dependencies:** `ProcessPaymentUseCase`, `HandlePaymentWebhookUseCase`.
**Routes:**
- `POST /api/payments/checkout`
- `POST /api/webhooks/stripe`

## 5. Implementation Strategy
1.  **Extract Shared Logic:** Move `handleProtected` to `Shared`.
2.  **Auth Module:** Implement `AuthRoutes.ts`. This will handle the cookie management logic (Set-Cookie).
3.  **Project Module:** Implement `ProjectRoutes.ts`. Group all project, task, and document management routes.
4.  **Payment Module:** Implement `PaymentRoutes.ts`. Include the Stripe webhook.
5.  **Refactor `src/index.ts`:**
    - Initialize all dependencies.
    - Combine route objects: `routes: { ...authRoutes, ...projectRoutes, ...paymentRoutes }`.
    - Serve static assets and SPA catch-all.
