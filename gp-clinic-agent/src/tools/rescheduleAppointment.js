const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../database');

const rescheduleAppointmentTool = tool(
    async ({ appointment_id, new_date, new_time }) => {
        try {
            const result = db.rescheduleAppointment(appointment_id, new_date, new_time);

            if (!result.success) {
                return result.message;
            }

            const appt = result.appointment;
            return `Appointment rescheduled successfully!\n` +
                `Reference: ${appt.id.slice(0, 8).toUpperCase()}\n` +
                `Doctor: ${appt.doctor_name}\n` +
                `New Date: ${appt.date}\n` +
                `New Time: ${appt.time}`;
        } catch (error) {
            return `Error rescheduling: ${error.message}`;
        }
    },
    {
        name: 'reschedule_appointment',
        description: 'Reschedule an existing appointment to a new date and time. Requires the appointment ID and new date/time.',
        schema: z.object({
            appointment_id: z.string().describe('The appointment ID to reschedule'),
            new_date: z.string().describe('New date in YYYY-MM-DD format'),
            new_time: z.string().describe('New time in HH:MM format (24-hour)')
        })
    }
);

module.exports = rescheduleAppointmentTool;
