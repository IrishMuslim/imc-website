const twilio = require('twilio');

let client;

function getTwilioClient() {
    if (!client) {
        client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    return client;
}

async function sendWhatsAppMessage(to, body) {
    const twilioClient = getTwilioClient();
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    // Ensure 'whatsapp:' prefix
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    try {
        const message = await twilioClient.messages.create({
            body,
            from,
            to: toNumber
        });
        console.log(`Message sent to ${toNumber}: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`Failed to send message to ${toNumber}:`, error.message);
        throw error;
    }
}

function formatAppointmentConfirmation(appointment) {
    const clinicName = process.env.CLINIC_NAME || 'GP Clinic';
    return [
        `✅ *Appointment Confirmed*`,
        ``,
        `📋 *${clinicName}*`,
        `👨‍⚕️ Doctor: ${appointment.doctor_name}`,
        `📅 Date: ${appointment.date}`,
        `🕐 Time: ${appointment.time}`,
        appointment.reason ? `📝 Reason: ${appointment.reason}` : '',
        ``,
        `Reference: ${appointment.id.slice(0, 8).toUpperCase()}`,
        ``,
        `To reschedule or cancel, just send us a message.`
    ].filter(Boolean).join('\n');
}

function formatReminderMessage(appointment, type) {
    const clinicName = process.env.CLINIC_NAME || 'GP Clinic';
    const timeLabel = type === '24h' ? 'tomorrow' : 'in 1 hour';

    return [
        `⏰ *Appointment Reminder*`,
        ``,
        `Hi ${appointment.patient_name || 'there'}! This is a reminder that you have an appointment ${timeLabel}.`,
        ``,
        `👨‍⚕️ Doctor: ${appointment.doctor_name}`,
        `📅 Date: ${appointment.date}`,
        `🕐 Time: ${appointment.time}`,
        `📋 ${clinicName}`,
        ``,
        `Reply "cancel" if you need to cancel, or "reschedule" to change the time.`
    ].join('\n');
}

function formatCancellationMessage(appointment) {
    return [
        `❌ *Appointment Cancelled*`,
        ``,
        `Your appointment with ${appointment.doctor_name} on ${appointment.date} at ${appointment.time} has been cancelled.`,
        ``,
        `If you'd like to book a new appointment, just send us a message.`
    ].join('\n');
}

module.exports = {
    sendWhatsAppMessage,
    formatAppointmentConfirmation,
    formatReminderMessage,
    formatCancellationMessage
};
