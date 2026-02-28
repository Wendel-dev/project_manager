import { useState, useEffect } from "react";
import { ProjectProvider, useProject } from "./contexts/ProjectContext";
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import ProjectDashboard from "./components/ProjectDashboard";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { PaymentStatus } from "./components/PaymentStatus";
import UpgradePlans from "./components/UpgradePlans";

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const { selectedProject } = useProject();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Simple route handling
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    // Check initial path
    if (currentPath === "/payment/success") {
      setPaymentStatus("success");
    } else if (currentPath === "/payment/cancel") {
      setPaymentStatus("cancel");
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    if (path === "/") setPaymentStatus(null);
  };

  const handleBackToDashboard = () => {
    navigateTo("/");
  };

  // Auto-open menu on mobile if no project is selected
  useEffect(() => {
    if (user && !selectedProject && window.innerWidth <= 768) {
      setIsMenuOpen(true);
    }
  }, [selectedProject, user]);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        <h1>IndieFlow</h1>
        {showRegister ? <RegisterForm /> : <LoginForm />}
        <button className="toggle-auth" onClick={() => setShowRegister(!showRegister)}>
          {showRegister ? "Já tem conta? Entre aqui" : "Não tem conta? Cadastre-se"}
        </button>
      </div>
    );
  }

  if (currentPath === "/upgrade") {
    return (
      <div className="app-container">
        <UpgradePlans onBack={handleBackToDashboard} />
      </div>
    );
  }

  if (paymentStatus) {
    return (
      <div className="app-container">
        <PaymentStatus status={paymentStatus} onBack={handleBackToDashboard} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="mobile-header">
        <span>IndieFlow</span>
        <div className="header-actions">
          <button className="logout-btn" onClick={signOut}>Sair</button>
          <button className="menu-toggle" onClick={() => setIsMenuOpen(true)}>☰</button>
        </div>
      </header>
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <main className="content">
        <ProjectDashboard />
      </main>
    </div>
  );
}

export function App() {
  return (
    <ProjectProvider>
      <AppLayout />
    </ProjectProvider>
  );
}

export default App;
