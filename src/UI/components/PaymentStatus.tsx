// src/UI/components/PaymentStatus.tsx
import React from 'react';

interface Props {
  status: 'success' | 'cancel';
  onBack: () => void;
}

export const PaymentStatus: React.FC<Props> = ({ status, onBack }) => {
  return (
    <div className="payment-status-container">
      {status === 'success' ? (
        <div className="payment-success">
          <h2>🎉 Pagamento Realizado!</h2>
          <p>Obrigado! Seu pagamento foi processado com sucesso.</p>
        </div>
      ) : (
        <div className="payment-cancel">
          <h2>❌ Pagamento Cancelado</h2>
          <p>O pagamento não foi concluído. Tente novamente quando quiser.</p>
        </div>
      )}
      <button onClick={onBack} className="btn-primary">Voltar ao Dashboard</button>
    </div>
  );
};
