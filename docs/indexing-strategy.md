cat > /home/20017696/pedro/elasticsearch-platform/docs/indexing-strategy.md << 'EOF'
# Estratégia de Indexação Elasticsearch
**Projeto:** Elasticsearch Platform  
**Autor:** Pedro  
**Status:** Planejamento Estratégico  
**Data:** Julho 2026

---

## 1. Contexto do Projeto

### Situação Atual
- **1.3M+ documentos** de vagas de emprego em arquivo CSV
- Ambiente Elasticsearch já configurado (via Docker Compose)
- API de busca funcionando, mas sem dados indexados
- Processo manual anterior: criação de índice e upload via Kibana UI

### Problema
A abordagem manual via Kibana não é:
- **Reproducível** - impossível recriar ambiente do zero automaticamente
- **Versionável** - mappings não estão no código
- **Escalável** - não suporta volumes grandes nem atualizações incrementais
- **Evolutiva** - mudanças no mapping requerem trabalho manual e downtime

### Objetivo
Construir um **Motor de Indexação Evolutivo** que permite:
1. Indexar volumes massivos (milhões de documentos, GBs de dados)
2. Automatizar 100% do processo (reproducibilidade total)
3. Versionar configurações de índice como código
4. Suportar migração futura para banco de dados (PostgreSQL)
5. Preparar base para evoluções sem downtime

---

## 2. Visão Estratégica: Arquitetura em 3 Fases

### Por que 3 Fases?

A implementação é dividida em fases para:
- **Entregar valor incremental** - cada fase resolve um problema real
- **Evitar overengineering** - não construir o que não é necessário agora
- **Facilitar aprendizado** - complexidade cresce gradualmente
- **Reduzir risco** - validar cada etapa antes da próxima

### Mapa das Fases
FASE 1: CSV → Elasticsearch        FASE 2: PostgreSQL Sync         FASE 3: Zero Downtime ─────────────────────────          ───────────────────────         ────────────────────── Objetivo: Indexar dados HOJE       Objetivo: Fonte dinâmica        Objetivo: Evoluir produção
┌──────────┐                       ┌──────────┐                    ┌──────────┐ │ data.csv │                       │PostgreSQL│                    │  jobs-v1 │ └────┬─────┘                       └────┬─────┘                    │  jobs-v2 │      │ bulk                             │ incremental              └────┬─────┘      ▼                                  ▼                               │ alias swap   jobs-v1                            jobs-v1                            ▼   (alias: jobs)                      (alias: jobs)                  zero downtime

---

## 3. FASE 1 - Fundação: Bulk Indexing

### Objetivo Principal
✅ **Indexar os 1.3M documentos do CSV de forma automatizada e otimizada**

### O Que Será Construído

#### 3.1. Aplicação CLI "Indexer"
Uma ferramenta de linha de comando (`apps/indexer`) com funções específicas:

**Comandos principais:**
- `create` - Criar índice com mapping e alias
- `bulk` - Indexar arquivo CSV/JSON em lotes
- `status` - Ver progresso e estatísticas
- `destroy` - Deletar índice (apenas desenvolvimento)

**Por que CLI?**
- Automação via scripts
- Integração com CI/CD no futuro
- Facilita debugging (execução manual)
- Logs estruturados

#### 3.2. Definições de Índice como Código
Criar biblioteca (`libs/search-index/`) contendo:

**Mapping (Schema)**
- Definição de todos os campos (`job_title`, `company`, etc)
- Tipos de dados (text, keyword, date, boolean)
- Configurações de análise (analyzers, tokenizers)

**Settings (Configurações)**
- Número de shards (partições de dados)
- Número de replicas (cópias para alta disponibilidade)
- Refresh interval (frequência de disponibilização de docs)
- Configurações de performance

**Alias (Nome Estável)**
- Nome usado pela aplicação: `jobs`
- Nome físico do índice: `jobs-v1`
- Permite trocar índice sem mudar código da API

**Por que como código?**
- Versionamento via Git
- Revisão de mudanças (pull requests)
- Documentação viva
- Reproducibilidade

#### 3.3. Pipeline de Indexação em Massa

**Desafio:** Indexar 1.3M+ documentos sem:
- Consumir toda a memória
- Sobrecarregar o cluster Elasticsearch
- Demorar horas

**Estratégia:**

**A) Streaming de Arquivo**
Ler CSV linha por linha, não carregar tudo na memória de uma vez.

**B) Processamento em Lotes (Batching)**
- Agrupar documentos em batches (ex: 5.000 por vez)
- Enviar batch para Elasticsearch via Bulk API
- Repetir até processar todo o arquivo

**C) Otimizações Temporárias**
Durante a indexação massiva:
- Desabilitar refresh automático (acelera 3-5x)
- Reduzir replicas para 0 (menos I/O)
- Restaurar configurações normais ao final

**D) Monitoramento de Progresso**
- Logs com quantidade indexada, porcentagem, docs/segundo
- Estimativa de tempo restante (ETA)
- Alertas em caso de erros

**Resultado esperado:**
- 1.3M documentos indexados em **10-15 minutos**
- Taxa de ~15K-25K documentos por segundo

#### 3.4. Bootstrap Automático

**Conceito:** Ambiente sobe sozinho do zero

**Implementação:**
1. Adicionar serviço no `docker-compose.yml`
2. Serviço executa comando `create` automaticamente
3. Se índice já existir, não faz nada (idempotente)
4. Se não existir, cria com mapping e alias

**Benefício:**
Qualquer desenvolvedor pode executar `docker compose up` e ter o ambiente completo funcionando.

#### 3.5. Estratégia de Aliases desde o Início

**Conceito Chave:** Aplicação nunca acessa índice físico diretamente

**Antes (ERRADO):**
API busca em: "jobs-v1" (índice físico)

**Depois (CORRETO):**
API busca em: "jobs" (alias)   ↓ "jobs" aponta para → "jobs-v1" (índice físico)

**Por que isso importa?**
- No futuro, podemos criar `jobs-v2` e trocar o alias
- API não precisa mudar nada
- Base para migrations sem downtime (FASE 3)

### Entregáveis da FASE 1

✅ CLI funcional com comandos básicos  
✅ Mappings e settings versionados no código  
✅ Indexação de 1.3M+ docs automatizada  
✅ Bootstrap integrado ao Docker Compose  
✅ Alias configurado desde o início  
✅ Documentação de uso

### Quando Implementar
**AGORA** - É a base de tudo

---

## 4. FASE 2 - Evolução: Sincronização Incremental

### Objetivo Principal
✅ **Migrar de CSV estático → PostgreSQL dinâmico como fonte da verdade**

### Contexto
CSV é limitado:
- Não permite atualizações incrementais
- Dificulta gestão de dados
- Não é fonte única da verdade

PostgreSQL oferece:
- Atualizações em tempo real
- Consultas complexas
- Transações ACID
- Melhor integração com aplicações

### O Que Será Construído

#### 4.1. Fonte da Verdade (Single Source of Truth)

**Conceito:**
PostgreSQL é a **fonte oficial** dos dados.
Elasticsearch é apenas um **índice de busca** (cache otimizado).

**Estrutura da Tabela:**
- Coluna `id` - chave primária única
- Coluna `updated_at` - timestamp da última modificação
- Demais colunas com dados do job posting

**Regra:**
1 linha na tabela = 1 documento no Elasticsearch

#### 4.2. Sincronização Baseada em Cursor

**Problema:**
Como detectar quais registros foram alterados desde a última sincronização?

**Solução: Cursor de Tempo**
1. Guardar timestamp da última sincronização
2. Buscar registros com `updated_at > último_cursor`
3. Fazer upsert no Elasticsearch
4. Atualizar cursor

**Exemplo de Fluxo:**
1.
Última sync: 2026-07-28 14:00:00
2.
Consultar: SELECT * FROM job_postings                WHERE updated_at > '2026-07-28 14:00:00'
3.
Retorna 150 registros modificados
4.
Indexar os 150 docs no Elasticsearch
5.
Atualizar cursor: 2026-07-28 14:05:23

**Características:**
- **Idempotente** - re-executar não duplica dados
- **Eficiente** - processa apenas o delta
- **Simples** - não requer ferramentas complexas (CDC, Kafka, etc)

#### 4.3. Overlap Window (Janela de Sobreposição)

**Problema:**
E se um registro for atualizado DURANTE a sincronização?

**Solução:**
Adicionar margem de segurança de 60 segundos:
Cursor salvo: 14:00:00 Buscar desde: 13:59:00 (cursor - 60s)

**Resultado:**
Documentos processados mais de uma vez (idempotente), mas nada é perdido.

#### 4.4. Worker de Sincronização

**Conceito:**
Processo que roda periodicamente (ex: a cada 60 segundos) executando:
1. Ler cursor
2. Buscar delta do PostgreSQL
3. Indexar no Elasticsearch
4. Atualizar cursor

**Modos de Operação:**
- **Manual** - executar sync via CLI quando necessário
- **Worker** - processo contínuo executando em loop
- **Cron** - agendamento via sistema operacional

#### 4.5. Gerenciamento do Estado do Cursor

**Onde salvar o cursor?**

**Opção escolhida:** Índice especial no próprio Elasticsearch (`.sync-state`)

**Estrutura:**
Índice: .sync-state Documento ID: "jobs" Conteúdo:
•
last_synced_at: "2026-07-28T14:05:23Z"
•
documents_synced: 1300000
•
status: "idle" | "syncing" | "error"

**Vantagens:**
- Não adiciona dependência externa (Redis, outro DB)
- Cursor fica junto dos dados
- Backup do cluster já inclui estado

#### 4.6. Transformação de Dados

**Conceito:**
Schema do PostgreSQL pode ser diferente do Elasticsearch.

**Necessário:**
Camada de transformação que converte:
PostgreSQL Row → Elasticsearch Document

**Exemplos:**
- Concatenar campos
- Formatar datas
- Normalizar strings
- Enriquecer com metadados

### Entregáveis da FASE 2

✅ PostgreSQL configurado no Docker Compose  
✅ Tabela `job_postings` com `id` e `updated_at`  
✅ Migração de dados CSV → PostgreSQL  
✅ Worker de sincronização incremental  
✅ Gerenciamento de cursor no `.sync-state`  
✅ Idempotência garantida  
✅ Logs de progresso e status

### Quando Implementar
**Depois da FASE 1** - quando CSV se tornar limitação real

---

## 5. FASE 3 - Maturidade: Migrations Sem Downtime

### Objetivo Principal
✅ **Evoluir mappings e configurações sem parar o serviço de busca**

### Contexto
Em produção, você precisará:
- Adicionar novos campos ao mapping
- Mudar analyzer de um campo existente
- Alterar configurações de performance
- Reindexar milhões de documentos

**Problema:**
Elasticsearch não permite alterar mapping de campo existente diretamente.

**Solução Tradicional (COM downtime):**
1. Parar aplicação
2. Deletar índice
3. Recriar com novo mapping
4. Reindexar dados
5. Religar aplicação

❌ **Inaceitável em produção**

### Solução: Alias Swap Pattern

#### 5.1. Arquitetura de Versionamento

**Conceito:**
Múltiplas versões do índice podem coexistir:
- `jobs-v1` - versão atual em produção
- `jobs-v2` - nova versão sendo preparada
- `jobs-v3` - versão futura

**Alias "jobs" sempre aponta para a versão ativa**

#### 5.2. Fluxo de Migração

**ETAPA 1: Preparação**
- Validar saúde do cluster
- Verificar espaço em disco disponível
- Calcular tamanho estimado da nova versão

**ETAPA 2: Criar Nova Versão**
- Criar índice `jobs-v2` com novo mapping
- Aplicar otimizações temporárias (replicas=0, refresh=-1)

**ETAPA 3: Copiar Dados**
- Usar Reindex API do Elasticsearch
- Copiar todos os documentos de `jobs-v1` → `jobs-v2`
- Monitorar progresso (Tasks API)

**ETAPA 4: Sincronização Final (Catch-up)**
- Durante o reindex, dados podem ter sido atualizados
- Buscar delta do PostgreSQL desde início do reindex
- Indexar documentos modificados/novos no `jobs-v2`

**ETAPA 5: Validação**
- Comparar contagem de documentos (v1 vs v2)
- Amostrar documentos aleatórios e comparar
- Garantir integridade dos dados

**ETAPA 6: Troca Atômica (SWAP)**
**Momento crítico:** Operação única e instantânea
Antes:  "jobs" → "jobs-v1" Depois: "jobs" → "jobs-v2"

**Elasticsearch garante:**
- Operação atômica (tudo ou nada)
- Sem requests perdidos
- Zero downtime

**ETAPA 7: Restaurar Configurações**
- Reativar replicas
- Reativar refresh normal
- Forçar merge de segmentos (otimização)

**ETAPA 8: Validação Pós-Migração**
- Monitorar logs da aplicação
- Verificar latência de queries
- Confirmar que tudo funciona

#### 5.3. Plano de Rollback

**Se algo der errado:**

**Rollback Instantâneo:**
Trocar alias de volta:
"jobs" → "jobs-v1"

**Vantagens:**
- Versão antiga (`jobs-v1`) continua existindo
- Rollback leva segundos
- Dados não são perdidos

**Política de Retenção:**
Manter apenas 2 versões:
- Versão ativa (vN)
- Versão anterior (vN-1) para rollback

Deletar versões antigas (vN-2, vN-3...) para liberar espaço.

### Entregáveis da FASE 3

✅ Engine de migração automatizada  
✅ Reindex com monitoramento de progresso  
✅ Catch-up sync para garantir zero perda  
✅ Validação de integridade automatizada  
✅ Swap atômico de alias testado  
✅ Rollback documentado e testado  
✅ Política de limpeza de versões antigas  
✅ Runbook de operação

### Quando Implementar
**Quando houver produção real** - não antes

---

## 6. Decisões de Arquitetura (ADRs)

### ADR-001: Por que Aliases desde a FASE 1?

**Pergunta:**
Podemos criar índice direto (`jobs`) na FASE 1 e adicionar aliases depois?

**Decisão:** ❌ NÃO
Usar aliases (`jobs` → `jobs-v1`) desde o início.

**Justificativa:**
- Custo de implementar agora: praticamente zero
- Custo de migrar depois: alto (mudar código da API, reindexar)
- Flexibilidade futura: essencial para FASE 3
- Best practice: indústria recomenda sempre usar aliases

**Implicação:**
Aplicação SEMPRE busca em `jobs` (alias), NUNCA em `jobs-v1` (índice físico).

---

### ADR-002: Por que Cursor com `updated_at` e não CDC?

**Pergunta:**
Por que não usar Change Data Capture (Debezium, CDC nativo) para sincronizar PostgreSQL?

**Decisão:** ❌ NÃO (por enquanto)
Usar cursor simples baseado em `updated_at`.

**Justificativa:**
- **Simplicidade** - CDC adiciona complexidade significativa
- **Infraestrutura** - CDC requer Kafka, Zookeeper, etc
- **Overkill** - Para 1.3M docs, cursor resolve bem
- **Aprendizado** - Melhor entender bases antes de adicionar camadas

**Quando reconsiderar:**
- Volume > 10M documentos
- Necessidade de latência < 1 segundo
- Múltiplas aplicações consumindo mudanças

---

### ADR-003: Por que Reindex API e não Scroll + Bulk Manual?

**Pergunta:**
Na FASE 3, por que usar `_reindex` API nativa vs fazer scroll + bulk manualmente?

**Decisão:** ✅ SIM
Usar `_reindex` API do Elasticsearch.

**Justificativa:**
- **Performance** - Otimizada internamente pelo ES
- **Confiabilidade** - Mecanismo battle-tested
- **Menos código** - Reduz superfície de bugs
- **Progress tracking** - Tasks API fornece progresso

**Quando usar alternativa:**
Se precisar transformações complexas durante cópia (casos raros).

---

### ADR-004: Onde Armazenar Estado do Cursor?

**Opções consideradas:**
1. Elasticsearch (índice `.sync-state`)
2. PostgreSQL (tabela `sync_state`)
3. Redis
4. Arquivo JSON

**Decisão:** ✅ Opção 1
Elasticsearch (índice especial)

**Justificativa:**
- Coloca estado junto dos dados
- Backup do cluster já inclui cursor
- Não adiciona dependência externa
- Simples de implementar

**Alternativa viável:**
PostgreSQL (opção 2) também é válida se preferir estado no banco.

---

## 7. Estimativas e Dimensionamento

### Hardware de Referência
- Elasticsearch: 3 shards, 16GB RAM, SSD
- PostgreSQL: Standard, 8GB RAM, SSD
- Rede: Gigabit (1 Gbps)

### FASE 1 - Bulk Indexing
**Input:** 1.3M documentos, ~3GB total

**Estimativas:**
- **Throughput:** 15.000 - 25.000 docs/segundo
- **Tempo total:** 10-15 minutos
- **CPU:** Pico 60-80% no Elasticsearch
- **I/O:** Pico 200-300 MB/segundo
- **Memória:** Heap 4-6GB durante indexação

### FASE 2 - Incremental Sync
**Cenário:** 10.000 updates por hora no PostgreSQL

**Configuração:**
- Worker executando a cada 60 segundos
- Batch size: 5.000 documentos

**Estimativas:**
- **Docs por sync:** ~170 (média)
- **Tempo de sync:** 2-5 segundos
- **Latência end-to-end:** < 90 segundos
- **Overhead no PostgreSQL:** < 1% CPU

### FASE 3 - Migration
**Cenário:** Migrar 1.3M docs de `jobs-v1` → `jobs-v2`

**Estimativas:**
- **Reindex:** 5-8 minutos
- **Catch-up sync:** 30 segundos
- **Validation:** 1 minuto
- **Swap de alias:** < 1 segundo
- **Downtime total:** **0 segundos**

---

## 8. Roadmap de Execução

### Sprint 1-2: FASE 1 - Foundation (2-3 semanas)

**Objetivo:** Indexar CSV e estabelecer base do projeto

**Entregas:**
- CLI indexer funcional
- Biblioteca `search-index` com definitions
- Comando `create` com bootstrap idempotente
- Comando `bulk` com batching e streaming
- Integração com Docker Compose
- Documentação de uso

**Critério de Sucesso:**
Executar `docker compose up` e ter 1.3M docs indexados automaticamente.

---

### Sprint 3-4: FASE 2 - PostgreSQL Sync (2-3 semanas)

**Objetivo:** Migrar fonte de CSV → PostgreSQL

**Entregas:**
- PostgreSQL no Docker Compose
- Schema `job_postings` com `updated_at`
- Migração de dados CSV → PostgreSQL
- Sync State Manager
- Worker incremental
- Transformação de documentos

**Critério de Sucesso:**
Atualizar registro no PostgreSQL e ver mudança no Elasticsearch em < 90 segundos.

---

### Sprint N (Futuro): FASE 3 - Migrations

**Objetivo:** Permitir evoluções sem downtime

**Pré-requisitos:**
- Aplicação em produção
- Necessidade real de mudar mapping

**Entregas:**
- Migration engine
- Reindex com progress tracking
- Catch-up sync
- Validação de integridade
- Comando de rollback
- Cleanup de versões antigas

**Critério de Sucesso:**
Mudar mapping em produção sem nenhum erro nas buscas da aplicação.

---

## 9. Gestão de Riscos

### Risco 1: Out of Memory Durante Bulk Indexing
**Probabilidade:** Média  
**Impacto:** Alto (processo trava)

**Mitigação:**
- Streaming de arquivo (não carregar tudo na memória)
- Batch size controlado (5K docs)
- Monitorar heap do Elasticsearch
- Circuit breaker configurado

---

### Risco 2: Perda de Dados em Falha de Sincronização
**Probabilidade:** Baixa  
**Impacto:** Alto (inconsistência de dados)

**Mitigação:**
- Idempotência (re-executar não duplica)
- Cursor só atualiza após confirmação de sucesso
- Overlap window de 60s
- Logs detalhados para auditoria

---

### Risco 3: Cluster Instável Durante Reindex (FASE 3)
**Probabilidade:** Média  
**Impacto:** Médio (latência elevada)

**Mitigação:**
- Preflight checks (saúde, espaço, etc)
- Throttling da Reindex API
- Executar em horário de baixo tráfego
- Rollback testado e documentado

---

### Risco 4: Divergência PostgreSQL vs Elasticsearch
**Probabilidade:** Média  
**Impacto:** Alto (dados incorretos nas buscas)

**Mitigação:**
- PostgreSQL é fonte da verdade (sempre prevalece)
- Validações de integridade automáticas
- Alertas de divergência
- Reindexação completa como último recurso

---

## 10. Métricas de Sucesso

### FASE 1
- ✅ 1.3M docs indexados em < 20 minutos
- ✅ Bootstrap 100% automático
- ✅ Zero intervenção manual necessária
- ✅ Mappings versionados no Git

### FASE 2
- ✅ Latência de sync < 90 segundos
- ✅ Zero perda de dados durante sync
- ✅ Idempotência comprovada (re-execuções seguras)
- ✅ Overhead no PostgreSQL < 5%

### FASE 3
- ✅ Migration com zero downtime
- ✅ Rollback funciona em < 10 segundos
- ✅ Zero requests perdidos durante swap
- ✅ Validação de integridade > 99.99%

---

## 11. Próximos Passos

### Imediato
1. ✅ Revisar e aprovar esta especificação
2. ⏳ Validar arquitetura com time (se aplicável)
3. ⏳ Definir prioridade de implementação

### Curto Prazo (Próximas 2-3 semanas)
1. ⏳ Implementar FASE 1 (CLI + Bulk Indexing)
2. ⏳ Testar com dataset de 1.3M docs
3. ⏳ Documentar processo

### Médio Prazo (1-2 meses)
1. ⏳ Avaliar necessidade da FASE 2
2. ⏳ Se necessário, implementar PostgreSQL sync

### Longo Prazo (quando houver produção)
1. ⏳ Implementar FASE 3 conforme necessidade

---

## 12. Glossário

**Alias** - Nome estável que aponta para um índice físico, permitindo trocar índices sem mudar código da aplicação.

**Bulk API** - API do Elasticsearch para indexar múltiplos documentos em uma única requisição HTTP.

**Cursor** - Timestamp que marca a posição da última sincronização, usado para buscar apenas registros novos/modificados.

**Index Template** - Template que define configurações padrão para índices criados automaticamente.

**Mapping** - Schema do índice, define tipos de campos e como são indexados/analisados.

**Reindex** - Processo de copiar documentos de um índice para outro, geralmente com novo mapping.

**Refresh** - Operação que torna documentos recém-indexados visíveis para buscas.

**Settings** - Configurações de um índice (shards, replicas, refresh interval, etc).

**Shard** - Partição horizontal de um índice, permite distribuir dados em múltiplos nodes.

**Single Source of Truth (SSOT)** - Fonte única e autoritativa dos dados, no caso o PostgreSQL.

**Zero Downtime** - Capacidade de fazer mudanças sem interrupção do serviço.

---

**Fim da Especificação**
EOF