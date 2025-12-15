# Backend de Email (Express + Nodemailer)

Este servidor recebe POST em `/api/messages` e envia emails usando SMTP (genérico) ou Gmail.

## Requisitos
- Node.js 16+
- Uma conta de email com SMTP (ou Gmail com App Password)

## Configuração
1. Copie `.env.example` para `.env` e ajuste as variáveis:
   - Para Gmail: defina `GMAIL_USER` e `GMAIL_PASS` (App Password).
   - Para SMTP: defina `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
2. Instale dependências:

```powershell
Set-Location "c:\Users\Cristiane\Desktop\nexus"
npm init -y
npm install express nodemailer cors dotenv
```

## Execução
```powershell
# Iniciar o servidor
node server.js
# Servirá em http://localhost:5501
```

## Integração com o site
O `index.html` já faz `fetch('/api/messages')`. Ao abrir o site via `http://localhost:5500` (por exemplo), o navegador chamará `http://localhost:5501/api/messages` (mesmo host se você servir ambos juntos ou ajuste o CORS).

Se servir o site em outra porta, o CORS já está liberado (`origin: true`).

## Payload esperado
```json
{
  "from": "email-do-usuario@example.com",
  "to": "nexustinfo@gmail.com",
  "subject": "Assunto",
  "message": "Corpo da mensagem",
  "specialist": "Opcional"
}
```

## Dicas
- Use App Password no Gmail (conta → Segurança → Senhas de app).
- `replyTo` é configurado para o email do usuário (`from`).
- Suporta múltiplos destinatários em `to` separados por vírgula.
