const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../database');

const bookAppointmentTool = tool(
    async ({ patient_phone, patient_name, doctor_name, date, time, reason }) => {
        try {
            // Get or create patient
            const patient = db.getOrCreatePatient(patient_phone, patient_name);

            // Find doctor
            const doctor = db.getDoctorByName(doctor_name);
            if (!doctor) {
                const allDoctors = db.getAllDoctors();
                const names = allDoctors.map(d => d.name).join(', ');
                return `Doctor "${doctor_name}" not found. Available doctors: ${names}`;
            }

            // Book appointment
            const result = db.bookAppointment(patient.id, doctor.id, date, time, reason);

            if (!result.success) {
                return result.message;
            }

            const appt = result.appointment;
            return `Appointment booked successfully!\n` +
                `Reference: ${appt.id.slice(0, 8).toUpperCase()}\n` +
                `Doctor: ${appt.doctor_name}\n` +
                `Date: ${appt.date}\n` +
                `Time: ${appt.time}\n` +
                (appt.reason ? `Reason: ${appt.reason}\n` : '') +
                `\nThe patient will receive a confirmation message.`;
        } catch (error) {
            return `Error booking appointment: ${error.message}`;
        }
    },
    {
        name: 'book_appointment',
        description: 'Book a new appointment for a patient. Requires patient phone, doctor name, date and time. Make sure the slot is available before booking.',
        schema: z.object({
            patient_phone: z.string().describe('Patient phone number with country code'),
            patient_name: z.string().optional().describe('Patient name'),
            doctor_name: z.string().describe('Name of the doctor'),
            date: z.string().describe('Appointment date in YYYY-MM-DD format'),
            time: z.string().describe('Appointment time in HH:MM format (24-hour)'),
            reason: z.string().optional().describe('Reason for the appointment')
        })
    }
);

module.exports = bookAppointmentTool;
