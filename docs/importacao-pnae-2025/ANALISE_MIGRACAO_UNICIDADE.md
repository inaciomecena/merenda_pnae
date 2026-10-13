# Análise da migração de unicidade — `ChamadaPublica`

**Data:** 2026-10-12 · **Natureza:** avaliação técnica. **Schema NÃO foi alterado.
Nenhuma migração foi gerada ou aplicada.**

## 1. Contexto e proposta

O model `ChamadaPublica` (`apps\backend\prisma\schema.prisma`, linhas 2139–2181) declara:

```prisma
@@unique([numero, exercicio])     // linha 2176
@@map("pnae_chamadas_publicas")
```

**Proposta:** trocar para

```prisma
@@unique([dreId, numero, exercicio])
```

**Motivo:** a importação histórica insere 51 chamadas de 2025 de **DREs diferentes** que
podem reutilizar o mesmo `numero` (numeração local por DRE). Com a unique atual
`(numero, exercicio)`, duas DREs com a chamada `020/2025` **colidiriam** e a segunda
falharia.

## 2. Estado real do banco (evidência — consulta somente-leitura)

Via `scripts/analisar-unicidade-readonly.js`:

| Verificação | Resultado |
| --- | --- |
| `ChamadaPublica` totais | **6** |
| Exercício das 6 | **todas 2026** |
| `numero` das 6 | `E2E-<timestamp>` (fixtures de teste E2E) |
| `dreId` das 6 | **todas NULL** |
| `status` das 6 | todas `HOMOLOGADA` |
| Colisões hoje `(numero, exercicio)` | **0** |
| Colisões hoje `(dreId, numero, exercicio)` | **0** |
| `(numero, exercicio)` presentes em >1 DRE | **0** |
| `Edital` totais | 3 (2 de 2025, 1 de 2026) |

Índices reais da tabela (extração via `SHOW INDEX`):

```
pnae_chamadas_publicas_numero_exercicio_key  (numero, exercicio)          UNIQUE
pnae_chamadas_publicas_editalId_idx          (editalId)
pnae_chamadas_publicas_dreId_municipioId_idx (dreId, municipioId)
pnae_chamadas_publicas_status_inscricoesFim_idx (status, inscricoesFim)
+ PRIMARY (id) e duas FKs
```

## 3. Compatibilidade com registros existentes

**A proposta é compatível com os dados atuais.** As 6 linhas existentes têm `dreId = NULL`
e `exercicio = 2026`; nenhuma delas disputa `(numero, exercicio)` com outra, e a 51ª
chamada de 2025 a ser importada traz `exercicio = 2025` (diferente de 2026) e `dreId`
preenchido. **Não há nenhuma colisão a resolver antes da migração** — ou seja, a migração
poderia ser aplicada sem nenhum `UPDATE` de saneamento prévio.

### 3.1 Ponto técnico crítico — `dreId` é anulável

`dreId String?` (linha 2146). Em **MySQL, um índice UNIQUE não impede duplicidade quando
a coluna é `NULL`** (`NULL != NULL`). Consequências:

- Com a proposta, duas linhas com `dreId = NULL` e **mesmo** `(numero, exercicio)` seriam
  **permitidas** — a unicidade só valeria para linhas com `dreId` preenchido.
- As 6 fixtures E2E (todas `dreId = NULL`) continuariam protegidas apenas pelo acaso de
  seus `numero` serem únicos, **não** pelo índice.
- Se a intenção for garantir unicidade também quando não há DRE, a proposta **sozinha não
  basta**. Alternativas a decidir administrativamente:
  1. aceitar o comportamento (unicidade efetiva só com DRE) — mais simples;
  2. tornar `dreId` obrigatório (`String`) — mudança de semântica maior, exige backfill;
  3. manter dois índices: o composto novo **e** um fallback para `(numero, exercicio)`
     apenas onde `dreId IS NULL` (MySQL não permite `UNIQUE … WHERE`; exigiria coluna
     gerada ou trigger — **desproporcional** para este caso).

**Recomendação:** opção 1 (aceitar), registrando explicitamente que a unicidade passa a
ser **por DRE**. Ela atende o caso de uso da importação e é a de menor impacto.

## 4. Colisões de dados (simulação com o staging)

Rodando o plano sobre o banco atual: **0 colisões**. Mesmo sob a regra **mais restritiva**
atual `(numero, exercicio)`, os 51 candidatos não colidem entre si nem com as 6 existentes
(o dry-run apurou `jaExistente = 0`). A proposta **amplia** a permissividade (libertaria
mesmo `numero` em DREs distintas), não a restringe — logo **não introduz risco de colisão
com dados existentes**.

## 5. Dependências em services, queries e relacionamentos

A mudança **não é só de schema**. Há **três pontos de código** que assumem a unicidade
global `(numero, exercicio)` e precisariam mudar junto (fora do escopo desta etapa —
apenas mapeados):

### 5.1 `chamadas-publicas.service.ts` — validação global (impacto direto)

`apps\backend\src\modules\chamadas-publicas\application\chamadas-publicas.service.ts`,
método `criar` (linha 16):

```ts
if (await this.prisma.chamadaPublica.findFirst({ where: { numero: dto.numero, exercicio: dto.exercicio } }))
  throw new ConflictException('Numero ja utilizado');
```

Essa checagem é **global** (ignora `dreId`). Mesmo após a migração, ela **recusaria** a
segunda chamada de mesmo `numero` em DRE diferente — a mudança de schema **não teria
efeito prático** sem ajustar esta query para incluir `dreId` no `where`. **Dependência
obrigatória.**

> Observação: a validação atual é uma **corrida** (`findFirst` fora de transação com o
> `create`); o índice único é quem realmente garante a invariante. Reforça a importância
> de alinhar schema + service.

### 5.2 `simulador-importacao.ts` — chave de idempotência do plano

`apps\backend\src\modules\importacao-historica\aplicacao\simulador-importacao.ts`:

- `chaveChamada(numero, exercicio)` (linha 85) define a chave de "já existe" como
  `numero|exercicio` **sem DRE**.
- Consequência: com a proposta aplicada, dois candidatos de DREs diferentes com o mesmo
  `numero` seriam tratados pelo simulador como **"já existente"** (o segundo seria
  descartado do plano), quando na verdade seriam **dois registros legítimos distintos**.

**A chave de idempotência/simulação precisa passar a ser `(dreId, numero, exercicio)`**
para refletir a nova regra. Sem isso, o dry-run **subestimaria** o número de criações.

### 5.3 Relacionamentos e leitura

- `dre DRE? @relation(... onDelete: Restrict)` — a proposta **não altera** FKs; `Restrict`
  permanece. Nenhum impacto.
- Queries de listagem/escopo (`scope()` por papel, linhas 13–15 do service) já filtram por
  `dreId` quando o papel é `DRE` — **compatíveis** com a nova regra, nada a mudar.
- `contratos.service.ts` (linhas 446, 749) apenas **lê** `chamadaPublica.numero` para
  exibição; não depende da unicidade.

## 6. Impacto em chamadas públicas de 2026

- As 6 chamadas existentes são **todas de 2026**, com `dreId = NULL` e `numero` E2E.
- Sob a proposta, elas continuam **intocadas e válidas**: `dreId NULL` não conflita com
  nada, e `exercicio 2026` as separa das importações de 2025.
- **Nenhum registro de 2026 é afetado, alterado ou removido.**
- Risco residual (aceito, §3.1): se no futuro duas chamadas de 2026 forem criadas com
  `dreId = NULL` e mesmo `numero`, a unique nova não as impediria. Hoje isso não ocorre
  (6 `numero` distintos). Mitigação: o service (§5.1) continuaria validando por `numero`,
  ainda que de forma global.

## 7. Plano de migração (NÃO APLICADO — para etapa autorizada futura)

Somente com autorização explícita, em **ambiente isolado**, após **backup**:

1. **Backup:** `mysqldump` completo do banco alvo.
2. **Pré-checagem (read-only):** rodar `analisar-unicidade-readonly.js` no alvo e confirmar
   `colisões (dreId,numero,exercicio) = 0` e `dreId NULL` de eventuais fixtures.
3. **Migração Prisma:** `prisma migrate dev --name chamada_publica_uniquidade_por_dre`
   gerando **apenas**:
   ```sql
   DROP INDEX `pnae_chamadas_publicas_numero_exercicio_key` ON `pnae_chamadas_publicas`;
   CREATE UNIQUE INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key`
     ON `pnae_chamadas_publicas`(`dreId`, `numero`, `exercicio`);
   ```
   (nome exato do índice novo a ser definido pelo Prisma).
4. **Código (mesma mudança, mesma PR):** ajustar §5.1 (`where` com `dreId`) e §5.2
   (`chaveChamada` com `dreId`) — sem isso a migração é inóqua ou induz a erro.
5. **Verificação:** rodar testes (suíte completa) + dry-run e conferir `novosCandidatos = 51`.

**Rollback:** a operação é **reversível por índice**:

```sql
DROP INDEX `pnae_chamadas_publicas_dreId_numero_exercicio_key` ON `pnae_chamadas_publicas`;
CREATE UNIQUE INDEX `pnae_chamadas_publicas_numero_exercicio_key`
  ON `pnae_chamadas_publicas`(`numero`, `exercicio`);
```

Como **nenhum dado é migrado** (só troca de índice), o rollback não exige restaurar
dados — basta recriar o índice antigo. Restauração de backup fica como plano de contingência
caso o `CREATE UNIQUE` falhe por colisão não prevista (não é o caso hoje: 0 colisões).

## 8. Conclusão

| Critério | Veredito |
| --- | --- |
| Compatível com dados existentes? | **Sim** — 0 colisões; 6 linhas atuais não conflitam. |
| Risco de colisão de dados? | **Nenhum novo** — a proposta só amplia permissividade. |
| É só schema? | **Não** — exige ajuste em §5.1 (service) e §5.2 (simulador), senão não produz efeito prático. |
| Afeta chamadas de 2026? | **Não** — preservadas; `dreId NULL` + `exercicio 2026` as isolam. |
| Precisa migração? | **Sim** (troca de índice), reversível, sem migração de dados. |
| Precisa rollback? | Simples (recriar índice anterior); backup como contingência. |
| Aplicada nesta etapa? | **NÃO.** Proposta apenas. |

**Recomendação final:** prosseguir com a proposta **somente** na etapa de homologação
autorizada, **sempre acompanhada** dos ajustes de código §5.1 e §5.2, e com a decisão
explícita sobre o item §3.1 (`dreId` anulável).
