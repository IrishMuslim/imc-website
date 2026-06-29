const cron = require('node-cron');
const db = require('./database');
const { sendWhatsAppMessage, formatReminderMessage } = require('./whatsapp');

function startReminderScheduler() {
    // Run every 15 minutes to check for upcoming reminders
    cron.schedule('*/15 * * * *', async () => {
        console.log('[Reminder] Checking for upcoming appointment reminders...');

        try {
            const { reminders24h, reminders1h } = db.getUpcomingReminders();

            // Send 24-hour reminders
            for (const appointment of reminders24h) {
                try {
                    const message = formatReminderMessage(appointment, '24h');
                    await sendWhatsAppMessage(appointment.patient_phone, message);
                    db.markReminderSent(appointment.id, '24h');
                    console.log(`[Reminder] 24h reminder sent to ${appointment.patient_phone} for appointment ${appointment.id}`);
                } catch (error) {
                    console.error(`[Reminder] Failed to send 24h reminder for ${appointment.id}:`, error.message);
                }
            }

            // Send 1-hour reminders
            for (const appointment of reminders1h) {
                try {
                    const message = formatReminderMessage(appointment, '1h');
                    await sendWhatsAppMessage(appointment.patient_phone, message);
                    db.markReminderSent(appointment.id, '1h');
                    console.log(`[Reminder] 1h reminder sent to ${appointment.patient_phone} for appointment ${appointment.id}`);
                } catch (error) {
                    console.error(`[Reminder] Failed to send 1h reminder for ${appointment.id}:`, error.message);
                }
            }

            if (reminders24h.length > 0 || reminders1h.length > 0) {
                console.log(`[Reminder] Sent ${reminders24h.length} 24h reminders, ${reminders1h.length} 1h reminders`);
            }
        } catch (error) {
            console.error('[Reminder] Scheduler error:', error.message);
        }
    });

    console.log('[Reminder] Scheduler started — checking every 15 minutes');
}

module.exports = { startReminderScheduler };
