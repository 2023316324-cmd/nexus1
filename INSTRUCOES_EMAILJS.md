# Instruções para Configurar o Envio de Email com EmailJS

## Passo 1: Criar Conta no EmailJS

1. Acesse: https://www.emailjs.com/
2. Clique em "Sign Up" (Cadastrar)
3. Crie sua conta gratuita (permite até 200 emails/mês)

## Passo 2: Adicionar Serviço de Email

1. Após fazer login, vá em "Email Services"
2. Clique em "Add New Service"
3. Escolha seu provedor de email (Gmail, Outlook, etc.)
4. Siga as instruções para conectar sua conta
5. Anote o **SERVICE_ID** que será gerado (ex: "service_1k96fdj")

## Passo 3: Criar Template de Email

1. Vá em "Email Templates"
2. Clique em "Create New Template"
3. Configure o template com os seguintes campos:

**Subject (Assunto):**
```
{{subject}}
```

**Content (Conteúdo):**
```
Nova mensagem de: {{from_email}}

{{message}}

---
Enviado através do site Nexus IT
```

4. Anote o **TEMPLATE_ID** gerado ( "template_jl3z1nj")

## Passo 4: Obter Chave Pública (Public Key)

1. Vá em "Account" → "General"
2. Copie a **Public Key** (ex: "XN0ZyQZH95LNf8TOU")

## Passo 5: Configurar o Site

Abra o arquivo `index.html` e substitua:

**Linha ~587:**
```javascript
emailjs.init("SUA_PUBLIC_KEY_AQUI");
```
Substitua por:
```javascript
emailjs.init("abcDEF123ghiJKL456"); // Sua Public Key real
```

**Linha ~1104:**
```javascript
emailjs.send('SEU_SERVICE_ID', 'SEU_TEMPLATE_ID', templateParams)
```
Substitua por:
```javascript
emailjs.send('service_abc123', 'template_xyz789', templateParams)
```

## Passo 6: Testar

1. Abra o arquivo `index.html` no navegador
2. Preencha o formulário de contato
3. Clique em "Solicitar Contato"
4. Escolha "Enviar pelo site"
5. Verifique se o email foi recebido

## Campos Disponíveis no Template

O template pode usar estas variáveis:
- `{{from_email}}` - Email do remetente
- `{{to_email}}` - Email do destinatário
- `{{subject}}` - Assunto da mensagem
- `{{message}}` - Corpo da mensagem
- `{{specialist}}` - Nome do especialista (se aplicável)

## Dicas

- Para múltiplos destinatários, use vírgulas no campo "to_email"
- Configure o email de resposta (Reply-To) no template para {{from_email}}
- Monitore o uso no dashboard do EmailJS
- Plano gratuito: 200 emails/mês
- Se precisar de mais, considere upgrade ou backend próprio

## Alternativa: Backend Node.js com Nodemailer

Se preferir um backend próprio:
1. Crie um servidor Node.js com Express
2. Use Nodemailer para enviar emails
3. Configure o endpoint `/api/messages`
4. Remova EmailJS e restaure o código fetch original

Precisa de ajuda com isso? Me avise!
