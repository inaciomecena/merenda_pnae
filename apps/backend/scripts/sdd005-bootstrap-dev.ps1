# SDD-005 — ETAPA 2: bootstrap institucional no banco de DESENVOLVIMENTO (merenda_pnae)
# - Instancia efêmera do backend (porta 3200) com BOOTSTRAP_ADMIN_TOKEN só no env do processo.
# - O token NUNCA é impresso em log nem escrito em .env; morre com o processo da fase A.
# - Uso: powershell -ExecutionPolicy Bypass -File sdd005-bootstrap-dev.ps1
$ErrorActionPreference = 'Stop'

$backend = 'C:\Projetos\merenda_pnae\apps\backend'
$porta = 3200
$base = "http://localhost:$porta/api/v1"
$logDir = 'C:\Users\HP ELITE\AppData\Local\Temp\opencode\backup-sdd005'

# 1) token temporário criptograficamente seguro (48 bytes aleatórios em hex)
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$token = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
$rng.Dispose()

# 2) fase A: instancia efêmera com o token no ambiente do processo
$env:BOOTSTRAP_ADMIN_TOKEN = $token
$env:PORT = "$porta"
$saida = Join-Path $logDir 'backend-fase-a.log'
$proc = Start-Process -FilePath 'node' -ArgumentList '--enable-source-maps', 'dist\main.js' `
  -WorkingDirectory $backend -RedirectStandardOutput $saida -RedirectStandardError "$saida.err" `
  -PassThru -WindowStyle Hidden
Write-Output "Fase A: backend efêmero PID $($proc.Id) na porta $porta (com token de bootstrap no env do processo)"

# 3) aguardar o boot da API
$pronto = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Milliseconds 750
  try {
    Invoke-WebRequest -Uri "$base/auth/login" -Method OPTIONS -TimeoutSec 3 -UseBasicParsing | Out-Null
    $pronto = $true; break
  } catch {
    if ($_.Exception.Response) { $pronto = $true; break }
  }
}
if (-not $pronto) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue; throw 'Backend de bootstrap não inicializou' }
Write-Output 'API pronta (porta 3200).'

# 4) autenticar como ADMIN
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' `
  -Body '{"email":"admin@seaf.gov.br","password":"Admin@123"}'
$adminToken = $login.data.accessToken
if (-not $adminToken) { throw 'Login como ADMIN falhou' }
Write-Output 'Login ADMIN: OK (token suprimido)'

$hdr = @{ authorization = "Bearer $adminToken" }

# 5) controles negativos antes do bootstrap válido
try {
  Invoke-RestMethod -Uri "$base/vinculos/bootstrap" -Method Post -Headers $hdr `
    -ContentType 'application/json' -Body '{"token":"token-invalido"}' | Out-Null
  Write-Output 'CONTROLE: token inválido ACEITO (INESPERADO)'
} catch { Write-Output "CONTROLE: token inválido recusado — HTTP $($_.Exception.Response.StatusCode.value__) (esperado 403)" }

# 6) bootstrap válido (token no body, mecanismo implementado)
$bootBody = (@{ token = $token } | ConvertTo-Json)
$boot = Invoke-RestMethod -Uri "$base/vinculos/bootstrap" -Method Post -Headers $hdr `
  -ContentType 'application/json' -Body $bootBody
Write-Output "BOOTSTRAP: vínculo criado → id=$($boot.data.id) funcao=$($boot.data.funcao) ativo=$($boot.data.ativo) userId=$($boot.data.userId)"

# 7) repetição deve ser bloqueada (execução única)
try {
  Invoke-RestMethod -Uri "$base/vinculos/bootstrap" -Method Post -Headers $hdr `
    -ContentType 'application/json' -Body $bootBody | Out-Null
  Write-Output 'REPETIÇÃO: ACEITA (INESPERADO)'
} catch { Write-Output "REPETIÇÃO: bloqueada — HTTP $($_.Exception.Response.StatusCode.value__) (esperado 409)" }

# 8) fase A encerrada: o token deixa o ambiente junto com o processo (.env nunca foi alterado)
Stop-Process -Id $proc.Id -Force
Remove-Item Env:BOOTSTRAP_ADMIN_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:PORT -ErrorAction SilentlyContinue
Write-Output 'Fase A encerrada; BOOTSTRAP_ADMIN_TOKEN removido do ambiente (não estava em .env).'
