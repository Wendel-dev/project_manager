# Especificação Técnica: Implementação de Assinatura SaaS e Limite de Projetos

Este documento detalha as tarefas necessárias para transformar o sistema de pagamentos atual em um modelo SaaS recorrente, com validação de limite de projetos (Freemium) realizada exclusivamente no servidor (MySQL).

## 1. Banco de Dados (Servidor - MySQL)

### 1.1. Nova Tabela de Assinaturas
- [ ] Criar a tabela `subscriptions` no MySQL (esta tabela NÃO deve existir no SQLite).
  ```sql
  CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY, -- ID da assinatura no Stripe (sub_...)
    user_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    status ENUM('active', 'canceled', 'past_due', 'incomplete', 'trialing') NOT NULL,
    current_period_end DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ```

### 1.2. Atualização do Repositório de Projetos
- [ ] Adicionar o método `countByUserId(userId: string): Promise<number>` na interface `IProjectRepository`.
- [ ] Implementar `countByUserId` no `MySQLProjectRepository.ts` usando `SELECT COUNT(*)`.

## 2. Backend (Lógica de Negócio e Segurança)

### 2.1. Novo Repositório de Assinatura
- [ ] Criar `ISubscriptionRepository.ts` em `src/Project/application/interfaces/`.
- [ ] Criar `MySQLSubscriptionRepository.ts` em `src/Project/infrastructure/persistence/MySQL/`.

### 2.2. Validação no `AddProjectUseCase.ts`
- [ ] Injetar `ISubscriptionRepository` no construtor.
- [ ] Implementar a validação antes da criação do projeto:
  1. Contar projetos atuais do usuário.
  2. Verificar se existe uma assinatura com status 'active' e `current_period_end` no futuro.
  3. Se `count >= 1` e não for assinante, lançar erro customizado.

### 2.3. Atualização do `StripePaymentProvider.ts`
- [ ] Alterar `createCheckoutSession` para:
    - Aceitar `priceId` (ID do plano no Stripe) em vez de `amount`.
    - Definir `mode: 'subscription'`.
- [ ] Configurar o webhook para lidar com `customer.subscription.updated` e `customer.subscription.deleted`.

## 3. Integração e API

### 3.1. Rota de Autenticação (`/api/auth/me`)
- [ ] Modificar o `GetSessionUseCase` ou a rota para incluir o campo `isSubscribed` no retorno do usuário, consultando o MySQL.

### 3.2. Tratamento de Erro na Rota de Projeto
- [ ] No `ProjectRoutes.ts`, capturar o erro de limite excedido e retornar Status 403 com um JSON contendo a mensagem e o link para a página de planos.

## 4. Frontend (UI)

### 4.1. Bloqueio Visual
- [ ] No `ProjectContext.tsx` ou `AuthContext.tsx`, expor o estado `isSubscribed`.
- [ ] No componente de criação de projeto, desabilitar o botão ou redirecionar para `/upgrade` se o usuário atingir o limite e não for assinante.

### 4.2. Página de Planos
- [ ] Criar uma tela simples exibindo o plano Pro e o botão "Assinar Agora" que chama o checkout do Stripe.

## 5. Ordem de Implementação Recomendada

1. **Infra MySQL**: Criar a tabela e o método de contagem no repositório.
2. **Subscription Core**: Criar o repositório de assinatura e o UseCase de verificação.
3. **Trava de Segurança**: Implementar a lógica no `AddProjectUseCase`.
4. **Fluxo de Checkout**: Atualizar o Stripe Provider para o modo assinatura.
5. **Webhooks**: Implementar a sincronização do status da assinatura.
6. **Frontend**: Refletir o status da assinatura na interface.
