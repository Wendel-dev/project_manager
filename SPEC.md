# Especificação Técnica: Subdomínio de Pagamentos (Stripe & Abstração)

## 1. Visão Geral e Objetivos
Este documento define a estratégia para integrar o sistema de pagamentos utilizando **Stripe** como provedor inicial, garantindo uma arquitetura desacoplada. O sistema é implementado como um **subdomínio isolado** no diretório `src/PaymentGatway`, permitindo a substituição ou adição de novos métodos (PIX, assinaturas recorrentes via outros gateways) sem impacto no core da aplicação.

### Versão de Referência (API)
- **API Version:** `2026-02-25.clover` (Pinned)
- **SDK:** `stripe` ^14.0.0 (Node.js)

## 2. Arquitetura do Subdomínio (Isolamento)

Utilizaremos o padrão **Strategy** combinado com **Injeção de Dependência** para isolar a lógica de pagamento. O subdomínio `PaymentGatway` deve ser tratado como um módulo independente, comunicando-se com o restante do sistema apenas por interfaces bem definidas.

### 2.1. Entidades de Domínio (`src/PaymentGatway/model/interfaces/`)
As entidades de domínio não devem conhecer detalhes da Stripe.

```typescript
// src/PaymentGatway/model/interfaces/Payment.ts
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  providerId: string; // ex: 'cs_test_...'
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerId: string;
  metadata?: Record<string, any>;
}
```

### 2.2. Abstração da Aplicação (`src/PaymentGatway/application/interfaces/`)
A interface `IPaymentProvider` é o contrato que qualquer meio de pagamento deve seguir.

```typescript
// src/PaymentGatway/application/interfaces/IPaymentProvider.ts
export interface CheckoutOptions {
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface IPaymentProvider {
  createCheckoutSession(options: CheckoutOptions): Promise<{ url: string; sessionId: string }>;
  verifyWebhookSignature(payload: string, signature: string): Promise<any>;
  handleWebhookEvent(event: any): Promise<void>;
}
```

## 3. Estrutura da Implementação (`src/PaymentGatway/`)

- `model/`: Contém definições de tipos e entidades de domínio de pagamento.
- `application/`: Contém as interfaces de abstração e os Use Cases específicos do subdomínio.
- `infrastructure/`: Implementações concretas de provedores (ex: `StripePaymentProvider.ts`) e adaptadores externos.

### 3.1. Infraestrutura (`src/PaymentGatway/infrastructure/`)
- `StripePaymentProvider.ts`: Implementa `IPaymentProvider` usando o SDK oficial.
- `PaymentFactory.ts`: (Opcional) Responsável por instanciar o provedor correto baseado em configuração.

### 3.2. Padronização de Código
- **Imutabilidade:** Retornar novos objetos em vez de mutar estados.
- **Fail-Fast:** Validar dados de entrada com `zod` antes de chamar APIs externas.
- **Idempotência:** Usar `idempotencyKeys` em todas as chamadas de escrita para a Stripe.
- **Async/Await:** Uso rigoroso de tratamento de erros com blocos `try/catch` centralizados.

## 4. Plano de Implementação & Testes

### Fase 1: Core & Mocking
1.  Definir interfaces de domínio e aplicação.
2.  Criar `MockPaymentProvider` para testes unitários dos Use Cases.
3.  **Teste:** Validar que o Use Case `ProcessPayment` funciona independente do provedor.

### Fase 2: Implementação Stripe (Backend)
1.  Configurar cliente Stripe fixando a versão `2026-02-25.clover`.
2.  Implementar `StripePaymentProvider.createCheckoutSession`.
3.  **Teste:** Usar `stripe-mock` (via Docker) para validar a criação de sessões sem chamadas reais.

### Fase 3: Webhooks & Sincronização
1.  Implementar endpoint de webhook `/api/webhooks/stripe`.
2.  Adicionar verificação de assinatura (`whsec_...`).
3.  Implementar persistência local do status do pagamento.
4.  **Teste (Stripe CLI):**
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    stripe trigger checkout.session.completed
    ```

### Fase 4: Frontend
1.  Integrar redirecionamento para o Stripe Checkout.
2.  Criar página de `Success` e `Cancel` com polling de status (se necessário).

## 5. Segurança & Conformidade (PCI SAQ A)
1.  **Não armazenar dados sensíveis:** Somente IDs de transação e status são persistidos localmente.
2.  **Secret Management:** Chaves API devem estar apenas em `.env` (nunca no código).
3.  **Webhook Verification:** Obrigatório verificar o timestamp e assinatura para evitar ataques de replay.

## 6. Referências e Documentação

- **Stripe Documentation:** [stripe.com/docs](https://stripe.com/docs)
- **API Reference (Clover):** [stripe.com/docs/api](https://stripe.com/docs/api)
- **Stripe CLI Guide:** [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Best Practices for Webhooks:** [stripe.com/docs/webhooks/best-practices](https://stripe.com/docs/webhooks/best-practices)
- **Testing Guide:** [stripe.com/docs/testing](https://stripe.com/docs/testing)

---
*Este documento deve ser atualizado caso novos meios de pagamento sejam adicionados.*
