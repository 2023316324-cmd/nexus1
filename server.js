require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5501;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''); }

function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Boolean(process.env.SMTP_SECURE === 'true'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  // Gmail via App Password
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
  });
}

app.post('/api/messages', async (req, res) => {
  try {
    const { from, to, subject, message, specialist } = req.body || {};
    if (!isEmail(from)) return res.status(400).json({ error: 'Email do remetente inválido' });
    const recipients = (String(to || 'nexustinfo@gmail.com')
      .split(',')
      .map(s => s.trim())
      .filter(isEmail));
    if (!recipients.length) return res.status(400).json({ error: 'Destinatário inválido' });
    if (!subject || subject.length < 3) return res.status(400).json({ error: 'Assunto inválido' });
    if (!message || message.length < 10) return res.status(400).json({ error: 'Mensagem curta' });

    const transporter = createTransport();

    const info = await transporter.sendMail({
      from: `Nexus Site <${process.env.MAIL_FROM || process.env.GMAIL_USER || 'nexustinfo@gmail.com'}>`,
      to: recipients.join(','),
      replyTo: from,
      subject,
      text: `${message}\n\nContato: ${from}${specialist ? `\nReferente a: ${specialist}` : ''}`,
    });

    return res.json({ id: info.messageId || 'sent', ok: true });
  } catch (err) {
    console.error('Erro envio email:', err);
    return res.status(500).json({ error: 'Falha no envio', detail: err && err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Email server running on http://localhost:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

(async () => {
  const db = await open({ filename: './messages.db', driver: sqlite3.Database });
  await db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_email TEXT,
    recipient_email TEXT,
    specialist TEXT,
    subject TEXT,
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true }));
  app.use(bodyParser.json());

  // basic rate limiter: default max 10 requests/minute
  const limiter = rateLimit({ windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_MAX || 10) });
  app.use('/api/', limiter);

  function validateEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const allowedRecipients = (process.env.ALLOWED_RECIPIENTS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowedRecipients.length === 0) allowedRecipients.push((process.env.DEFAULT_RECIPIENT || 'contato@nexusit.com'));

  // configure Nodemailer transporter (SMTP)
  const transporterOptions = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  };
  const transporter = nodemailer.createTransport(transporterOptions);

  async function verifyRecaptcha(token, remoteIp) {
    if (!process.env.RECAPTCHA_SECRET) return true;
    try {
      const resp = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(remoteIp)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const data = await resp.json();
      return !!data.success && data.score && data.score > 0.3; // or require success
    } catch (err) {
      console.warn('recaptcha verification failed', err);
      return false;
    }
  }

  app.post('/api/messages', async (req, res) => {
    try {
      const { from, to, subject, message, specialist, recaptchaToken } = req.body;
      if (!from || !validateEmail(from) || !subject || !message) return res.status(400).json({ error: 'invalid_input' });

      const recipient = (to && validateEmail(to)) ? to : (process.env.DEFAULT_RECIPIENT || 'contato@nexusit.com');
      if (!allowedRecipients.includes(recipient)) return res.status(403).json({ error: 'invalid_recipient' });

      if (process.env.RECAPTCHA_SECRET) {
        const ok = await verifyRecaptcha(recaptchaToken, req.ip);
        if (!ok) return res.status(403).json({ error: 'recaptcha_failed' });
      }

      // sanitize/truncate (basic)
      const sanitizedSubject = subject.substring(0, 300);
      const sanitizedMessage = message.substring(0, 6000);

      const result = await db.run('INSERT INTO messages (sender_email, recipient_email, specialist, subject, body) VALUES (?, ?, ?, ?, ?)', [from, recipient, specialist || '', sanitizedSubject, sanitizedMessage]);

      // Send e-mail via configured transporter
      const mailOptions = {
        from: `Nexus Contact <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nexusit.com'}>`,
        to: recipient,
        subject: sanitizedSubject,
        text: `${sanitizedMessage}\n\nContato: ${from}\nReferente a: ${specialist || ''}`
      };

      let info = null;
      if (process.env.MOCK_EMAIL === 'true') {
        // If mock mode, skip actual send
        info = { messageId: 'mock-' + Date.now() };
      } else {
        info = await transporter.sendMail(mailOptions);
      }

      res.json({ success: true, id: result.lastID, info });
    } catch (err) {
      console.error('error', err);
      res.status(500).json({ error: 'internal_server_error', message: err.message });
    }
  });

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, () => console.log('Server listening on port', PORT));
})();
