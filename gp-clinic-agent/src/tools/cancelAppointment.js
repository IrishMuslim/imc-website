const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../database');

const cancelAppointmentTool = tool(
    async ({ appointment_id }) => {
        try {
            const result = db.cancelAppointment(appointment_id);

            if (!result.success) {
                return result.message;
            }

            return `Appointment ${appointment_id.slice(0, 8).toUpperCase()} has been cancelled successfully. The patient will be notified.`;
        } catch (error) {
            return `Error cancelling appointment: ${error.message}`;
        }
    },
    {
        name: 'cancel_appointment',
        description: 'Cancel an existing confirmed appointment. Requires the appointment ID.',
        schema: z.object({
            appointment_id: z.string().describe('The appointment ID to cancel')
        })
    }
);

module.exports = cancelAppointmentTool;
