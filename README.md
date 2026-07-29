# InterviewPrep — Mock Interview Platform

## [https://pizza-ochre-chi.vercel.app/](https://pizza-ochre-chi.vercel.app/)

## [Demo Video](https://drive.google.com/file/d/1Q6K9GWjVJDOdCqDS_svgDrMzgdhg8ae3/view?usp=sharing)

InterviewPrep connects candidates with expert interviewers for live practice sessions, featuring real-time video, collaborative chat, and an LLM-question generator in the interviewer dashboard.

---

## ⚡ Core Features

*   **Custom Authentication:** JWT-based user session management backed by Redis.
*   **Live Interview Rooms:** Real-time video conferencing, screen sharing, and messaging powered by Stream.
*   **LLM Question Generator:** On-demand, role-specific questions and answers generated live during the call (powered by Google Gemini).
*   **Credit Economy:** Credits are bought via Stripe Payment gateway. Credits are transferred to the interviewer only after they submit a detailed candidate evaluation report.
*   **Payout Request System:** Interviewers can request credit withdrawals, notifying admins through mail via Resend. Admin will clear the payment as requested.
*   **Feedback & Reviews:** Post-session recordings are available for candidates to watch, along with options to rate and review their interviewer.
*   **Available Slots:** Interviewers can set their free time slots which in-turn will be booked by the candidates. Automated purging of expired availability slots from database.

---

## 🛠️ Tech Stack

*   **Frontend & Backend:** Next.js (App Router), React 19, Redux Toolkit
*   **Styling:** Tailwind CSS 4.0
*   **Database** MongoDB, Redis
*   **APIs & Integrations:** Stream SDK (WebRTC & Chat), Google Gemini, Stripe, Resend

---

* The lean() option in Mongoose skip hydrating the result documents and return plain old JavaScript objects (POJOs) instead of full Mongoose Documents.
* 
---

## 🚀 Getting Started

### 1. Configure Environment Variables
```env
MONGODB_URI="your_mongodb_uri"
STREAM_API_KEY="your_stream_api_key"
STREAM_API_SECRET="your_stream_api_secret"
JWT_KEY="your_jwt_secret"
REDIS_PASS="your_redis_password"
GEMINI_API_KEY="your_gemini_api_key"
STRIPE_KEY="your_stripe_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
RESEND_API_KEY="your_resend_api_key"
ADMIN_MAIL="your_admin_email"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Run the Application
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
