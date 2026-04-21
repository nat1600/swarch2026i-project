# Gamification Service API

This service exposes REST endpoints to manage user game sessions and user streaks for a gamification system.

---

## Base URLs

| Controller | Base URL |
|---|---|
| User Game Session | `/userGameSession` |
| User Streak | `/userStreak` |

---

## User Game Session Endpoints

### POST `/userGameSession/saveGameSession`

Saves a new game session for a user into the database.

- **Method:** `POST`
- **Request Body:** `UserGameSessionDTO` (JSON)
- **Success Response:** `201 Created` — returns the saved `UserGameSessionDTO`
- **Failure Response:** `500 Internal Server Error` — returned if the session could not be saved

**Example Request Body:**
```json
{
  "userName": "Ninja_Poliglota",
  "gamePlayed": "Chess",
  "score": 12,
  "intendedDate": "2024-03-11"
}
```

---

### DELETE `/userGameSession/deleteAllUserGameSessions`

Deletes all game sessions associated with a given user.

- **Method:** `DELETE`
- **Request Param:** `userName` (String)
- **Success Response:** `200 OK` — returns a `BooleanDTO` with `status: true`
- **Failure Response:** `500 Internal Server Error` — returned if the deletion failed

**Example Request:**
```
DELETE /userGameSession/deleteAllUserGameSessions?userName=Ninja_Poliglota
```

---

### DELETE `/userGameSession/deleteAllUserGameSessionsPerDate`

Deletes all game sessions for a given user on a specific date.

- **Method:** `DELETE`
- **Request Params:**
  - `userName` (String)
  - `intendedDate` (LocalDate — format: `yyyy-MM-dd`)
- **Success Response:** `200 OK` — returns a `BooleanDTO` with `status: true`
- **Failure Response:** `500 Internal Server Error` — returned if the deletion failed

**Example Request:**
```
DELETE /userGameSession/deleteAllUserGameSessionsPerDate?userName=Ninja_Poliglota&intendedDate=2024-03-11
```

---

### GET `/userGameSession/getAllUserGameSessions`

Retrieves all game sessions for a given user.

- **Method:** `GET`
- **Request Param:** `userName` (String)
- **Success Response:** `200 OK` — returns a list of `UserGameSession` objects
- **Failure Response:** `500 Internal Server Error` — returned if the retrieval failed

**Example Request:**
```
GET /userGameSession/getAllUserGameSessions?userName=Ninja_Poliglota
```

---

### GET `/userGameSession/getAllUserGameSessionsPerDate`

Retrieves all game sessions for a given user on a specific date.

- **Method:** `GET`
- **Request Params:**
  - `userName` (String)
  - `intendedDate` (LocalDate — format: `yyyy-MM-dd`)
- **Success Response:** `200 OK` — returns a list of `UserGameSession` objects
- **Failure Response:** `500 Internal Server Error` — returned if the retrieval failed

**Example Request:**
```
GET /userGameSession/getAllUserGameSessionsPerDate?userName=Ninja_Poliglota&intendedDate=2024-03-11
```

---

### GET `/userGameSession/getAllUserGameSessionsPerPoints`

Retrieves all game sessions for a given user that match a specific points value.

- **Method:** `GET`
- **Request Params:**
  - `userName` (String)
  - `intendedPoints` (Integer)
- **Success Response:** `200 OK` — returns a list of `UserGameSession` objects
- **Failure Response:** `500 Internal Server Error` — returned if the retrieval failed

**Example Request:**
```
GET /userGameSession/getAllUserGameSessionsPerPoints?userName=Ninja_Poliglota&intendedPoints=100
```

---

## User Streak Endpoints

### POST `/userStreak/postUserActivity`

Registers a user's activity for the current day and updates their streak accordingly. If the user has no existing streak, a new one is created starting at 1. If the user was active the previous day, the streak is incremented. If the user missed one or more days, the streak resets to 1 while preserving their longest streak record.

- **Method:** `POST`
- **Request Param:** `userName` (String)
- **Success Response:** `201 Created` — returns the updated `UserStreakDTO`
- **Failure Response:** `500 Internal Server Error` — returned if the activity could not be registered

**Example Request:**
```
POST /userStreak/postUserActivity?userName=Ninja_Poliglota
```

**Example Response Body:**
```json
{
  "currentStreak": 5,
  "longestStreak": 15
}
```

---

### GET `/userStreak/getUserStreakData`

Retrieves the current streak data for a given user, including their current streak and longest streak ever recorded.

- **Method:** `GET`
- **Request Param:** `userName` (String)
- **Success Response:** `200 OK` — returns the `UserStreakDTO` for the user
- **Failure Response:** `500 Internal Server Error` — returned if the data could not be retrieved

**Example Request:**
```
GET /userStreak/getUserStreakData?userName=Ninja_Poliglota
```

**Example Response Body:**
```json
{
  "currentStreak": 5,
  "longestStreak": 15
}
```

---

## Response DTOs

### `UserStreakDTO`
| Field | Type | Description |
|---|---|---|
| `currentStreak` | `int` | The user's current consecutive day streak |
| `longestStreak` | `int` | The longest streak the user has ever achieved |

### `BooleanDTO`
| Field | Type | Description |
|---|---|---|
| `status` | `boolean` | `true` if the operation succeeded, `false` otherwise |
