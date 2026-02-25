# PRD: Estratégia de Autenticação e Segurança Evolutiva (IndieFlow)

## 1. Objetivo
Estabelecer uma infraestrutura de autenticação segura usando Firebase Auth no curto prazo, garantindo portabilidade total para Supabase (Self-hosted ou Cloud) no futuro.

## 2. Requisitos de Segurança (Baseados em OWASP/NIST)

### 2.1 Gerenciamento de Tokens e Sessão
- **Armazenamento:** Preferir o gerenciamento nativo do SDK do Firebase que utiliza IndexedDB (mais seguro que localStorage). Se o projeto escalar para dados sensíveis/financeiros, migrar para o padrão **BFF (Backend-for-Frontend)** com HttpOnly Cookies.
- **Rotação de Refresh Tokens:** O sistema deve delegar ao SDK do provedor a renovação automática de tokens (o Firebase faz isso a cada 1h por padrão).
- **Validação no Backend:** A API deve validar o JWT em todas as requisições protegidas. Não confie no `user_id` enviado puramente pelo frontend no corpo da requisição; extraia-o sempre do token validado.

### 2.2 Política de Identidade
- **Universal User Model:** Criar uma interface interna `AppUser` para desacoplar o objeto de usuário do provedor.
- **Identificadores:** Tratar o `id` do usuário como uma string opaca de comprimento variável.

## 3. Arquitetura Técnica

### 3.1 Camada de Abstração (Repository Pattern)
Deve existir uma interface `IAuthRepository` que defina os métodos:
- `signIn(email, password)`
- `signUp(email, password)`
- `signOut()`
- `onAuthStateChanged(callback)`
- `getIdToken()`

### 3.2 Fluxo de Migração (Firebase -> Supabase)
Para garantir que a migração ocorra sem que os usuários precisem resetar senhas:
1. **Exportação de Hashes:** Utilizar o Firebase Admin SDK ou CLI para exportar o `passwordHash` e `passwordSalt`.
2. **Configuração de Criptografia:** Salvar os parâmetros de hashing do Firebase (`base64_signer_key`, `rounds`, etc.) que serão injetados no Supabase Auth no momento da migração.
3. **Mapeamento de IDs:** Armazenar o antigo `firebase_uid` em um campo de metadados no Supabase para manter o histórico de auditoria.

## 4. Pontos de Atenção Imediata (Checklist)

- [ ] **Configuração do Firebase:** Habilitar apenas os provedores necessários e configurar o "Authorized Domains".
- [ ] **Sanitização de Erros:** Configurar o frontend para exibir mensagens de erro genéricas ("E-mail ou senha inválidos") para evitar enumeração de usuários (OWASP A07).
- [ ] **SQLite Schema:** Garantir que tabelas como `projects` e `tasks` tenham a coluna `owner_id` como `TEXT`.
- [ ] **Limitação de Taxa (Rate Limiting):** Embora o Firebase gerencie isso na nuvem, ao migrar para Supabase Auto-hospedado, será necessário configurar o Nginx/Kong para evitar ataques de força bruta.

## 5. Próximos Passos Sugeridos
1. Instalar o Firebase SDK (`npm install firebase`).
2. Implementar o `FirebaseAuthRepository.ts`.
3. Ajustar o `AuthContext.tsx` para usar o repositório em vez do Mock.
