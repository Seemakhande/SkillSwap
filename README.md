# SkillSwap — Peer-to-Peer Learning & Mentorship Platform

A full-stack web application where users exchange knowledge through a structured
mentorship system. Users can offer skills, book learning sessions, chat in real
time, and build credibility through reviews — all powered by a credit-based
internal economy.

## Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS, Axios, Socket.io client, lucide-react icons
- **Backend:** Node.js, Express 5, MySQL (`mysql2`), Socket.io
- **Security:** JWT stored in HTTP-only cookies, bcrypt password hashing, CORS allow-list

## Features

- JWT-cookie auth with protected routes
- Profile with skills offered / skills to learn, bio, rating and availability slots
- Marketplace with search, category filter, rating filter and pagination
- Booking flow with timeslot locking to prevent double booking
- Credit-based economy (earn by teaching, spend by learning) with full transaction log
- Real-time one-to-one chat (Socket.io) gated to pairs who share a booked session, with DB persistence
- Reviews and ratings — one per session, automatic average recompute
- Session cancellation with automatic credit refund

## Project Layout

```
Skillswap/
  backend/   Express API + Socket.io
  frontend/  React + Vite SPA
```

## Prerequisites

- Node.js 18+
- MySQL 8+ running locally (or update `backend/.env`)

## Setup

### 1. Backend

```bash
cd backend
npm install
# Edit .env and set DB credentials + JWT_SECRET
npm run init-db   # creates DB + tables + seed skills
npm run dev       # starts API on http://localhost:5000
```

`backend/.env` keys:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=skillSwap
JWT_SECRET=change-me
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # Vite dev server (usually http://localhost:5173)
```

The frontend expects the API at `http://localhost:5000/api` by default. To
override, create `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000/api
```

## REST API Surface

| Method | Path                       | Description                         |
|--------|----------------------------|-------------------------------------|
| POST   | /api/auth/register         | Create account                      |
| POST   | /api/auth/login            | Log in                              |
| POST   | /api/auth/logout           | Log out                             |
| GET    | /api/auth/me               | Current user                        |
| GET    | /api/user/profile          | Own profile + skills + availability |
| PUT    | /api/user/update           | Update profile/skills/availability  |
| GET    | /api/user/:id              | Mentor details                      |
| GET    | /api/users                 | Browse mentors (filters/pagination) |
| GET    | /api/skills                | All skills                          |
| GET    | /api/skills/categories     | Distinct categories                 |
| GET    | /api/timeslots/:mentorId   | Mentor's open slots                 |
| POST   | /api/sessions/book         | Book a session                      |
| GET    | /api/sessions/my           | My sessions                         |
| POST   | /api/sessions/:id/cancel   | Cancel + refund                     |
| POST   | /api/reviews               | Leave a review                      |
| GET    | /api/reviews/:mentorId     | Reviews for a mentor                |
| GET    | /api/chat/contacts         | Contacts (people you share sessions with) |
| GET    | /api/chat/history?contactId= | Chat history                      |
| GET    | /api/transactions          | Credit transaction history          |

## Socket.io Events

Client → server:
- `join_room` — room id is the sorted pair `"<smallerUserId>_<largerUserId>"`
- `send_message` — `{ receiverId, text }` (sender id is read from the auth cookie)

Server → client:
- `receive_message` — persisted message with `id`, `senderId`, `receiverId`, `text`, `timestamp`, `roomId`

## Credit Rules

- New users get a 20-credit signup bonus
- Booking deducts 10 credits from the learner
- Cancelling an upcoming session refunds 10 credits
- When a learner leaves a review after a session, the mentor earns 10 credits and the session is marked completed
