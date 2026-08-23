
/* eslint-disable @typescript-eslint/no-require-imports */
const twilio = require('twilio');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const Client = require('../models/Client');
const Document = require('../models/Document');
const UserSession = require('../models/UserSession');

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

class NewSmartWebhookController {
  constructor() {
    this.handleWhatsAppMessage = this.handleWhatsAppMessage.bind(this);
    this.testWebhook = this.testWebhook.bind(this);
  }

  caLine(client) {
    const phone = client.consultantPhone || null;
    const name = client.createdBy?.name || 'CA';
    return phone
      ? `\n\n📞 Koi bhi sawaal ho toh apne CA se milein:\n*${name}*: ${phone}`
      : `\n\n📞 Apne CA se contact karein: *${name}*`;
  }

  async handleWhatsAppMessage(req, res) {
    try {
      const twiml = new twilio.twiml.MessagingResponse();
      const incomingMessage = req.body.Body?.trim();
      const fromNumber = req.body.From?.replace('whatsapp:', '');

      console.log('MSG:', incomingMessage, 'FROM:', fromNumber);

      if (!incomingMessage || !fromNumber) {
        twiml.message('Invalid request');
        return res.type('text/xml').send(twiml.toString());
      }

      const client = await this.findClientByNumber(fromNumber);
      if (!client) {
        twiml.message('You are not registered. Please contact your CA.');
        return res.type('text/xml').send(twiml.toString());
      }

      const response = await this.processMessage(incomingMessage, client, fromNumber);
      twiml.message(response);
      return res.type('text/xml').send(twiml.toString());

    } catch (error) {
      console.error('Webhook error:', error);
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('An error occurred. Please try again or say "hi".');
      res.type('text/xml').send(twiml.toString());
    }
  }

  async processMessage(message, client, fromNumber) {
    const lower = message.toLowerCase().trim();

    const session = await UserSession.findOne({ phoneNumber: fromNumber });
    if (!session || !session.welcomed) {
      await UserSession.findOneAndUpdate(
        { phoneNumber: fromNumber },
        { welcomed: true, updatedAt: new Date() },
        { upsert: true }
      );
      return this.getWelcomeMessage(client);
    }

    if (this.isContactRequest(lower)) {
      return this.getConsultantInfo(client);
    }

    const clientDocs = await Document.find({ clientId: client._id }, 'documentType year').lean();

    if (clientDocs.length === 0) {
      return `Abhi aapke koi documents upload nahi hue hain. Apne CA se request karein.${this.caLine(client)}`;
    }

    const uniqueDocs = [...new Set(clientDocs.map(d => `${d.documentType} (${d.year})`))];

    console.log('AI call with', uniqueDocs.length, 'docs');
    return await this.processWithBedrock(message, client, uniqueDocs);
  }

  async processWithBedrock(userMessage, client, availableDocs) {
    try {
      const caName = client.createdBy?.name || 'CA';
      const caPhone = client.consultantPhone || 'available on request';

      const prompt = `You are a helpful assistant for CA firm "${caName}". You handle WhatsApp messages for clients who need their financial documents.

Client's message: "${userMessage}"

All documents available for this client:
${availableDocs.slice(0, 50).join('\n')}

CA Contact: ${caName} — ${caPhone}

YOUR BEHAVIOR:
- If the client is asking for one or more documents, match them from the list above and return those exact document names.
- If they ask for multiple documents, return all matched ones.
- If the message is casual chat, greeting, joke, or completely unrelated to documents — reply naturally and warmly. Do not force documents into the reply.
- If something is unclear and you think they might want a document but you're not sure — ask them naturally in a conversational way.
- If they ask something outside your scope (like general advice, news, etc.) — politely say you can only help with documents and suggest they contact their CA for anything else.
- Always reply in the SAME language the client used — Hindi, Marathi, Hinglish, or English.
- Be warm, short, and conversational. Never sound robotic or formal.
- If they ask what documents are available, list them all nicely.
- Never guess or hallucinate a document that is not in the list above.

Respond ONLY in this exact JSON format with no extra text:
{
  "isDocumentRequest": true or false,
  "matchedDocs": ["EXACT_DOCTYPE (YEAR)", "EXACT_DOCTYPE (YEAR)"],
  "isListRequest": true or false,
  "reply": "your warm natural reply here"
}`;

      const body = JSON.stringify({
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 500, temperature: 0.3 }
      });

      const result = await bedrock.send(new InvokeModelCommand({
        modelId: 'amazon.nova-micro-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body
      }));

      const responseBody = JSON.parse(Buffer.from(result.body).toString());
      const aiText = responseBody.output.message.content[0].text.trim();
      console.log('AI:', aiText);

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in AI response');

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.isDocumentRequest && parsed.matchedDocs && parsed.matchedDocs.length > 0) {
        return await this.fetchMatchedDocs(parsed.matchedDocs, client, parsed.reply);
      }

      if (parsed.isListRequest) {
        return await this.listClientDocTypes(client, parsed.reply);
      }

      // Casual / unrelated / unclear — just return AI reply with CA line
      const reply = parsed.reply || 'Kripya batayein aapko kaunsa document chahiye.';
      return `${reply}${this.caLine(client)}`;

    } catch (error) {
      console.error('Bedrock error:', error.message);
      return `Kuch technical issue aa gaya. Thodi der baad try karein ya apne CA se contact karein.${this.caLine(client)}`;
    }
  }

  async fetchMatchedDocs(matchedDocs, client, aiReply) {
    const results = [];

    for (const match of matchedDocs) {
      const m = match.match(/^(.+?)\s*\((.+?)\)$/);
      if (!m) continue;
      const docType = m[1].trim();
      const yr = m[2].trim();

      const doc = await Document.findOne({
        clientId: client._id,
        documentType: { $regex: `^${docType}$`, $options: 'i' },
        year: yr
      });
      if (doc) results.push(doc);
    }

    if (results.length === 0) {
      const m = matchedDocs[0].match(/^(.+?)\s*\((.+?)\)$/);
      if (m) {
        const docType = m[1].trim();
        const yr = m[2].trim();
        return `${aiReply || `Sorry, ${docType} (${yr}) abhi available nahi hai.`}\n\n❌ Yeh document abhi upload nahi hua hai.${this.caLine(client)}`;
      }
      return `${aiReply || 'Document nahi mila.'}${this.caLine(client)}`;
    }

    const intro = aiReply ? `${aiReply}\n\n` : '';

    if (results.length === 1) {
      return `${intro}📄 *${results[0].documentType} ${results[0].year}*\n\n${results[0].fileUrl}\n\nKuch aur chahiye? "hi" boliye 😊`;
    }

    let response = `${intro}📄 *${results.length} documents mile:*\n\n`;
    results.forEach((doc, i) => {
      response += `${i + 1}. *${doc.documentType} ${doc.year}*\n${doc.fileUrl}\n\n`;
    });
    response += `Kuch aur chahiye? "hi" boliye 😊`;
    return response;
  }

  async listClientDocTypes(client, aiReply) {
    const docs = await Document.find({ clientId: client._id }, 'documentType year').lean();

    if (docs.length === 0) {
      return `Abhi koi documents upload nahi hue hain.${this.caLine(client)}`;
    }

    const byType = {};
    docs.forEach(d => {
      if (!byType[d.documentType]) byType[d.documentType] = [];
      byType[d.documentType].push(d.year);
    });

    const intro = aiReply ? `${aiReply}\n\n` : 'Yeh hain aapke available documents:\n\n';
    let response = intro;
    Object.entries(byType).forEach(([type, years]) => {
      response += `📄 *${type}* — ${years.join(', ')}\n`;
    });
    response += `\nKisi specific document ke liye naam aur year batayein 😊`;
    return response;
  }

  getWelcomeMessage(client) {
    return `Hello ${client.name}! 👋\n\nWelcome to *${client.createdBy?.name || 'CA'}* Document Portal.\n\nKaunsa document chahiye? Kisi bhi language mein pooch sakte hain.\n\nExamples:\n• "ITR 2024-25"\n• "GSTR1 April 2024"\n• "Mujhe pichle saal ka tax return chahiye"\n• "Form 16 2024"\n\nOr say *contact* to reach your CA.`;
  }

  getConsultantInfo(client) {
    const phone = client.consultantPhone || 'Not available';
    return `📞 *Your CA Contact*\n\nCA: ${client.createdBy?.name || 'N/A'}\nPhone: ${phone}\n\nSay "hi" to go back.`;
  }

  isContactRequest(msg) {
    return ['contact', 'call', 'phone', 'number', 'consultant', 'ca contact', 'reach'].some(k => msg.includes(k));
  }

  async findClientByNumber(fromNumber) {
    const digits = fromNumber.replace(/\D/g, '');
    return await Client.findOne({
      $or: [
        { whatsappNumber: fromNumber },
        { whatsappNumber: `+${fromNumber}` },
        { whatsappNumber: { $regex: `${digits}$`, $options: 'i' } }
      ]
    }).populate('createdBy', 'name');
  }

  testWebhook(_req, res) {
    res.json({ message: 'Smart webhook with AI', timestamp: new Date().toISOString() });
  }
}

module.exports = new NewSmartWebhookController();