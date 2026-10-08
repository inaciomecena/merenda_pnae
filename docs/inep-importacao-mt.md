# Importacao oficial INEP - Municipios e Escolas de MT

## Fonte oficial

A fonte principal e o portal oficial de microdados do Censo Escolar da Educacao Basica do Inep:

- https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar

O arquivo oficial deve ser baixado do portal do Inep e extraido localmente. A rotina espera o CSV de escolas/educacao basica contendo, no minimo, as colunas:

- `SG_UF`
- `CO_MUNICIPIO`
- `NO_MUNICIPIO`
- `CO_ENTIDADE`
- `NO_ENTIDADE`

Somente linhas com `SG_UF = MT` sao importadas.

## Backup antes da execucao

Antes de rodar a importacao real, gere backup logico do banco:

```powershell
mysqldump -h 127.0.0.1 -P 3306 -u sagae -p sagae_pnae > backups\sagae_pnae_antes_inep_mt.sql
```

Se o banco local estiver em outra porta, ajuste `-P`. Se estiver usando o `.env` atual do backend, confira antes:

```powershell
Get-Content apps\backend\.env
```

A rotina de importacao exige `--confirm-backup` para execucao real. Sem esse parametro, apenas `--dry-run` e permitido.

## Banco local sem Docker

O backend foi ajustado para usar MySQL local sem Docker:

```text
mysql://sagae:sagae123@127.0.0.1:3306/sagae_pnae?charset=utf8mb4
```

Com o MySQL local ativo, aplique a migration estrutural antes da importacao:

```powershell
cd apps\backend
npx prisma migrate deploy
npx prisma generate
```

## Simulacao

```powershell
npm run import:inep:mt -- --file="C:\caminho\microdados_ed_basica.csv" --dry-run
```

Por padrao o script le o CSV como `latin1`, formato comum nos microdados historicos do Inep. Para arquivo em UTF-8:

```powershell
npm run import:inep:mt -- --file="C:\caminho\microdados_ed_basica.csv" --dry-run --encoding=utf8
```

## Execucao real

Depois do backup:

```powershell
npm run import:inep:mt -- --file="C:\caminho\microdados_ed_basica.csv" --confirm-backup
```

## O que a rotina faz

- Normaliza nomes de municipios.
- Mantem `UF = MT`.
- Cria municipio se `CO_MUNICIPIO` ainda nao existir.
- Atualiza municipio existente por `CO_MUNICIPIO`.
- Consolida municipios duplicados por nome normalizado e UF.
- Move dependencias de municipio duplicado para o municipio canonico:
  - escolas;
  - produtores;
  - editais.
- Desativa duplicados com `deletedAt`, sem apagamento fisico.
- Cria escola por `CO_ENTIDADE`.
- Atualiza escola existente por `CO_ENTIDADE`.
- Corrige `municipioId` da escola conforme `CO_MUNICIPIO`.
- Desativa escolas ausentes da fonte oficial MT somente quando nao possuem editais ou matches vinculados.
- Ignora qualquer linha fora de MT.

## Logs

A cada execucao, a rotina imprime e grava um relatorio JSON em:

```text
docs/inep/import-report-*.json
```

O relatorio informa:

- municipios lidos;
- municipios criados;
- municipios atualizados;
- municipios duplicados desativados;
- escolas lidas;
- escolas criadas;
- escolas atualizadas;
- escolas ausentes da fonte oficial desativadas;
- vinculos corrigidos;
- inconsistencias encontradas.

## Validacoes no backend

As APIs de municipios e escolas passam a bloquear:

- municipio com UF diferente de `MT`;
- municipio duplicado por codigo IBGE;
- municipio duplicado por nome normalizado + UF;
- escola sem codigo INEP de 8 digitos;
- escola com codigo INEP duplicado;
- escola vinculada a municipio fora de MT.

## Observacoes

Municipios existentes fora de MT somente sao desativados automaticamente quando nao possuem dependencias. Se houver dependencias, a rotina registra inconsistencia no relatorio para analise manual.

## Execucao local em 2026-07-08

Ambiente usado:

```text
MySQL local/XAMPP
Host: 127.0.0.1
Porta: 3306
Banco: sagae_pnae
Usuario: sagae
```

Backup logico gerado antes da importacao:

```text
backups/sagae_pnae_antes_inep_mt_20260708_092654.sql
```

Fonte oficial INEP usada:

```text
https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2024.zip
docs/inep/microdados_censo_escolar_2024/microdados_censo_escolar_2024_defeso/dados/microdados_ed_basica_2024.csv
```

Resultado da importacao INEP:

```text
Municipios lidos no INEP: 141
Municipios criados: 138
Municipios atualizados: 6
Escolas lidas/criadas: 3191
Inconsistencias: 0
Relatorio: docs/inep/import-report-2026-07-08T13-27-53-137Z.json
```

Complemento de municipios:

```text
Fonte: API oficial IBGE Localidades
URL: https://servicodados.ibge.gov.br/api/v1/localidades/estados/MT/municipios
Arquivo local: docs/inep/ibge-municipios-mt-2026-07-08.json
Total fonte IBGE: 142
Municipios criados via IBGE: 1
Municipios atualizados via IBGE: 141
```

Validacao final no banco:

```text
Municipios ativos MT: 142
Municipios de outras UFs ativos: 0
Escolas ativas: 3191
Codigos IBGE duplicados ativos: 0
Codigos INEP de escola duplicados ativos: 0
```
