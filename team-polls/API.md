# Team Polls API Documentation

## Authentication

### Create Anonymous User
Creates a new anonymous user and returns a JWT token.

**URL:** `/auth/anon`
**Method:** `POST`
**Auth required:** No

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

## Polls

### Create Poll
Create a new poll with question and options.

**URL:** `/poll`
**Method:** `POST`
**Auth required:** No
**Data constraints:**
```json
{
  "question": "[5-200 characters]",
  "options": ["[1-100 characters]", "..."],
  "expiresAt": "[ISO date string]"
}
```

**Data example:**
```json
{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "TypeScript", "Python", "Java", "C#"],
  "expiresAt": "2023-05-20T15:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "question": "What is your favorite programming language?",
  "options": [
    {
      "id": "option-1",
      "text": "JavaScript"
    },
    {
      "id": "option-2",
      "text": "TypeScript"
    },
    {
      "id": "option-3",
      "text": "Python"
    },
    {
      "id": "option-4",
      "text": "Java"
    },
    {
      "id": "option-5",
      "text": "C#"
    }
  ],
  "expiresAt": "2023-05-20T15:00:00.000Z"
}
```

### Get Poll Results
Get poll details and current results.

**URL:** `/poll/:id`
**Method:** `GET`
**Auth required:** No
**URL Parameters:** `id=[uuid]` where `id` is the UUID of the poll

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "question": "What is your favorite programming language?",
  "expiresAt": "2023-05-20T15:00:00.000Z",
  "closed": false,
  "totalVotes": 42,
  "options": [
    {
      "id": "option-3",
      "option_text": "Python",
      "vote_count": 15,
      "percentage": 36
    },
    {
      "id": "option-2",
      "option_text": "TypeScript",
      "vote_count": 12,
      "percentage": 29
    },
    {
      "id": "option-1",
      "option_text": "JavaScript",
      "vote_count": 8,
      "percentage": 19
    },
    {
      "id": "option-4",
      "option_text": "Java",
      "vote_count": 5,
      "percentage": 12
    },
    {
      "id": "option-5",
      "option_text": "C#",
      "vote_count": 2,
      "percentage": 5
    }
  ]
}
```

### Cast Vote
Vote on a poll (or change existing vote).

**URL:** `/poll/:id/vote`
**Method:** `POST`
**Auth required:** Yes (JWT token in Authorization header)
**Headers:** `Authorization: Bearer [token]`
**URL Parameters:** `id=[uuid]` where `id` is the UUID of the poll
**Rate limit:** 5 requests per second per user

**Data constraints:**
```json
{
  "optionId": "[uuid of option]"
}
```

**Data example:**
```json
{
  "optionId": "option-2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "pollId": "123e4567-e89b-12d3-a456-426614174000",
  "optionId": "option-2"
}
```

## WebSocket Events

### Client to Server

#### Join Poll Room
```javascript
socket.emit('join-poll', pollId);
```

#### Leave Poll Room
```javascript
socket.emit('leave-poll', pollId);
```

### Server to Client

#### Poll Updates
```javascript
socket.on('poll-update', (data) => {
  console.log('Poll updated:', data);
  // data contains poll update information
});
```

## Error Responses

All endpoints will return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (e.g., poll is closed)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": { } // Optional additional details
}
```

## Rate Limit Response

When rate limit is exceeded:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry after 2 seconds",
  "retryAfter": 2
}
```