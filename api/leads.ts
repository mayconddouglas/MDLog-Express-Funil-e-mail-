import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Implementada localmente (em vez de importada de ../src/utils) porque a runtime
// Node ESM da Vercel exige extensão de arquivo em imports relativos cruzando
// diretórios (o projeto usa "type": "module" no package.json). Um import sem
// extensão para fora de /api causava ERR_MODULE_NOT_FOUND e derrubava a função
// antes mesmo de tentar enviar o e-mail.
function calculateLeadQualification(frequency: string, dailyVolume: string, segment: string) {
  let score = 30;
  const reasons: string[] = [];

  if (frequency === "Todos os dias") {
    score += 40;
    reasons.push("Necessidade diária de logística e entregas.");
  } else if (frequency === "2 a 3 vezes por semana") {
    score += 25;
    reasons.push("Operação constante (2 a 3x por semana).");
  } else if (frequency === "Semanalmente") {
    score += 15;
    reasons.push("Necessidade semanal de entregas.");
  } else {
    score += 5;
    reasons.push("Busca esporádica ou em fase de pesquisa.");
  }

  if (dailyVolume === "Mais de 20") {
    score += 35;
    reasons.push("Volume elevado (mais de 20 entregas/dia).");
  } else if (dailyVolume === "11–20") {
    score += 25;
    reasons.push("Volume consistente (11 a 20 entregas/dia).");
  } else if (dailyVolume === "6–10") {
    score += 15;
    reasons.push("Volume moderado (6 a 10 entregas/dia).");
  } else if (dailyVolume === "1–5") {
    score += 10;
    reasons.push("Volume inicial (1 a 5 entregas/dia).");
  } else {
    reasons.push("Volume ainda em definição.");
  }

  if (["E-commerce", "Distribuidora", "Farmácia", "Autopeças"].includes(segment)) {
    score += 10;
    reasons.push(`Segmento de alta demanda logística (${segment}).`);
  }

  score = Math.min(100, Math.max(10, score));

  let level: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let levelLabel = "Cliente Esporádico / Potencial Inicial";
  let badgeColor = "bg-neutral-800 text-neutral-300 border-neutral-700";
  let recommendedService = "Tabela de Entregas Avulsas / Motoboy sob demanda";
  let estimatedMonthlyDeliveries = "Até 100 entregas/mês";

  if (score >= 75) {
    level = "HIGH";
    levelLabel = "Cliente Recorrente (Alto Potencial)";
    badgeColor = "bg-emerald-950 text-emerald-400 border-emerald-800";
    recommendedService = "Contrato Dedicado de Frota & Tabela Corporativa Preferencial";
    estimatedMonthlyDeliveries = dailyVolume === "Mais de 20" ? "+600 entregas/mês" : "250 a 500 entregas/mês";
  } else if (score >= 50) {
    level = "MEDIUM";
    levelLabel = "Cliente Médio (Frequência Regular)";
    badgeColor = "bg-amber-950 text-amber-400 border-amber-800";
    recommendedService = "Plano Corporativo Flexível / Rotas Agendadas";
    estimatedMonthlyDeliveries = "100 a 250 entregas/mês";
  }

  return { level, levelLabel, score, badgeColor, reasons, recommendedService, estimatedMonthlyDeliveries };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ success: true, message: "Leads API endpoint active on Vercel" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      companyName,
      segment,
      location,
      frequency,
      dailyVolume,
      contactName,
      contactWhatsApp,
      contactEmail,
    } = body || {};

    if (!companyName || !segment || !frequency || !dailyVolume || !contactName || !contactWhatsApp) {
      return res.status(400).json({
        success: false,
        error: "Preencha todos os campos obrigatórios.",
      });
    }

    const qualification = calculateLeadQualification(frequency, dailyVolume, segment);

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

    const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL || "mdlogexpress@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; color: #111;">🚚 Nova Solicitação de Cotação - MDLogExpress</h2>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 13px;">Recebido em: ${new Date(newLead.createdAt).toLocaleString('pt-BR')}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; color: #333; margin-bottom: 10px; border-left: 3px solid #111; padding-left: 8px;">🏢 Dados da Empresa</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 180px; color: #555;">Empresa / Razão Social:</td><td>${newLead.companyName}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Segmento:</td><td>${newLead.segment}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Localização / Cidade:</td><td>${newLead.location}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Frequência de Entregas:</td><td>${newLead.frequency}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Volume Diário Estimado:</td><td>${newLead.dailyVolume}</td></tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; color: #333; margin-bottom: 10px; border-left: 3px solid #111; padding-left: 8px;">👤 Informações de Contato</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 180px; color: #555;">Responsável:</td><td>${newLead.contactName}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">WhatsApp / Telefone:</td><td><a href="https://wa.me/55${newLead.contactWhatsApp.replace(/\D/g, '')}" style="color: #10b981; font-weight: bold; text-decoration: none;">${newLead.contactWhatsApp} (Abrir no WhatsApp)</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">E-mail de Contato:</td><td>${newLead.contactEmail || 'Não informado'}</td></tr>
          </table>
        </div>

        ${newLead.qualification ? `
        <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #111;">📊 Qualificação do Lead</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Classificação:</strong> ${newLead.qualification.levelLabel}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Pontuação:</strong> ${newLead.qualification.score} / 100</p>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #eee; pt-12px; font-size: 12px; color: #888;">
          <p style="margin: 0;">MDLogExpress • Sistema Inteligente de Cotações Logísticas</p>
        </div>
      </div>
    `;

    let emailSent = false;
    let provider = "none";
    let resendErrorDetails: any = null;
    let smtpErrorDetails: any = null;

    // Try Resend
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || "MDLogExpress <onboarding@resend.dev>";
        
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [DESTINATION_EMAIL],
          subject: `[MDLogExpress] Nova Cotação: ${newLead.companyName} (${newLead.contactName})`,
          html: htmlContent,
        });

        if (error) {
          resendErrorDetails = error;
          console.error("Resend send error:", JSON.stringify(error));
        } else {
          emailSent = true;
          provider = "resend";
          console.log("Email dispatched via Resend:", data?.id);
        }
      } catch (err: any) {
        resendErrorDetails = err?.message || err;
        console.error("Resend exception:", err);
      }
    }

    // Fallback to SMTP if Resend failed or not provided
    if (!emailSent && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_PORT === "465",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: `"MDLogExpress" <${process.env.SMTP_USER}>`,
          to: DESTINATION_EMAIL,
          subject: `[MDLogExpress] Nova Cotação: ${newLead.companyName} (${newLead.contactName})`,
          html: htmlContent,
        });

        emailSent = true;
        provider = "smtp";
      } catch (err: any) {
        smtpErrorDetails = err?.message || err;
        console.error("SMTP error:", err);
      }
    }

    if (!emailSent) {
      // Nem Resend nem SMTP conseguiram entregar o e-mail.
      const debugMsg = resendErrorDetails?.message || (typeof resendErrorDetails === 'string' ? resendErrorDetails : null);
      
      return res.status(502).json({
        success: false,
        error: debugMsg
          ? `Erro no serviço de e-mail (Resend): ${debugMsg}`
          : "Não foi possível enviar sua solicitação por e-mail no momento. Tente novamente em instantes ou entre em contato pelo WhatsApp.",
        details: {
          resendError: resendErrorDetails,
          smtpError: smtpErrorDetails,
          hasResendKey: !!resendApiKey,
          destinationEmail: DESTINATION_EMAIL,
        },
        lead: newLead,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Solicitação recebida e enviada com sucesso!",
      lead: newLead,
      emailSent,
      provider,
    });
  } catch (err: any) {
    console.error("Fatal error in /api/leads function:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Erro interno do servidor ao processar cotação.",
    });
  }
}
