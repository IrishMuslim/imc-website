const { ChatOpenAI } = require('@langchain/openai');
const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');

// Tools
const getAvailableSlotsTool = require('./tools/getAvailableSlots');
const bookAppointmentTool = require('./tools/bookAppointment');
const rescheduleAppointmentTool = require('./tools/rescheduleAppointment');
const cancelAppointmentTool = require('./tools/cancelAppointment');
const getPatientAppointmentsTool = require('./tools/getPatientAppointments');

const tools = [
    getAvailableSlotsTool,
    bookAppointmentTool,
    rescheduleAppointmentTool,
    cancelAppointmentTool,
    getPatientAppointmentsTool
];

// In-memory conversation history (phone -> messages[])
const conversationHistory = new Map();
const MAX_HISTORY = 20;

function getHistory(phone) {
    return conversationHistory.get(phone) || [];
}

function addToHistory(phone, role, content) {
    if (!conversationHistory.has(phone)) {
        conversationHistory.set(phone, []);
    }
    const history = conversationHistory.get(phone);
    const message = role === 'human' ? new HumanMessage(content) : new AIMessage(content);
    history.push(message);

    // Keep history bounded
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
}

async function createAgent() {
    const clinicName = process.env.CLINIC_NAME || 'GP Clinic';
    const today = new Date().toISOString().split('T')[0];
    const dayName = new Date().toLocaleDateString('en-IE', { weekday: 'long' });

    const systemPrompt = `You are a friendly and professional virtual receptionist for ${clinicName}. You help patients with:
- Booking new appointments
- Rescheduling existing appointments
- Cancelling appointments
- Checking available time slots
- Viewing their upcoming appointments

Today's date is ${today} (${dayName}).

Guidelines:
1. Be warm, professional, and concise. Use a friendly tone.
2. When booking, always confirm the doctor, date, time, and reason before finalising.
3. If the patient doesn't specify a doctor, show them available doctors and ask their preference.
4. If a date/time is not available, suggest alternatives.
5. For rescheduling or cancellation, first look up the patient's appointments to find the right one.
6. Always confirm actions before executing them (e.g., "Shall I go ahead and book this?").
7. Use the patient's phone number (provided as context) to identify them.
8. When referring to dates, use natural language alongside the date (e.g., "Monday, 15th January").
9. Keep responses brief and suitable for WhatsApp (no overly long messages).
10. If you don't have enough information, ask follow-up questions one at a time.
11. Clinic hours are ${process.env.CLINIC_HOURS_START || '09'}:00 to ${process.env.CLINIC_HOURS_END || '17'}:00, Monday to Friday.
12. Do NOT book appointments on weekends or outside clinic hours.

The patient's phone number will be provided in each message as context.`;

    const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
        new MessagesPlaceholder('agent_scratchpad')
    ]);

    const llm = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0.3
    });

    const agent = await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt
    });

    const executor = new AgentExecutor({
        agent,
        tools,
        verbose: process.env.NODE_ENV === 'development'
    });

    return executor;
}

let agentExecutor = null;

async function getAgent() {
    if (!agentExecutor) {
        agentExecutor = await createAgent();
    }
    return agentExecutor;
}

async function processMessage(phone, messageText) {
    const agent = await getAgent();
    const history = getHistory(phone);

    // Add context about who is messaging
    const input = `[Patient phone: ${phone}]\n${messageText}`;

    try {
        const result = await agent.invoke({
            input,
            chat_history: history
        });

        const response = result.output;

        // Save to history
        addToHistory(phone, 'human', messageText);
        addToHistory(phone, 'ai', response);

        return response;
    } catch (error) {
        console.error('Agent error:', error);
        return "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or call the clinic directly for urgent matters.";
    }
}

module.exports = { processMessage };
