# GP Clinic Receptionist Agent

An AI-powered virtual receptionist for GP clinics, integrated with WhatsApp via the Twilio API. Handles appointment booking, rescheduling, cancellation, and reminders through natural conversational chat.

## Features

- **Appointment Booking** — Patients can book appointments with available GPs at available time slots
- **Rescheduling** — Move existing appointments to a new date/time
- **Cancellation** — Cancel appointments with confirmation
- **Appointment Reminders** — Automated reminders sent 24h and 1h before appointments
- **Natural Language** — Conversational AI understands free-text messages
- **WhatsApp Integration** — Uses Twilio WhatsApp Business API

## Architecture

```
Patient (WhatsApp) → Twilio → Webhook (Express.js) → Agent (LangChain/OpenAI) → Database (SQLite)
                                                                                → Twilio (send replies)
Scheduler (node-cron) → Database → Twilio (send reminders)
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **AI/LLM:** OpenAI GPT-4 via LangChain
- **Messaging:** Twilio WhatsApp API
- **Database:** SQLite (via better-sqlite3)
- **Scheduler:** node-cron (for reminders)

## Setup

### Prerequisites

- Node.js 18+
- Twilio account with WhatsApp sandbox or Business API enabled
- OpenAI API key

### 1. Install dependencies

```bash
cd gp-clinic-agent
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Expose local server (for development)

```bash
npx ngrok http 3000
```

Copy the ngrok URL and set it as your Twilio WhatsApp webhook:
`https://your-ngrok-url.ngrok.io/webhook/whatsapp`

### 4. Configure Twilio

In your Twilio console:
- Go to Messaging → Try it out → Send a WhatsApp message
- Set the webhook URL to your ngrok URL + `/webhook/whatsapp`

### 5. Run the server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Your Twilio WhatsApp number (e.g., `whatsapp:+14155238886`) |
| `CLINIC_NAME` | Name of the GP clinic |
| `CLINIC_HOURS_START` | Clinic opening hour (e.g., `09`) |
| `CLINIC_HOURS_END` | Clinic closing hour (e.g., `17`) |
| `PORT` | Server port (default: 3000) |

## Usage

Patients send WhatsApp messages like:
- "I'd like to book an appointment with Dr. Smith"
- "Can I reschedule my appointment to next Tuesday?"
- "Cancel my appointment please"
- "What times are available tomorrow?"
- "I need to see a doctor this week"

The agent handles the conversation naturally, asks for missing information, and confirms actions.

## Project Structure

```
gp-clinic-agent/
├── src/
│   ├── index.js              # Express server & webhook
│   ├── agent.js              # LangChain agent with tools
│   ├── tools/
│   │   ├── bookAppointment.js
│   │   ├── rescheduleAppointment.js
│   │   ├── cancelAppointment.js
│   │   ├── getAvailableSlots.js
│   │   └── getPatientAppointments.js
│   ├── database.js           # SQLite database layer
│   ├── reminder.js           # Cron-based reminder scheduler
│   └── whatsapp.js           # Twilio WhatsApp helper
├── .env.example
├── package.json
└── README.md
```
