require('dotenv').config();

const express = require('express');
const { processMessage } = require('./agent');
const { sendWhatsAppMessage } = require('./whatsapp');
const { startReminderScheduler } = require('./reminder');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'GP Clinic Receptionist Agent',
        clinic: process.env.CLINIC_NAME || 'GP Clinic'
    });
});

// Twilio WhatsApp Webhook
app.post('/webhook/whatsapp', async (req, res) => {
    try {
        const { From, Body, ProfileName } = req.body;

        if (!From || !Body) {
            return res.status(400).send('Missing required fields');
        }

        // Extract phone number (remove 'whatsapp:' prefix for internal use)
        const phone = From.replace('whatsapp:', '');
        const messageText = Body.trim();

        console.log(`[Incoming] ${phone} (${ProfileName || 'Unknown'}): ${messageText}`);

        // Process with AI agent
        const response = await processMessage(phone, messageText);

        console.log(`[Outgoing] ${phone}: ${response.substring(0, 100)}...`);

        // Send reply via Twilio
        await sendWhatsAppMessage(From, response);

        // Respond to Twilio webhook (empty TwiML)
        res.set('Content-Type', 'text/xml');
        res.send('<Response></Response>');
    } catch (error) {
        console.error('[Webhook Error]', error);
        res.status(500).send('<Response></Response>');
    }
});

// Manual test endpoint (for development)
app.post('/test', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'phone and message are required' });
        }

        const response = await processMessage(phone, message);
        res.json({ response });
    } catch (error) {
        console.error('[Test Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🏥 GP Clinic Receptionist Agent`);
    console.log(`📍 Clinic: ${process.env.CLINIC_NAME || 'GP Clinic'}`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📱 WhatsApp webhook: POST /webhook/whatsapp`);
    console.log(`🧪 Test endpoint: POST /test`);
    console.log('');

    // Initialize database
    initializeDatabase();
    console.log('💾 Database initialized');

    // Start reminder scheduler
    startReminderScheduler();
});
