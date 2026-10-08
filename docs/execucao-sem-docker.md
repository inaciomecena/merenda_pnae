# Execucao do SAGAE PNAE sem Docker

## Banco MySQL

A aplicacao usa MySQL local/externo:

- Host: `127.0.0.1`
- Port: `3306`
- User: `sagae`
- Password: `sagae123`
- Database: `sagae_pnae`

`apps/backend/.env`:

```text
DATABASE_URL="mysql://sagae:sagae123@127.0.0.1:3306/sagae_pnae?charset=utf8mb4"
```

## Criar banco e usuario

Caso o MySQL ainda nao esteja preparado, execute o SQL:

```text
scripts/setup-mysql-local.sql
```

## Preparar schema

```powershell
cd apps\backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Iniciar sistema

```powershell
.\iniciar-sistema.bat
```

O script verifica o MySQL local em `127.0.0.1:3306`, aplica migrations e abre:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Parar sistema

```powershell
.\parar-sistema.bat
```

O script encerra apenas os processos Node do backend/frontend. Ele nao para o MySQL local.

## Observacao

Docker Compose nao faz mais parte do fluxo de execucao da aplicacao.
