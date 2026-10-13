# Plano de homologação isolada — importação histórica PNAE/MT 2025

**Data:** 2026-10-12 · **Natureza:** PLANO. **Nada abaixo foi executado nesta etapa.**
Esta execução fez somente análises e testes **sem escrita no banco ativo**.

Este plano descreve como, numa **futura etapa autorizada**, homologar a importação num
**banco temporário isolado**, sem tocar o banco ativo (`merenda_pnae`) e sem tocar as
chamadas de 2026.

---

## 0. Pré-condições (obrigatórias antes de qualquer passo)

1. **Autorização explícita** por escrito do responsável técnico/administrativo.
2. **Escopo congelado:** os 51 editais aprovados (ver `MATRIZ_PENDENCIAS_2025.md` §3).
3. **Decisões administrativas pendentes registradas** (podem ficar `null`, mas devem estar
   cientes): entidade executora (CNPJ SEDUC), `025/224` → `025/2024`, 597 divergências.
4. **Backup do banco ativo** (`mysqldump`) — mesmo que a homologação use outro banco.
5. Ambiente de execução com as dependências já presentes no repositório
   (`@prisma/client` 5.7.0, `jest`, `supertest`). **Nenhuma instalação nova.**

> **Não há docker-compose nem Dockerfile** no repositório (verificado). O banco temporário
> deve ser um **schema MySQL separado** no mesmo servidor local, ou um container criado
> manualmente fora do repositório. **Nenhuma dessas opções foi criada nesta etapa.**

## 1. Criação do ambiente isolado (não executado)

Definir um `DATABASE_URL` **novo**, apontando para um schema que **não** seja `merenda_pnae`:

```
DATABASE_URL_HOMOLOGACAO="mysql://root:@localhost:3306/merenda_pnae_homolog_2025?charset=utf8mb4"
```

Regras:

- Nome **propositalmente distinto** do ativo (`merenda_pnae_homolog_2025`).
- O `.env` **atual** (com `merenda_pnae`) **não pode ser reescrito**; o valor deve ser
  passado por variável de ambiente **na sessão de homologação**, nunca gravado em arquivo versionado.
- **Proibido:** `prisma migrate reset` (em qualquer banco); seeds destrutivos.

## 2. Restauração de backup em banco temporário (não executado)

Duas opções, conforme disponibilidade:

- **Opção A (preferencial, mais fiel):** `mysqldump` do banco ativo → restaurar no schema
  temporário. Garante os mesmos dados (incluindo as 6 chamadas de 2026 e os 3 editais).
- **Opção B (mais leve):** schema vazio + `prisma migrate deploy` + `seed:test.ts` /
  `seed-reference.ts` (já existentes em `apps\backend\prisma\`). Reproduz a estrutura sem
  os dados reais de produção.

**Critério de aceite:** o schema temporário sobe e responde a `SELECT` sem erro.

## 3. Migrações autorizadas (não executado)

Se (e somente se) a migração de unicidade for aprovada (`ANALISE_MIGRACAO_UNICIDADE.md`):

1. Rodar `analisar-unicidade-readonly.js` **no banco temporário** e confirmar
   `colisões (dreId,numero,exercicio) = 0`.
2. Aplicar a troca de índice descrita em `ANALISE_MIGRACAO_UNICIDADE.md` §7, **sempre
   acompanhada** dos ajustes de código §5.1 (`chamadas-publicas.service.ts`) e §5.2
   (`simulador-importacao.ts`) — sem eles a migração não produz efeito prático.
3. Verificar o índice resultante via `SHOW INDEX`.

**Nenhuma migração é aplicada ao banco ativo nesta etapa.**

## 4. Teste da importação real (não executado)

Hoje o comando `aplicar` é um **placeholder bloqueado** (`exit 3`). Para homologar, seria
necessária uma implementação que, **reutilizando os services existentes**
(`importador-editais` / `chamadas-publicas`), consuma o `staging/` e o plano do dry-run.

Checklist do teste real (banco temporário):

- [ ] Importar os **51** editais aprovados.
- [ ] Conferir `ChamadaPublica` = 51 novas (mais as pré-existentes, se Opção A).
- [ ] Conferir `EditalItem` ≈ 2652 (itens) e `EditalDocumento` = 54.
- [ ] Conferir que `entidadeExecutoraId` permanece `null` onde a pendência não foi resolvida
      (nunca preenchido por inferência).
- [ ] Conferir que `numero` de `ED-0067` segue a decisão administrativa sobre `025/224`.

## 5. Validação de idempotência (não executado)

- Rodar a importação **uma segunda vez** no mesmo banco temporário.
- **Critério de aceite:** `novosCandidatos = 0`, `jaExistente = 51`; **nenhum registro
  duplicado** (contar `ChamadaPublica` por `(dreId, numero, exercicio)` = 1 cada).
- Confirmar que `IdempotenciaOperacao` registra uma entrada por operação e que a segunda
  execução as reconhece.

## 6. Confirmação de integridade referencial (não executado)

- Nenhuma `ChamadaPublica` órfã: `editalId` sempre presente e válido (`onDelete: Restrict`).
- `dreId` e `municipioId` sempre nulos **ou** apontando para DRE/Município existentes.
- `EditalItem` sempre ligado a um `Edital` existente.
- Rodar consulta de sanidade: contagem de FKs quebradas = 0.

## 7. Verificação de preservação dos registros de 2026 (não executado)

Antes e depois da importação no banco temporário:

- Contar `ChamadaPublica` com `exercicio = 2026` → deve ser **igual** ao valor inicial (**6**).
- Conferir que as 6 têm `status`, `numero` e `createdAt` **inalterados**.
- Conferir `Edital` de 2026 (1) inalterado.
- Conferir que nenhum registro recebe `UPDATE` (o plano só produz `CREATE`).

> O **banco ativo** deve passar pela mesma verificação ao final, para provar que ficou
> intacto (§9).

## 8. Validação de RBAC e permissões administrativas (não executado)

O módulo novo é biblioteca pura (sem HTTP), então o RBAC real é o do backend existente:

- [ ] Confirmar que **`aplicar` exige papel autorizado** (guard JWT + `ADMIN`/papel
      equivalente) — hoje essa exigência é imposta pela camada de aplicação, não testada
      unitariamente (lacuna registrada em `TESTES_IMPORTACAO_PNAE_2025.md` §3.9).
- [ ] Tentar executar a importação com usuário **não autorizado** → deve ser **recusado
      antes de qualquer escrita**.
- [ ] Confirmar registro em `AuditLog` das operações administrativas (mecanismo existente).
- [ ] Confirmar que perfis `DRE`/`ESCOLA` **não** conseguem disparar a importação.

## 9. Verificação final do banco ativo (não executado)

Ao fim da homologação, rodar `analisar-unicidade-readonly.js` **contra o banco ativo** e
conferir que **nada mudou**: 6 chamadas (todas 2026), 3 editais, mesmos índices.

## 10. Rollback

- **Banco temporário:** descartar o schema `merenda_pnae_homolog_2025` (não afeta nada).
- **Migração de índice:** recriar o índice anterior (`ANALISE_MIGRACAO_UNICIDADE.md` §7).
- **Banco ativo:** restaurar do `mysqldump` do §0.4 (contingência; não deve ser necessário,
  pois o ativo não é escrito).

## 11. Responsáveis e aprovação

| Etapa | Responsável | Aprovação |
| --- | --- | --- |
| Autorização da homologação | — | **pendente** |
| Decisão sobre migração de unicidade | — | **pendente** |
| Decisão sobre `025/224` e entidade executora | — | **pendente** |
| Execução | — | não iniciada |

**Não iniciar a importação definitiva sem autorização explícita.**
