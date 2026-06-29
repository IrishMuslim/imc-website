const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../database');

const getPatientAppointmentsTool = tool(
    async ({ patient_phone }) => {
        try {
            const patient = db.getOrCreatePatient(patient_phone);
            const appointments = db.getPatientAppointments(patient.id);

            if (appointments.length === 0) {
                return 'No upcoming appointments found for this patient.';
            }

            const list = appointments.map(a =>
                `• ${a.date} at ${a.time} with ${a.doctor_name} (Ref: ${a.id.slice(0, 8).toUpperCase()})`
            ).join('\n');

            return `Upcoming appointments:\n${list}`;
        } catch (error) {
            return `Error fetching appointments: ${error.message}`;
        }
    },
    {
        name: 'get_patient_appointments',
        description: 'Get all upcoming confirmed appointments for a patient by their phone number.',
        schema: z.object({
            patient_phone: z.string().describe('Patient phone number with country code')
        })
    }
);

module.exports = getPatientAppointmentsTool;
