# Fix CORS 127.0.0.1 vs localhost Mismatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix CORS rejections that block the frontend (running on `http://127.0.0.1:3002`) from calling the backend API at `http://localhost:8000`.

**Architecture:** Browsers treat `localhost` and `127.0.0.1` as different origins even though they resolve to the same IP. The FastAPI CORS middleware only allows `http://localhost:*` origins, so any preflight (`OPTIONS`) request from `http://127.0.0.1:3002` is rejected with no `Access-Control-Allow-Origin` header. The fix is to add the `127.0.0.1` variants to the `allow_origins` list.

**Tech Stack:** Python 3, FastAPI, `fastapi.middleware.cors.CORSMiddleware`, Next.js (frontend)

---

### Task 1: Add 127.0.0.1 Origins to CORS Middleware

**Files:**
- Modify: `backend/app/main.py:55-61`

- [ ] **Step 1: Open the CORS configuration**

  Current state in `backend/app/main.py` lines 55-61:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://frontend:3000"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

- [ ] **Step 2: Replace the `allow_origins` list to include 127.0.0.1 variants**

  Replace lines 55-61 with:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=[
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "http://127.0.0.1:3002",
          "http://frontend:3000",
      ],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

- [ ] **Step 3: Restart the backend and verify CORS headers manually**

  Restart the backend server, then run this curl command from any terminal:
  ```bash
  curl -i -X OPTIONS http://localhost:8000/api/v1/assets/search \
    -H "Origin: http://127.0.0.1:3002" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization"
  ```

  Expected response headers must include:
  ```
  HTTP/1.1 200 OK
  access-control-allow-origin: http://127.0.0.1:3002
  access-control-allow-credentials: true
  access-control-allow-methods: *
  access-control-allow-headers: authorization
  ```

  If you see `HTTP/1.1 400` or missing `access-control-allow-origin`, the origin was not matched — double-check the list for typos.

- [ ] **Step 4: Open the browser at http://127.0.0.1:3002 and test asset search**

  - Navigate to the search/ticker input in the UI
  - Type any ticker (e.g. `AAPL`, `PETR4`)
  - Open DevTools → Network tab
  - Confirm the `OPTIONS` preflight for `/api/v1/assets/search` returns `200` and the subsequent `GET` also returns `200`
  - Confirm no `CORS` errors appear in the Console tab

- [ ] **Step 5: Test the market indexes endpoint**

  - Navigate to any page that loads market indexes
  - In DevTools → Network, confirm `GET /api/v1/market/indexes` returns `200` with no CORS errors

- [ ] **Step 6: Commit**

  ```bash
  git add backend/app/main.py
  git commit -m "fix: add 127.0.0.1 variants to CORS allowed origins"
  ```

---

## Self-Review

**Spec coverage:**
- Root cause (127.0.0.1 vs localhost mismatch) → Task 1, Step 2 ✓
- `/api/v1/assets/search` blocked → verified in Step 4 ✓
- `/api/v1/market/indexes` blocked → verified in Step 5 ✓
- Preflight (`OPTIONS`) returns correct headers → verified in Step 3 ✓

**Placeholder scan:** No TBDs or placeholders — all steps contain exact code or commands.

**Type consistency:** No types involved — pure config change.
