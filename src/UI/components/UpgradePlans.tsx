import React, { useState } from 'react';
import { PaymentApiService } from '../infrastructure/PaymentApiService';

interface UpgradePlansProps {
  onBack: () => void;
}

const UpgradePlans: React.FC<UpgradePlansProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const priceId = 'price_pro_monthly_placeholder'; 
      const { url } = await PaymentApiService.createCheckoutSession({
        priceId,
        mode: 'subscription',
        currency: 'brl',
        successUrl: window.location.origin + '/payment/success',
        cancelUrl: window.location.origin + '/upgrade',
      });
      window.location.href = url;
    } catch (error) {
      alert('Erro ao iniciar checkout: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-page">
      <div className="upgrade-container">
        <header className="upgrade-header">
          <button className="back-link" onClick={onBack}>
            <span className="arrow">←</span> Voltar para o Dashboard
          </button>
          <div className="title-section">
            <h1>Escolha seu plano</h1>
            <p>Gerencie seus projetos sem limites e impulsione seu fluxo de trabalho.</p>
          </div>
        </header>
        
        <div className="plans-grid">
          <div className="plan-card">
            <div className="plan-header">
              <h3>Iniciante</h3>
              <p>Ideal para começar</p>
            </div>
            <div className="price">R$ 0<span>/mês</span></div>
            <ul className="features-list">
              <li>
                <span className="check">✓</span> 
                <strong>1 Projeto</strong> Ativo
              </li>
              <li><span className="check">✓</span> Kanban e Documentação</li>
              <li><span className="check">✓</span> IA de Importação Básica</li>
              <li className="disabled"><span className="cross">×</span> Projetos Ilimitados</li>
              <li className="disabled"><span className="cross">×</span> Exportação em PDF</li>
            </ul>
            <button disabled className="current-plan-btn">Plano Atual</button>
          </div>

          <div className="plan-card pro featured">
            <div className="badge">MAIS POPULAR</div>
            <div className="plan-header">
              <h3>Profissional</h3>
              <p>Para quem busca produtividade</p>
            </div>
            <div className="price">R$ 29,90<span>/mês</span></div>
            <ul className="features-list">
              <li>
                <span className="check">✓</span> 
                <strong>Projetos Ilimitados</strong>
              </li>
              <li><span className="check">✓</span> Kanban e Documentação</li>
              <li><span className="check">✓</span> IA de Importação Avançada</li>
              <li><span className="check">✓</span> Exportação PDF e Markdown</li>
              <li><span className="check">✓</span> Suporte Prioritário</li>
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="subscribe-btn"
            >
              {loading ? (
                <span className="loader-container">
                  <span className="mini-loader"></span> Processando...
                </span>
              ) : 'Fazer Upgrade para Pro'}
            </button>
          </div>
        </div>

        <footer className="upgrade-footer">
          <p>Pagamento seguro via <strong>Stripe</strong>. Cancele quando quiser.</p>
        </footer>
      </div>

      <style>{`
        .upgrade-page {
          width: 100%;
          min-height: 100vh;
          background: #f8fafc;
          padding: 3rem 1rem;
        }
        .upgrade-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .upgrade-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .back-link {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto 2rem;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--primary-color);
        }
        .title-section h1 {
          font-size: 2.5rem;
          color: #1e293b;
          margin-bottom: 1rem;
        }
        .title-section p {
          color: #64748b;
          font-size: 1.1rem;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 380px));
          gap: 2.5rem;
          padding: 0 1rem;
          justify-content: center;
        }
        .plan-card {
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .plan-card:hover {
          transform: translateY(-5px);
        }
        .plan-card.featured {
          border: 2px solid var(--primary-color);
          position: relative;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        .plan-header h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }
        .plan-header p {
          color: #64748b;
          font-size: 0.9rem;
        }
        .badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary-color);
          color: white;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .price {
          font-size: 3rem;
          font-weight: 800;
          margin: 2rem 0;
          color: #0f172a;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
          width: 100%;
        }
        .price span {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 400;
        }
        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 2.5rem 0;
          flex-grow: 1;
          width: 100%;
          text-align: left;
        }
        .features-list li {
          margin-bottom: 1rem;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .features-list li.disabled {
          color: #94a3b8;
          text-decoration: line-through;
        }
        .check { color: #10b981; font-weight: bold; }
        .cross { color: #ef4444; font-weight: bold; }
        
        button {
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .subscribe-btn {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .subscribe-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .current-plan-btn {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: default;
        }
        .upgrade-footer {
          margin-top: 4rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        
        .loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .mini-loader {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .title-section h1 { font-size: 2rem; }
          .upgrade-page { padding: 2rem 0.5rem; }
        }
      `}</style>
    </div>
  );
};

export default UpgradePlans;
