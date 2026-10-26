# Auction API Endpoints

This document summarizes all available API endpoints and WebSocket events in the Auction system.

## 1. Auction Core (`/auction`)
These endpoints manage the high-level auction entities and their sub-sessions.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auction` | Create a new auction |
| `GET` | `/auction` | Get all auctions |
| `GET` | `/auction/:id` | Get details of a specific auction |
| `PATCH` | `/auction/:id` | Update auction details |
| `DELETE` | `/auction/:id` | Delete an auction |
| `POST` | `/auction/:id/session` | Create a new session for an auction |
| `GET` | `/auction/:id/session` | Get all sessions for a specific auction |
| `GET` | `/auction/:id/session/:sessionId` | Get details of a specific session |
| `PATCH` | `/auction/:id/session/:sessionId` | Update session details |
| `DELETE` | `/auction/:id/session/:sessionId` | Delete a session |
| `POST` | `/auction/session/:sessionId/item` | Create an item within a specific session |

---

## 2. Draft Auction (`/draft`)
Endpoints for orchestrating the live draft/auction process. Requires **JWT Bearer Token**.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/draft/sessions/:sessionId/start` | Start a pending draft session |
| `GET` | `/draft/sessions/:sessionId/state` | Get current active draft state (active turn, etc) |
| `POST` | `/draft/turns/:turnId/pick` | Make a pick for the active turn |
| `POST` | `/draft/turns/:turnId/skip` | Skip the active turn |

---

## 3. Scoped Resources
These resources are scoped by the `x-auction-id` header. All endpoints require this header.

### Teams (`/team`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/team` | Create a team in the current auction |
| `GET` | `/team` | Get all teams in the current auction |
| `GET` | `/team/:id` | Get specific team details |
| `PATCH` | `/team/:id` | Update team details |
| `DELETE` | `/team/:id` | Remove a team from the auction |

### Students (`/student`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/student` | Add a student to the auction |
| `GET` | `/student` | Get all students in the current auction |
| `GET` | `/student/:id` | Get specific student details |
| `PATCH` | `/student/:id` | Update student details |
| `DELETE` | `/student/:id` | Remove a student from the auction |

### Student Groups (`/student-group`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/student-group` | Create a student group |
| `GET` | `/student-group` | Get all groups in the auction |
| `GET` | `/student-group/:id` | Get specific group details |
| `PATCH` | `/student-group/:id` | Update group details |
| `DELETE` | `/student-group/:id` | Delete a group |

---

## 4. Authentication (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/admin/login` | Login as Admin |
| `POST` | `/auth/admin/logout` | Logout Admin |
| `POST` | `/auth/admin/register` | Register new Admin |
| `POST` | `/auth/team/login` | Login as Team |
| `POST` | `/auth/team/register` | Register new Team |

---

## 5. WebSocket Events (`/draft` namespace)
Real-time updates for the live draft session.

### Incoming (Client to Server)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `joinSession` | `{ "sessionId": "string" }` | Join a specific draft session room |

### Outgoing (Server to Client)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `draft:started` | `{ "sessionId": "UUID", "roundId": "UUID" }` | Notification that draft has started |
| `draft:pick_made` | `{ "sessionId": "UUID", "turnId": "UUID", ... }` | Notification of a successful pick |
| `draft:turn_skipped` | `{ "sessionId": "UUID", "turnId": "UUID", ... }` | Notification of a skipped turn |
| `draft:turn_updated` | `{ "sessionId": "UUID", "activeTurnId": "UUID", ... }` | Notification of active turn change |
