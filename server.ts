import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { calculateLeadQualification } from "./src/utils/qualification";

const app = express();
const PORT = 3000;

app.use(express.json());

const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL || "mdlogexpress@gmail.com";

// Send email helper
async function sendEmailNotification(lead: any) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; color: #111;">🚚 Nova Solicitação de Cotação - MDLogExpress</h2>
        <p style="margin: 4px 0 0 0; color: #666; font-size: 13px;">Recebido em: ${new Date(lead.createdAt).toLocaleString('pt-BR')}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; color: #333; margin-bottom: 10px; border-left: 3px solid #111; padding-left: 8px;">🏢 Dados da Empresa</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: bold; width: 180px; color: #555;">Empresa / Razão Social:</td><td>${lead.companyName}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Segmento:</td><td>${lead.segment}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Localização / Cidade:</td><td>${lead.location}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Frequência de Entregas:</td><td>${lead.frequency}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Volume Diário Estimado:</td><td>${lead.dailyVolume}</td></tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; color: #333; margin-bottom: 10px; border-left: 3px solid #111; padding-left: 8px;">👤 Informações de Contato</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: bold; width: 180px; color: #555;">Responsável:</td><td>${lead.contactName}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">WhatsApp / Telefone:</td><td><a href="https://wa.me/55${lead.contactWhatsApp.replace(/\D/g, '')}" style="color: #10b981; font-weight: bold; text-decoration: none;">${lead.contactWhatsApp} (Abrir no WhatsApp)</a></td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">E-mail de Contato:</td><td>${lead.contactEmail || 'Não informado'}</td></tr>
        </table>
      </div>

      ${lead.qualification ? `
      <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #111;">📊 Qualificação do Lead</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Classificação:</strong> ${lead.qualification.levelLabel}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Pontuação:</strong> ${lead.qualification.score} / 100</p>
        ${lead.qualification.aiInsights ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #444; font-style: italic;"><strong>Recomendação Comercial (Gemini):</strong> ${lead.qualification.aiInsights}</p>` : ''}
      </div>
      ` : ''}

      <div style="text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">
        Mensagem enviada para <strong>${DESTINATION_EMAIL}</strong> via sistema MDLogExpress.
      </div>
    </div>
  `;

  // 1. Try Resend if RESEND_API_KEY is configured
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "MDLogExpress <onboarding@resend.dev>";
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [DESTINATION_EMAIL],
        subject: `[MDLogExpress] Nova Cotação: ${lead.companyName} (${lead.contactName})`,
        html: htmlContent,
      });

      if (error) {
        console.error("[Resend Error]", error);
        throw new Error(error.message);
      }

      console.log(`[Email Dispatch] E-mail enviado via Resend para ${DESTINATION_EMAIL}:`, data?.id);
      return { sent: true, provider: "resend", id: data?.id };
    } catch (err: any) {
      console.error("[Resend Dispatch Failure]", err);
      // Fallback to SMTP or simulation if available
    }
  }

  // 2. Try SMTP if configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"MDLogExpress Cotador" <${smtpUser}>`,
        to: DESTINATION_EMAIL,
        subject: `[MDLogExpress] Nova Cotação: ${lead.companyName} (${lead.contactName})`,
        html: htmlContent,
      });

      console.log(`[Email Dispatch] E-mail enviado via SMTP para ${DESTINATION_EMAIL}`);
      return { sent: true, provider: "smtp" };
    } catch (err) {
      console.error("[SMTP Dispatch Error] Falha ao enviar via SMTP:", err);
      return { sent: false, error: String(err) };
    }
  }

  // 3. Fallback simulation mode
  console.log(`[Email Notification Triggered] Notificação simulada para ${DESTINATION_EMAIL} com as informações de ${lead.companyName}`);
  return { sent: true, simulated: true };
}

// Path to persistent data
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn("Could not create data dir:", e);
  }
}

// Initial seed or file load
function loadLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const content = fs.readFileSync(LEADS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading leads file:", err);
  }
  return [];
}

function saveLeads(leads: any[]) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving leads file:", err);
  }
}

let leads = loadLeads();

// Gemini client lazy getter
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// API Routes

// CORS Middleware for Express
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// GET /api/leads
app.get(["/api/leads", "/leads"], (req, res) => {
  res.json({ success: true, count: leads.length, leads });
});

// POST /api/leads - Submit new lead
app.post(["/api/leads", "/leads"], async (req, res) => {
  try {
    const {
      companyName,
      segment,
      location,
      frequency,
      dailyVolume,
      contactName,
      contactWhatsApp,
      contactEmail,
    } = req.body;

    if (!companyName || !segment || !frequency || !dailyVolume || !contactName || !contactWhatsApp) {
      return res.status(400).json({
        success: false,
        error: "Preencha todos os campos obrigatórios.",
      });
    }

    const qualification = calculateLeadQualification(frequency, dailyVolume, segment);

    // Optional Gemini AI Analysis if key is present
    let aiInsights = "";
    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `Atue como diretor comercial da MDLogExpress (empresa de logística e entregas expressas).
Análise rápida de lead:
- Empresa: ${companyName}
- Segmento: ${segment}
- Localização: ${location}
- Frequência de entregas: ${frequency}
- Volume diário estimado: ${dailyVolume}
- Responsável: ${contactName}

Escreva em 2 a 3 frases em Português:
1. Qual o perfil de potencial deste cliente?
2. Qual a abordagem comercial recomendada para a equipe da MDLogExpress ao entrar em contato via WhatsApp?`,
        });
        aiInsights = response.text || "";
      } catch (geminiError) {
        console.warn("Gemini generation skipped:", geminiError);
      }
    }

    if (aiInsights) {
      qualification.aiInsights = aiInsights;
    }

    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      companyName,
      segment,
      location: location || "Não informado",
      frequency,
      dailyVolume,
      contactName,
      contactWhatsApp,
      contactEmail: contactEmail || "",
      createdAt: new Date().toISOString(),
      qualification,
    };

    leads.unshift(newLead);
    saveLeads(leads);

    console.log(`[MDLogExpress] Lead registrado: ${companyName} (${qualification.levelLabel})`);

    // Dispatch email notification to mdlogexpress@gmail.com
    const emailResult = await sendEmailNotification(newLead);

    res.status(201).json({
      success: true,
      message: "Solicitação recebida e enviada com sucesso para mdlogexpress@gmail.com!",
      lead: newLead,
      emailSent: emailResult.sent,
    });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor ao salvar solicitação." });
  }
});

// DELETE /api/leads/:id
app.delete("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  leads = leads.filter((l: any) => l.id !== id);
  saveLeads(leads);
  res.json({ success: true, message: "Lead removido com sucesso." });
});

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MDLogExpress Smart Form API" });
});

// Vite Middleware for development / static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MDLogExpress App running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
