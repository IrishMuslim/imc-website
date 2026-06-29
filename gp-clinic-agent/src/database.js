const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'clinic.db');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initializeDatabase();
    }
    return db;
}

function initializeDatabase() {
    const database = getDb();

    database.exec(`
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            name TEXT,
            date_of_birth TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            speciality TEXT DEFAULT 'General Practice'
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 15,
            status TEXT DEFAULT 'confirmed',
            reason TEXT,
            reminder_24h_sent INTEGER DEFAULT 0,
            reminder_1h_sent INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );

        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
        CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
        CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
    `);

    // Seed doctors if empty
    const doctorCount = database.prepare('SELECT COUNT(*) as count FROM doctors').get();
    if (doctorCount.count === 0) {
        const insertDoctor = database.prepare('INSERT INTO doctors (id, name, speciality) VALUES (?, ?, ?)');
        insertDoctor.run(uuidv4(), 'Dr. Sarah Murphy', 'General Practice');
        insertDoctor.run(uuidv4(), 'Dr. James O\'Brien', 'General Practice');
        insertDoctor.run(uuidv4(), 'Dr. Aisha Khan', 'General Practice');
    }
}

// ===== Patient Functions =====

function getOrCreatePatient(phone, name = null) {
    const database = getDb();
    let patient = database.prepare('SELECT * FROM patients WHERE phone = ?').get(phone);

    if (!patient) {
        const id = uuidv4();
        database.prepare('INSERT INTO patients (id, phone, name) VALUES (?, ?, ?)').run(id, phone, name);
        patient = database.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    } else if (name && !patient.name) {
        database.prepare('UPDATE patients SET name = ? WHERE id = ?').run(name, patient.id);
        patient.name = name;
    }

    return patient;
}

function updatePatientName(phone, name) {
    const database = getDb();
    database.prepare('UPDATE patients SET name = ? WHERE phone = ?').run(name, phone);
}

// ===== Doctor Functions =====

function getAllDoctors() {
    const database = getDb();
    return database.prepare('SELECT * FROM doctors').all();
}

function getDoctorByName(name) {
    const database = getDb();
    return database.prepare('SELECT * FROM doctors WHERE LOWER(name) LIKE ?').get(`%${name.toLowerCase()}%`);
}

// ===== Appointment Functions =====

function getAvailableSlots(date, doctorId = null) {
    const database = getDb();
    const startHour = parseInt(process.env.CLINIC_HOURS_START || '09');
    const endHour = parseInt(process.env.CLINIC_HOURS_END || '17');
    const slotDuration = parseInt(process.env.SLOT_DURATION_MINUTES || '15');

    // Generate all possible slots
    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
            const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            allSlots.push(time);
        }
    }

    // Get booked slots
    let query = 'SELECT time, doctor_id FROM appointments WHERE date = ? AND status = ?';
    const params = [date, 'confirmed'];

    if (doctorId) {
        query += ' AND doctor_id = ?';
        params.push(doctorId);
    }

    const bookedAppointments = database.prepare(query).all(...params);
    const bookedSlots = new Set(bookedAppointments.map(a => a.time));

    // Filter available slots
    const available = allSlots.filter(slot => !bookedSlots.has(slot));

    return available;
}

function bookAppointment(patientId, doctorId, date, time, reason = null) {
    const database = getDb();
    const id = uuidv4();

    // Check if slot is still available
    const existing = database.prepare(
        'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status = ?'
    ).get(doctorId, date, time, 'confirmed');

    if (existing) {
        return { success: false, message: 'This slot is no longer available. Please choose another time.' };
    }

    database.prepare(
        'INSERT INTO appointments (id, patient_id, doctor_id, date, time, reason) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, patientId, doctorId, date, time, reason);

    const appointment = database.prepare(`
        SELECT a.*, d.name as doctor_name, p.name as patient_name, p.phone as patient_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = ?
    `).get(id);

    return { success: true, appointment };
}

function getPatientAppointments(patientId, status = 'confirmed') {
    const database = getDb();
    return database.prepare(`
        SELECT a.*, d.name as doctor_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = ? AND a.status = ?
        ORDER BY a.date, a.time
    `).all(patientId, status);
}

function rescheduleAppointment(appointmentId, newDate, newTime) {
    const database = getDb();

    const appointment = database.prepare('SELECT * FROM appointments WHERE id = ? AND status = ?').get(appointmentId, 'confirmed');
    if (!appointment) {
        return { success: false, message: 'Appointment not found or already cancelled.' };
    }

    // Check if new slot is available
    const existing = database.prepare(
        'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status = ? AND id != ?'
    ).get(appointment.doctor_id, newDate, newTime, 'confirmed', appointmentId);

    if (existing) {
        return { success: false, message: 'The new slot is not available. Please choose another time.' };
    }

    database.prepare(
        'UPDATE appointments SET date = ?, time = ?, reminder_24h_sent = 0, reminder_1h_sent = 0 WHERE id = ?'
    ).run(newDate, newTime, appointmentId);

    const updated = database.prepare(`
        SELECT a.*, d.name as doctor_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.id = ?
    `).get(appointmentId);

    return { success: true, appointment: updated };
}

function cancelAppointment(appointmentId) {
    const database = getDb();

    const appointment = database.prepare('SELECT * FROM appointments WHERE id = ? AND status = ?').get(appointmentId, 'confirmed');
    if (!appointment) {
        return { success: false, message: 'Appointment not found or already cancelled.' };
    }

    database.prepare('UPDATE appointments SET status = ? WHERE id = ?').run('cancelled', appointmentId);

    return { success: true, message: 'Appointment cancelled successfully.' };
}

function getUpcomingReminders() {
    const database = getDb();
    const now = new Date();

    // 24-hour reminders
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const reminders24h = database.prepare(`
        SELECT a.*, d.name as doctor_name, p.name as patient_name, p.phone as patient_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        WHERE a.date = ? AND a.status = 'confirmed' AND a.reminder_24h_sent = 0
    `).all(tomorrowDate);

    // 1-hour reminders
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const todayDate = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const oneHourTime = `${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}`;

    const reminders1h = database.prepare(`
        SELECT a.*, d.name as doctor_name, p.name as patient_name, p.phone as patient_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        WHERE a.date = ? AND a.time BETWEEN ? AND ? AND a.status = 'confirmed' AND a.reminder_1h_sent = 0
    `).all(todayDate, currentTime, oneHourTime);

    return { reminders24h, reminders1h };
}

function markReminderSent(appointmentId, type) {
    const database = getDb();
    const field = type === '24h' ? 'reminder_24h_sent' : 'reminder_1h_sent';
    database.prepare(`UPDATE appointments SET ${field} = 1 WHERE id = ?`).run(appointmentId);
}

module.exports = {
    getDb,
    initializeDatabase,
    getOrCreatePatient,
    updatePatientName,
    getAllDoctors,
    getDoctorByName,
    getAvailableSlots,
    bookAppointment,
    getPatientAppointments,
    rescheduleAppointment,
    cancelAppointment,
    getUpcomingReminders,
    markReminderSent
};
