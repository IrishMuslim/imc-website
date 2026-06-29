const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../database');

const getAvailableSlotsTool = tool(
    async ({ date, doctor_name }) => {
        try {
            let doctorId = null;

            if (doctor_name) {
                const doctor = db.getDoctorByName(doctor_name);
                if (!doctor) {
                    const allDoctors = db.getAllDoctors();
                    const names = allDoctors.map(d => d.name).join(', ');
                    return `Doctor "${doctor_name}" not found. Available doctors: ${names}`;
                }
                doctorId = doctor.id;
            }

            const slots = db.getAvailableSlots(date, doctorId);

            if (slots.length === 0) {
                return `No available slots on ${date}${doctor_name ? ` with ${doctor_name}` : ''}. Please try another date.`;
            }

            // Group into morning/afternoon for readability
            const morning = slots.filter(s => parseInt(s.split(':')[0]) < 12);
            const afternoon = slots.filter(s => parseInt(s.split(':')[0]) >= 12);

            let response = `Available slots on ${date}${doctor_name ? ` with ${doctor_name}` : ''}:\n`;
            if (morning.length > 0) response += `\nMorning: ${morning.join(', ')}`;
            if (afternoon.length > 0) response += `\nAfternoon: ${afternoon.join(', ')}`;

            const doctors = db.getAllDoctors();
            response += `\n\nAvailable doctors: ${doctors.map(d => d.name).join(', ')}`;

            return response;
        } catch (error) {
            return `Error checking availability: ${error.message}`;
        }
    },
    {
        name: 'get_available_slots',
        description: 'Get available appointment time slots for a specific date. Optionally filter by doctor name.',
        schema: z.object({
            date: z.string().describe('Date in YYYY-MM-DD format'),
            doctor_name: z.string().optional().describe('Doctor name to filter by (optional)')
        })
    }
);

module.exports = getAvailableSlotsTool;
