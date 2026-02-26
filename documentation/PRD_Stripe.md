# PRD - Integração de Pagamentos com Stripe

## 1. Visão Geral
Este documento detalha a estratégia de implementação, testes e segurança para a integração do sistema de pagamentos utilizando o SDK da Stripe. O objetivo é fornecer uma base sólida para a escolha da melhor modalidade de implementação e garantir a integridade das transações.

## 2. Possibilidades de Implementação (SDK & Funcionalidades)

A Stripe oferece diversas formas de integração, dependendo do nível de controle e customização desejados:

### 2.1. Stripe Checkout (Low-Code)
- **O que é:** Uma página de pagamento hospedada pela Stripe.
- **Vantagens:** Implementação rápida, conformidade com PCI simplificada, suporte nativo a múltiplos métodos de pagamento (Apple Pay, Google Pay, etc.).
- **Uso:** Redirecionamento do usuário para a Stripe e retorno para o site após o sucesso.

### 2.2. Stripe Elements (Custom UI)
- **O que é:** Componentes de UI pré-construídos para criar formulários de pagamento personalizados no próprio site.
- **Vantagens:** Controle total sobre a experiência do usuário (UX) sem lidar diretamente com dados sensíveis de cartão (os dados são tokenizados nos servidores da Stripe).
- **Uso:** Integração via SDK de Frontend (ex: `@stripe/react-stripe-js`).

### 2.3. Stripe Payment Links (No-Code)
- **O que é:** URLs estáticas que levam a uma página de checkout.
- **Uso:** Ideal para vendas rápidas ou via redes sociais/e-mail, sem necessidade de backend complexo.

### 2.4. Assinaturas (Billing)
- **O que é:** Mecanismo para cobranças recorrentes.
- **Vantagens:** Gestão automática de faturas, períodos de teste (trials) e cancelamentos.

## 3. Estratégia de Testes

Garantir que a implementação funcione corretamente sem depender constantemente da API real é crucial para CI/CD e desenvolvimento ágil.

### 3.1. Verificação sem Chamadas para a API (Offline)
- **stripe-mock:** Servidor HTTP oficial da Stripe (Go-based) que simula a API. Pode ser rodado via Docker:
  ```bash
  docker run --rm -it -p 12111:12111 -p 12112:12112 stripe/stripe-mock
  ```
- **SDK-Level Mocking:** Utilizar frameworks como Jest para mockar as chamadas do cliente Stripe, retornando objetos JSON baseados nos exemplos da documentação oficial.

### 3.2. Testes de Webhooks (Offline e Local)
- **Stripe CLI:** Permite "escutar" e encaminhar webhooks para o ambiente local:
  ```bash
  stripe listen --forward-to localhost:3000/webhook
  ```
- **Construção Manual de Assinaturas:** É possível validar a lógica do seu handler de webhooks criando manualmente o cabeçalho `Stripe-Signature`. Isso permite testar a segurança sem disparar eventos reais na Stripe.

### 3.3. Ambiente de Teste (Test Mode)
- **Chaves de Teste:** Sempre utilize `sk_test_...` e `pk_test_...`.
- **Cartões de Teste:** Utilize os números de cartão fornecidos pela Stripe (ex: 4242 4242 4242 4242) para simular sucessos, falhas de autorização e erros de validação.

## 4. Segurança e Garantias

A segurança é o pilar central da integração de pagamentos.

### 4.1. Verificação de Assinatura de Webhooks (Crucial)
- **Mandatório:** Nunca confie em payloads de webhook sem verificar a assinatura criptográfica (`whsec_...`) usando o método `constructEvent` do SDK oficial.
- **Proteção contra Replay:** O SDK verifica o timestamp da assinatura; rejeite eventos mais antigos que 5 minutos.

### 4.2. Idempotência
- A Stripe pode enviar o mesmo webhook mais de uma vez. Implemente uma tabela de `processed_events` no seu banco de dados para evitar ações duplicadas (como entregar um produto duas vezes).

### 4.3. Confirmação Direta (Event Retrieval)
- Como camada extra de segurança, após receber um webhook, o backend pode realizar uma chamada GET direta para a Stripe (`stripe.events.retrieve(id)`) para confirmar que o evento é legítimo antes de processar a regra de negócio.

### 4.4. Gestão de Segredos
- **Nunca** inclua chaves secretas no código fonte. Utilize variáveis de ambiente (`.env`) e serviços de Secret Management.

## 5. Fontes e Documentação Oficial

- [Documentação Geral da Stripe](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Testing Stripe Integrations](https://stripe.com/docs/testing)
- [Stripe-Mock GitHub](https://github.com/stripe/stripe-mock)
- [Webhooks Signature Verification](https://stripe.com/docs/webhooks/signatures)
- [Stripe CLI Guide](https://stripe.com/docs/stripe-cli)
