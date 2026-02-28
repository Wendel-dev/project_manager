# Definições e Checklist de Lançamento

Este documento condensa a análise do projeto e lista o que é essencial para um lançamento seguro e profissional.

## 1. Infraestrutura e Ambiente (Crítico)
- [ ] **Remover Hardcode de Ambiente**: No arquivo `src/index.ts`, o `process.env.NODE_ENV = "test"` está fixo. Isso impede o comportamento correto em produção (HMR ligado, logs de teste, etc).
- [ ] **Configuração de Variáveis de Ambiente**: Criar um arquivo `.env.example` listando todas as chaves necessárias (Firebase, Stripe, MySQL).
- [ ] **Sistema de Migrações**: Atualmente o banco de dados depende de execução manual do SQL. Implementar uma ferramenta de migração (ex: `Kysely`, `Prisma` ou scripts simples de migração) para garantir que o banco em produção esteja sincronizado.
- [ ] **Dockerização**: Criar um `Dockerfile` e `docker-compose.yml` para facilitar o deploy e garantir paridade entre ambientes.
- [ ] **Health Check**: Adicionar um endpoint `/api/health` para monitoramento de disponibilidade do servidor.

## 2. Segurança (Essencial)
- [ ] **CORS**: O servidor Bun em `src/index.ts` não possui configuração explícita de CORS. Isso pode causar problemas no frontend ou permitir acessos indevidos de outros domínios.
- [ ] **Rate Limiting**: Implementar um limitador de requisições para prevenir ataques de força bruta e DoS, especialmente em rotas de Auth e Document Parsing.
- [ ] **Validação de Input (Zod)**: Embora o `zod` esteja nas dependências, as rotas (ex: `ProjectRoutes.ts`) estão lendo o JSON diretamente (`await req.json()`) sem validar a estrutura. Isso pode causar crashes no servidor por dados malformados.
- [ ] **Headers de Segurança**: Adicionar headers como `X-Content-Type-Options`, `X-Frame-Options` e `Content-Security-Policy`.

## 3. SaaS e Negócio
- [ ] **Fluxo de Webhook Completo**: Garantir que o `HandlePaymentWebhookUseCase.ts` trate todos os estados da assinatura (atraso de pagamento, cancelamento pendente, etc).
- [ ] **Página de Erro 403 Customizada**: O frontend deve lidar graciosamente com o erro `LIMIT_EXCEEDED` retornado pelo backend quando o usuário atinge o limite de 1 projeto no plano free.
- [ ] **Termos de Uso e Privacidade**: Obrigatórios para qualquer app que processe pagamentos e dados de usuários (Firebase/Stripe).

## 4. Observabilidade e Robustez
- [ ] **Logs Centralizados**: Substituir `console.log` por um logger estruturado (ex: `pino` ou `winston`) para facilitar o rastreamento de erros em produção.
- [ ] **Error Boundary no Frontend**: Garantir que um erro em um componente não quebre a aplicação inteira para o usuário.
- [ ] **Tratamento de Erros HTTP**: Padronizar as respostas de erro no `HttpHandlers.ts` para que o frontend sempre receba um formato JSON consistente `{ error: string, code?: string }`.

## 5. Checklist de UI/UX
- [ ] **Favicon e Manifest**: Adicionar ícones e configurações de PWA/Web App.
- [ ] **Loading States**: Verificar se todas as chamadas de API (Upload de PDF, Checkout) possuem feedback visual de carregamento.
- [ ] **SEO**: Configurar meta tags básicas no `index.html`.

---
**Conclusão**: O projeto está em um estágio avançado de desenvolvimento (Beta), mas as falhas em **Segurança (CORS/Rate Limit)** e **Infra (Hardcoded Env/Migrations)** são os principais bloqueadores para um lançamento estável.
