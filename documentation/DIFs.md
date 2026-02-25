# Diferenças entre Especificação e Implementação: IndieFlow

Este documento detalha as discrepâncias encontradas entre o documento de especificação (`documentation/SaaS_jogo_exemplo.txt`) e a implementação atual do projeto.

---

## Módulo 1: Core de Governança e Multi-Projetos

### 1.1. Algoritmo "Next Step"
*   **Especificação**: Deve analisar qual área tem **menos tarefas concluídas** e destacar a **tarefa mais antiga** dessa área.
*   **Implementação**: Atualmente seleciona a área com o **maior número de tarefas em "A fazer" (TODO)**. Não há lógica implementada para destacar a tarefa mais antiga.
    *   *Arquivo relacionado*: `src/application/GetGovernanceUseCase.ts`

### 1.2. Monitor de Inércia
*   **Especificação**: Identificar tarefas paradas em "Doing" por mais de **7 dias**.
*   **Implementação**: O limite está configurado para **10 segundos** (provavelmente para fins de teste).
    *   *Arquivo relacionado*: `src/application/GetGovernanceUseCase.ts`

---

## Módulo 4: Ciclo de Vida do Jogo (Workflow Rígido)

### 4.2. Gate de Pendências (Soft-Gate)
*   **Especificação**: Ao mudar de fase, o sistema deve listar tarefas não concluídas e isolá-las na fase anterior.
*   **Implementação**: **Não implementado**. A transição de fase apenas atualiza o status do projeto. Não há verificação de tarefas pendentes nem isolamento de contexto.
    *   *Arquivos relacionados*: `src/application/TransitionPhaseUseCase.ts`, `src/components/PhaseTransitionModal.tsx`

---

## Resumo de Status

| Funcionalidade | Status | Observação |
| :--- | :--- | :--- |
| Algoritmo Next Step | ⚠️ Parcial | Lógica de priorização diverge da especificação. |
| Monitor de Inércia | ⚠️ Parcial | Threshold configurado para teste (10s). |
| Soft-Gate de Pendências | ❌ Não Implementado | |
