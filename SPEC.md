# Especificação Técnica: Implementação de Assinatura SaaS (Modelo Recorrente)

Este documento detalha a implementação do sistema de assinaturas para o IndieFlow, focado exclusivamente no modelo recorrente (SaaS), com validação centralizada no MySQL.

## 1. Banco de Dados (Servidor - MySQL)

### Tabela de Assinaturas (Exclusivo MySQL)
- [ ] Criar a tabela `subscriptions` para gerenciar o acesso recorrente.
  ```sql
  CREATE TABLE subscriptions (
    id VARCHAR(255) PRIMARY KEY, -- ID da assinatura no Stripe (sub_...)
    user_id VARCHAR(255) NOT NULL,
    status ENUM('active', 'canceled', 'past_due', 'incomplete', 'trialing') NOT NULL,
    current_period_end DATETIME NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id)
  );
  ```

## 2. Backend (Assinaturas e Webhooks)

### Alterações em `src/Payment/application/interfaces/IPaymentProvider.ts`
- [ ] Alterar `CheckoutOptions` para aceitar `priceId` em vez de `amount`.
  ```typescript
  export interface CheckoutOptions {
    priceId: string; // ID do preço configurado no Stripe (ex: price_123...)
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }
  ```

### Alterações em `src/Payment/infrastructure/StripePaymentProvider.ts`
- [ ] Configurar `mode: 'subscription'` permanentemente.
- [ ] Usar o `priceId` fornecido para criar a sessão de checkout.
- [ ] Implementar `verifyWebhookSignature` para validar a autenticidade dos eventos.

### Alterações em `src/Payment/application/HandlePaymentWebhookUseCase.ts`
- [ ] Implementar lógica para os seguintes eventos críticos:
    - `checkout.session.completed`: Criar o registro inicial da assinatura no MySQL.
    - `invoice.payment_succeeded`: Atualizar a data `current_period_end` (renovação).
    - `customer.subscription.deleted`: Marcar status como `canceled` e remover acesso.
    - `customer.subscription.updated`: Atualizar status (ex: de `active` para `past_due` se o cartão falhar).

## 3. Segurança e Validação (MySQL)

### Novo Repositório: `src/Payment/infrastructure/persistence/MySQL/MySQLSubscriptionRepository.ts`
- [ ] Métodos: `save(sub)`, `updateStatus(id, status)`, `getByUserId(userId)`.

### Alterações em `src/Auth/application/GetSessionUseCase.ts`
- [ ] Integrar a consulta ao MySQL:
  ```typescript
  const subscription = await subscriptionRepository.getByUserId(user.id);
  user.isSubscribed = subscription?.status === 'active' && 
                      new Date(subscription.current_period_end) > new Date();
  ```

## 4. Frontend (UI e Gating)

### Alterações em `src/UI/infrastructure/PaymentApiService.ts`
- [ ] Criar método `createSubscription(priceId: string)` que redireciona para o checkout do Stripe.

### Alterações em `src/UI/App.tsx`
- [ ] Adicionar lógica de proteção: Se `user.isSubscribed` for falso, exibir a tela de planos ou um aviso de "Assinatura Expirada".

## 5. Fluxo de Execução Recomendado

1.  **Configuração Stripe**: Criar um Produto e um Preço Mensal no painel do Stripe.
2.  **Migração MySQL**: Criar a tabela `subscriptions`.
3.  **Core Backend**: Atualizar `StripePaymentProvider` para o modo subscription.
4.  **Webhooks**: Implementar o `HandlePaymentWebhookUseCase` injetando o repositório MySQL.
5.  **Validação**: Atualizar a rota `/api/auth/me` para retornar o status real do banco MySQL.
6.  **UI**: Implementar o botão "Assinar Agora" no Dashboard.
