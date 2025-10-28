
# Life Pilot AI - Contract Between AI Tools (MVP)

This document serves as the official API contract and data logic specification for the AI tools responsible for the backend and database layers of the Life Pilot AI application. The Frontend AI Tool has been developed according to this contract. Strict adherence is required to ensure system integrity.

## 1. General Conventions

- **API Style**: RESTful JSON APIs.
- **Authentication**: All endpoints require a valid Authentication Header: `Authorization: Bearer [JWT or Session Token]`. The token is acquired after an initial Firebase authentication flow.
- **Data Types**: Adhere to the TypeScript types defined for the frontend. The key types are `Pillar`, `Scores`, `DailyAction`, and `HarmonyData`.
- **Language Support**: All user-facing text fields (`text_en`, `text_ur`) must be populated.

## 2. Database Schema (PostgreSQL)

The database AI tool must create tables that can represent the following logical structure. Snake case (`snake_case`) must be used for all column names.

- **`users` table**: Stores user profile information.
  - `id` (PK, UUID)
  - `firebase_uid` (VARCHAR, UNIQUE)
  - `created_at` (TIMESTAMPZ)
  - `is_initial_assessment_complete` (BOOLEAN, default: false)

- **`daily_harmony_scores` table**: Stores a daily snapshot of the user's scores.
  - `id` (PK, BIGSERIAL)
  - `user_id` (FK to `users.id`)
  - `score_date` (DATE, UNIQUE per user_id)
  - `pilot_score` (INTEGER)
  - `mind_score` (INTEGER)
  - `body_score` (INTEGER)
  - `heart_score` (INTEGER)
  - `soul_score` (INTEGER)

- **`daily_actions` table**: Stores the assigned daily action for a user.
  - `id` (PK, BIGSERIAL)
  - `user_id` (FK to `users.id`)
  - `action_id_ref` (VARCHAR) - e.g., "A101"
  - `pillar` (VARCHAR) - "mind", "body", "heart", or "soul"
  - `text_en` (TEXT)
  - `text_ur` (TEXT)
  - `is_completed` (BOOLEAN, default: false)
  - `target_date` (DATE, UNIQUE per user_id)
  - `completion_time` (TIMESTAMPZ, nullable)
  - `energy_rating` (INTEGER, nullable) - 1 to 5

- **`murshad_sessions` table**: Logs interactions with the Digital Murshad.
  - `id` (PK, BIGSERIAL)
  - `user_id` (FK to `users.id`)
  - `timestamp` (TIMESTAMPZ)
  - `user_message` (TEXT)
  - `murshad_reply` (TEXT)
  - `language` (VARCHAR) - "en" or "ur"

## 3. API Endpoints

The Backend AI Tool must implement the following endpoints. Base URL: `/api/v1`

---

### **3.1 Get User Harmony Data (Dashboard)**

- **Endpoint**: `GET /user/harmony`
- **Description**: Retrieves the user's latest Pilot Score, pillar scores, and current daily action.
- **Logic**:
  - Find the most recent `daily_harmony_scores` record for the authenticated user.
  - Find the `daily_actions` record for the current `target_date` for the user.
  - If data is older than 72 hours (per the Time Decay Rule), `pilotScore` should be returned as `null`.
- **Success Response (200 OK)**:
  ```json
  {
    "pilotScore": 75, // or null
    "scores": {
      "mind": 80,
      "body": 65,
      "heart": 70,
      "soul": 85
    },
    "currentAction": {
      "actionId": "A101",
      "pillar": "Heart",
      "text_en": "Practice Sukoon Meditation for 10 minutes...",
      "text_ur": "...",
      "isCompleted": false,
      "targetDate": "YYYY-MM-DD"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or missing auth token.

---

### **3.2 Post Initial Assessment**

- **Endpoint**: `POST /user/assessment/initial`
- **Description**: Submits the user's answers to the 8 initial questions and calculates the first Pilot Score.
- **Request Body**:
  ```json
  {
    "q1_soul": true,
    "q2_soul": false,
    "q3_heart": true,
    "q4_heart": true,
    "q5_mind": false,
    "q6_mind": true,
    "q7_body": true,
    "q8_body": false
  }
  ```
- **Logic**:
  - Calculate scores: 10 points for each `true` answer, summed up per pillar (2 questions per pillar, max 20 pts). Then scale to 100 (i.e., each answer is worth 50 points for the pillar).
  - Create the first `daily_harmony_scores` record for the user.
  - Set `is_initial_assessment_complete` to `true` for the user.
  - Assign the first `daily_action`.
- **Success Response (200 OK)**: Empty body.
- **Error Responses**:
  - `400 Bad Request`: Missing answers or invalid format.
  - `401 Unauthorized`.

---

### **3.3 Log Murshad Session and Get Response**

- **Endpoint**: `POST /murshad/session`
- **Description**: Forwards the user's message to the Gemini API, gets a reply, and logs the session.
- **Request Body**:
  ```json
  {
    "message": "I'm struggling with focus.",
    "language": "English",
    "history": [
      { "sender": "user", "text": "Hi" },
      { "sender": "murshad", "text": "Hello, how can I help?" }
    ]
  }
  ```
- **Logic**:
  - **LLM Safety**: Implement prompt injection filtering before sending to Gemini.
  - **Gemini Call**: Use the official "Digital Murshad Persona & Safety" system instruction.
  - **Non-Retention**: Ensure Gemini API calls are configured to be non-retaining.
  - Log the user message and the LLM reply in the `murshad_sessions` table.
- **Success Response (200 OK)**:
  ```json
  {
    "reply": "Focus is a challenge we all face...",
    "suggestedAction": { // Optional, can be null
      "actionId": "A102",
      "pillar": "Mind",
      "text_en": "Try the Pomodoro Technique for one task today.",
      "text_ur": "..."
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`.
  - `500 LLM Failure`: If the Gemini API call fails.

---

### **3.4 Complete Daily Action**

- **Endpoint**: `POST /actions/complete`
- **Description**: Logs the completion of the current daily action and the user's energy rating.
- **Request Body**:
  ```json
  {
    "actionId": "A101",
    "completionTime": "2025-10-28T10:30:00Z",
    "energyRating": 4 // 1 (Lowest) - 5 (Highest)
  }
  ```
- **Logic**:
  - Find the current `daily_actions` record for the user.
  - Mark `is_completed` as `true` and save `completionTime` and `energyRating`.
  - Recalculate harmony scores: Add 20 points to the pillar score associated with the action (max 100). Update the `pilot_score`.
- **Success Response (200 OK)**: Empty body.
- **Error Responses**:
  - `400 Bad Request`: Invalid Action ID.
  - `401 Unauthorized`.

---

### **3.5 Get Session/Action History**

- **Endpoint**: `GET /user/history?limit=7`
- **Description**: Retrieves a combined list of the user's recent sessions and completed actions.
- **Logic**:
  - Query `murshad_sessions` and `daily_actions` (where `is_completed` is true).
  - Combine, sort by timestamp descending, and take the number specified by `limit`.
- **Success Response (200 OK)**:
  ```json
  [
    { 
      "type": "action", 
      "timestamp": "2025-10-28T10:30:00Z", 
      "actionText": "Practice Sukoon Meditation...",
      "completed": true 
    },
    { 
      "type": "session", 
      "timestamp": "2025-10-27T18:00:00Z", 
      "snippet": "Discussed challenges with focus..."
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`.
