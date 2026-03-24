#!/usr/bin/env bash
# =============================================================================
# viitor-educat — Comprehensive API Security & Privilege Test Suite
# =============================================================================
# Usage: bash test_api.sh [BASE_URL]
# Default BASE_URL: http://localhost:3001
#
# What this tests:
#   - Auth: register, login, JWT required, role escalation
#   - Admin endpoints: admin-only access
#   - Lessons: CRUD, PATCH, questions, privilege isolation
#   - Classrooms: join, assign lesson, student/teacher isolation
#   - Quizzes: CRUD, attempt, score, privilege isolation
#   - Bookmarks: CRUD, toggle, check, ownership
#   - Music: tracks (public), preferences (auth required)
#   - Student: completions, stats, progress
# =============================================================================

BASE="${1:-http://localhost:3001}"
API="$BASE/api"
AUTH="$BASE/auth"
PASS=0
FAIL=0
SKIP=0

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

section() { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}"; }
pass()    { echo -e "${GREEN}  ✓ $1${NC}"; ((PASS++)); }
fail()    { echo -e "${RED}  ✗ $1${NC}"; ((FAIL++)); }
skip()    { echo -e "${YELLOW}  ⊘ $1 (skipped: $2)${NC}"; ((SKIP++)); }
info()    { echo -e "    ${YELLOW}↳ $1${NC}"; }

# ── HTTP helper ───────────────────────────────────────────────────────────────
# Usage: req <METHOD> <PATH> [TOKEN] [BODY_JSON]
# Returns HTTP status code; body saved in $BODY
req() {
  local method="$1" path="$2" token="$3" body="$4"
  local args=(-s -o /tmp/api_body -w "%{http_code}" -X "$method")
  args+=(-H "Content-Type: application/json")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]]  && args+=(-d "$body")
  STATUS=$(curl "${args[@]}" "$BASE$path")
  BODY=$(cat /tmp/api_body)
}

# Extract a JSON field (naive but dependency-free)
jq_get() { echo "$BODY" | grep -o "\"$1\":\"[^\"]*\"" | head -1 | cut -d'"' -f4; }
jq_num()  { echo "$BODY" | grep -o "\"$1\":[0-9]*" | head -1 | grep -o '[0-9]*$'; }

assert_status() {
  local label="$1" expected="$2"
  if [[ "$STATUS" == "$expected" ]]; then
    pass "$label → HTTP $STATUS"
  else
    fail "$label → expected HTTP $expected got HTTP $STATUS"
    info "Body: $(echo "$BODY" | head -c 200)"
  fi
}

assert_status_one_of() {
  local label="$1"; shift
  for code in "$@"; do
    [[ "$STATUS" == "$code" ]] && { pass "$label → HTTP $STATUS"; return; }
  done
  fail "$label → expected one of [$*] got HTTP $STATUS"
  info "Body: $(echo "$BODY" | head -c 200)"
}

# =============================================================================
# 0. SANITY CHECK
# =============================================================================
section "0. Server Reachability"
req GET / "" ""
if [[ "$STATUS" == "200" || "$STATUS" == "404" ]]; then
  pass "Server is reachable at $BASE"
else
  fail "Server not reachable at $BASE (got $STATUS). Is the backend running?"
  echo -e "\n${RED}Aborting — backend not reachable.${NC}"
  exit 1
fi

# =============================================================================
# 1. AUTH ENDPOINTS
# =============================================================================
section "1. Auth — Register & Login"

TS=$(date +%s)
STUDENT_EMAIL="student_${TS}@test.com"
TEACHER_EMAIL="teacher_${TS}@test.com"
TEACHER2_EMAIL="teacher2_${TS}@test.com"
PASS_PLAIN="TestPass123!"

# Register student
req POST /auth/register "" "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"$PASS_PLAIN\",\"role\":\"STUDENT\"}"
assert_status "Register STUDENT" "201"
STUDENT_TOKEN=$(jq_get token)
STUDENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Register teacher 1
req POST /auth/register "" "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$PASS_PLAIN\",\"role\":\"TEACHER\"}"
assert_status "Register TEACHER" "201"
TEACHER_TOKEN=$(jq_get token)
TEACHER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Register teacher 2 (for cross-user isolation tests)
req POST /auth/register "" "{\"email\":\"$TEACHER2_EMAIL\",\"password\":\"$PASS_PLAIN\",\"role\":\"TEACHER\"}"
assert_status "Register TEACHER 2" "201"
TEACHER2_TOKEN=$(jq_get token)

# Duplicate registration
req POST /auth/register "" "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"$PASS_PLAIN\",\"role\":\"STUDENT\"}"
assert_status "Duplicate register → 409" "409"

# Role escalation (try to register as ADMIN)
req POST /auth/register "" "{\"email\":\"admin_${TS}@test.com\",\"password\":\"$PASS_PLAIN\",\"role\":\"ADMIN\"}"
if [[ "$STATUS" == "400" || "$STATUS" == "409" || "$STATUS" == "201" ]]; then
  # If 201, check if role is ADMIN
  if [[ "$STATUS" == "201" ]]; then
    ROLE=$(echo "$BODY" | grep -o '"role":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [[ "$ROLE" == "ADMIN" ]]; then
      fail "Role escalation ALLOWED — user registered as ADMIN!"
    else
      pass "Role escalation blocked (registered as $ROLE, not ADMIN)"
    fi
  else
    pass "Self-registration as ADMIN blocked → HTTP $STATUS"
  fi
fi

# Login
req POST /auth/login "" "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"$PASS_PLAIN\"}"
assert_status "Login STUDENT" "200"

# Bad credentials
req POST /auth/login "" "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"wrongpassword\"}"
assert_status "Login bad password → 401" "401"

req POST /auth/login "" "{\"email\":\"nobody@nowhere.com\",\"password\":\"$PASS_PLAIN\"}"
assert_status "Login nonexistent user → 401" "401"

# Auth/me
req GET /auth/me "$STUDENT_TOKEN" ""
assert_status "GET /auth/me with valid token" "200"

req GET /auth/me "" ""
assert_status "GET /auth/me without token → 401" "401"

req GET /auth/me "invalidtoken" ""
assert_status "GET /auth/me with garbage token → 401" "401"

# =============================================================================
# 2. ADMIN ENDPOINTS
# =============================================================================
section "2. Admin — Privilege Enforcement"

req GET /admin/users "$STUDENT_TOKEN" ""
assert_status "GET /admin/users as STUDENT → 403" "403"

req GET /admin/users "$TEACHER_TOKEN" ""
assert_status "GET /admin/users as TEACHER → 403" "403"

req GET /admin/users "" ""
assert_status "GET /admin/users unauthenticated → 401" "401"

req GET /admin/stats "$STUDENT_TOKEN" ""
assert_status "GET /admin/stats as STUDENT → 403" "403"

req GET /admin/stats "" ""
assert_status "GET /admin/stats unauthenticated → 401" "401"

# =============================================================================
# 3. LESSONS
# =============================================================================
section "3. Lessons — CRUD & Privilege"

# Public lessons (no auth required)
req GET /lessons "" ""
assert_status_one_of "GET /lessons (public, no auth)" "200" "401"

# Teacher creates a lesson
req POST /lessons "$TEACHER_TOKEN" \
  '{"title":"Test Lesson Alpha","content":"<p>Hello world</p>","status":"DRAFT","questions":[{"prompt":"What is 2+2?","type":"SHORT_ANSWER","correctAnswer":"4"}]}'
assert_status "Teacher creates lesson" "201"
LESSON_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
info "Created lesson ID: $LESSON_ID"

# Student cannot create lesson
req POST /lessons "$STUDENT_TOKEN" '{"title":"Sneaky","content":"hack","status":"PUBLIC"}'
assert_status "Student cannot create lesson → 403" "403"

# Unauthenticated cannot create
req POST /lessons "" '{"title":"Anon","content":"hack"}'
assert_status "Unauthenticated cannot create lesson → 401" "401"

if [[ -n "$LESSON_ID" ]]; then
  # GET lesson
  req GET "/lessons/$LESSON_ID" "$TEACHER_TOKEN" ""
  assert_status "Teacher can GET own lesson" "200"

  # PATCH lesson — add questions
  req PATCH "/lessons/$LESSON_ID" "$TEACHER_TOKEN" \
    '{"title":"Test Lesson Alpha (edited)","questions":[{"prompt":"What is 3+3?","type":"SHORT_ANSWER","correctAnswer":"6"}]}'
  assert_status "Teacher PATCHes lesson (with questions)" "200"

  # Verify questions were saved
  req GET "/lessons/$LESSON_ID" "$TEACHER_TOKEN" ""
  if echo "$BODY" | grep -q '"questions"'; then
    pass "Questions present in lesson response"
  else
    fail "Questions MISSING from lesson response after PATCH"
  fi

  # Teacher 2 cannot PATCH teacher 1's lesson
  req PATCH "/lessons/$LESSON_ID" "$TEACHER2_TOKEN" '{"title":"Hijacked"}'
  assert_status "Other teacher cannot PATCH lesson → 403" "403"

  # Student cannot PATCH lesson
  req PATCH "/lessons/$LESSON_ID" "$STUDENT_TOKEN" '{"title":"Hijacked"}'
  assert_status "Student cannot PATCH lesson → 403" "403"

  # Unauthenticated cannot PATCH
  req PATCH "/lessons/$LESSON_ID" "" '{"title":"Anon"}'
  assert_status "Unauthenticated cannot PATCH lesson → 401" "401"

  # Student cannot DELETE lesson
  req DELETE "/lessons/$LESSON_ID" "$STUDENT_TOKEN" ""
  assert_status "Student cannot DELETE lesson → 403" "403"

  # Teacher 2 cannot DELETE teacher 1's lesson
  req DELETE "/lessons/$LESSON_ID" "$TEACHER2_TOKEN" ""
  assert_status "Other teacher cannot DELETE lesson → 403" "403"

  # Publish lesson (required for student visibility)
  req PATCH "/lessons/$LESSON_ID" "$TEACHER_TOKEN" '{"status":"PUBLIC"}'
  assert_status "Teacher publishes lesson" "200"

  # Student can view published lesson
  req GET "/lessons/$LESSON_ID" "$STUDENT_TOKEN" ""
  assert_status "Student can view PUBLIC lesson" "200"

  # Answer question
  QUESTION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | grep -v "$LESSON_ID" | head -1 | cut -d'"' -f4)
  if [[ -n "$QUESTION_ID" ]]; then
    req POST "/lessons/$LESSON_ID/questions/$QUESTION_ID/answer" "$STUDENT_TOKEN" '{"answer":"6"}'
    assert_status_one_of "Student answers lesson question" "200" "201"
  else
    skip "Lesson question answer" "Could not extract question ID"
  fi

  # Complete lesson
  req POST "/lessons/$LESSON_ID/complete" "$STUDENT_TOKEN" ""
  assert_status_one_of "Student completes lesson" "200" "201"

else
  skip "Lesson PATCH/DELETE/privilege tests" "Lesson creation failed"
fi

# =============================================================================
# 4. CLASSROOMS
# =============================================================================
section "4. Classrooms — Join, Assign, Isolation"

# Student cannot create classroom
req POST /classrooms "$STUDENT_TOKEN" '{"name":"Student Hack","description":"no"}'
assert_status "Student cannot create classroom → 403" "403"

# Teacher creates classroom
req POST /classrooms "$TEACHER_TOKEN" '{"name":"Class Alpha","description":"Test classroom"}'
assert_status "Teacher creates classroom" "201"
CLASSROOM_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
JOIN_CODE=$(jq_get joinCode)
info "Classroom ID: $CLASSROOM_ID, Join code: $JOIN_CODE"

# Unauthenticated cannot create
req POST /classrooms "" '{"name":"Anon"}'
assert_status "Unauthenticated cannot create classroom → 401" "401"

# List classrooms
req GET /classrooms "$TEACHER_TOKEN" ""
assert_status "Teacher lists own classrooms" "200"

req GET /classrooms "$STUDENT_TOKEN" ""
assert_status "Student lists enrolled classrooms" "200"

req GET /classrooms "" ""
assert_status "Unauthenticated cannot list classrooms → 401" "401"

if [[ -n "$JOIN_CODE" ]]; then
  # Student joins via code
  req POST /classrooms/join "$STUDENT_TOKEN" "{\"joinCode\":\"$JOIN_CODE\"}"
  assert_status "Student joins classroom" "200"

  # Cannot join twice
  req POST /classrooms/join "$STUDENT_TOKEN" "{\"joinCode\":\"$JOIN_CODE\"}"
  assert_status "Student joins classroom twice → 400" "400"

  # Teacher cannot join classroom (only students)
  req POST /classrooms/join "$TEACHER2_TOKEN" "{\"joinCode\":\"$JOIN_CODE\"}"
  assert_status "Teacher cannot join classroom → 403" "403"
else
  skip "Classroom join tests" "Join code not captured"
fi

if [[ -n "$CLASSROOM_ID" ]]; then
  # GET classroom detail (teacher sees students)
  req GET "/classrooms/$CLASSROOM_ID" "$TEACHER_TOKEN" ""
  assert_status "Teacher gets classroom detail" "200"
  if echo "$BODY" | grep -q '"students"'; then
    pass "Classroom detail includes students array"
  else
    fail "Classroom detail MISSING students array"
  fi

  # Non-member student cannot see classroom
  req GET "/classrooms/$CLASSROOM_ID" "$TEACHER2_TOKEN" ""
  assert_status "Other teacher cannot get classroom → 403" "403"

  # Assign lesson to classroom
  if [[ -n "$LESSON_ID" ]]; then
    req POST "/classrooms/$CLASSROOM_ID/lessons" "$TEACHER_TOKEN" "{\"lessonId\":\"$LESSON_ID\"}"
    assert_status "Teacher assigns lesson to classroom" "201"

    # Teacher 2 cannot assign to teacher 1's classroom
    req POST "/classrooms/$CLASSROOM_ID/lessons" "$TEACHER2_TOKEN" "{\"lessonId\":\"$LESSON_ID\"}"
    assert_status "Other teacher cannot assign lesson → 403" "403"

    # Remove lesson from classroom
    req DELETE "/classrooms/$CLASSROOM_ID/lessons/$LESSON_ID" "$TEACHER_TOKEN" ""
    assert_status "Teacher removes lesson from classroom" "200"
  fi
fi

# Bad join code
req POST /classrooms/join "$STUDENT_TOKEN" '{"joinCode":"XXXXXX"}'
assert_status "Bad join code returns 404" "404"

# =============================================================================
# 5. QUIZZES
# =============================================================================
section "5. Quizzes — CRUD, Attempt, Isolation"

# List quizzes (auth required)
req GET /quizzes "$STUDENT_TOKEN" ""
assert_status "Student lists quizzes (PUBLISHED only)" "200"

req GET /quizzes "$TEACHER_TOKEN" ""
assert_status "Teacher lists all quizzes" "200"

req GET /quizzes "" ""
assert_status "Unauthenticated cannot list quizzes → 401" "401"

# Student cannot create quiz
req POST /quizzes "$STUDENT_TOKEN" '{"title":"Hacked Quiz"}'
assert_status "Student cannot create quiz → 403" "403"

# Teacher creates quiz
req POST /quizzes "$TEACHER_TOKEN" '{"title":"Algebra Quiz","description":"Algebra basics","status":"DRAFT"}'
assert_status "Teacher creates quiz" "201"
QUIZ_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
info "Quiz ID: $QUIZ_ID"

if [[ -n "$QUIZ_ID" ]]; then
  # Add question to quiz
  req POST "/quizzes/$QUIZ_ID/questions" "$TEACHER_TOKEN" \
    '{"question":"What is 10*10?","type":"SHORT_ANSWER","correctAnswer":"100","points":5}'
  assert_status "Teacher adds question to quiz" "201"
  QUESTION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  # Teacher 2 cannot add question to teacher 1's quiz
  req POST "/quizzes/$QUIZ_ID/questions" "$TEACHER2_TOKEN" \
    '{"question":"Sneaky?","correctAnswer":"yes"}'
  assert_status "Other teacher cannot add question → 403" "403"

  # Student cannot GET DRAFT quiz
  req GET "/quizzes/$QUIZ_ID" "$STUDENT_TOKEN" ""
  assert_status "Student cannot GET DRAFT quiz → 404" "404"

  # Verify teacher gets correctAnswer, student doesn't
  req GET "/quizzes/$QUIZ_ID" "$TEACHER_TOKEN" ""
  if echo "$BODY" | grep -q '"correctAnswer"'; then
    pass "Teacher sees correctAnswer in quiz questions"
  else
    fail "Teacher does NOT see correctAnswer"
  fi

  # Publish quiz
  req PUT "/quizzes/$QUIZ_ID" "$TEACHER_TOKEN" '{"status":"PUBLISHED"}'
  assert_status "Teacher publishes quiz" "200"

  # Student can now GET it but without correctAnswer
  req GET "/quizzes/$QUIZ_ID" "$STUDENT_TOKEN" ""
  assert_status "Student can GET PUBLISHED quiz" "200"
  if echo "$BODY" | grep -q '"correctAnswer":""'; then
    pass "Student sees redacted correctAnswer"
  else
    fail "Student correctAnswer not properly redacted"
    info "Body excerpt: $(echo "$BODY" | grep -o '"correctAnswer":"[^"]*"' | head -1)"
  fi

  # Student submits attempt
  if [[ -n "$QUESTION_ID" ]]; then
    req POST "/quizzes/$QUIZ_ID/attempt" "$STUDENT_TOKEN" \
      "{\"answers\":{\"$QUESTION_ID\":\"100\"},\"timeSpent\":30}"
    assert_status "Student submits quiz attempt" "200"
    PASSED=$(echo "$BODY" | grep -o '"passed":[a-z]*' | cut -d: -f2)
    info "Attempt passed: $PASSED"
  fi

  # Teacher cannot submit attempt
  req POST "/quizzes/$QUIZ_ID/attempt" "$TEACHER_TOKEN" \
    "{\"answers\":{},\"timeSpent\":0}"
  assert_status "Teacher cannot submit quiz attempt → 403" "403"

  # Teacher 2 cannot PUT teacher 1's quiz
  req PUT "/quizzes/$QUIZ_ID" "$TEACHER2_TOKEN" '{"title":"Hijacked"}'
  assert_status "Other teacher cannot update quiz → 403" "403"

  # Student cannot DELETE quiz
  req DELETE "/quizzes/$QUIZ_ID" "$STUDENT_TOKEN" ""
  assert_status "Student cannot delete quiz → 403" "403"

  # Teacher 2 cannot DELETE teacher 1's quiz
  req DELETE "/quizzes/$QUIZ_ID" "$TEACHER2_TOKEN" ""
  assert_status "Other teacher cannot delete quiz → 403" "403"

  # Get my attempts (student)
  req GET /quizzes/student/my-attempts "$STUDENT_TOKEN" ""
  assert_status "Student gets own quiz attempts" "200"

  req GET /quizzes/student/my-attempts "$TEACHER_TOKEN" ""
  assert_status "Teacher cannot access student/my-attempts → 403" "403"
fi

# =============================================================================
# 6. BOOKMARKS
# =============================================================================
section "6. Bookmarks — CRUD & Ownership"

req GET /bookmarks "" ""
assert_status "Unauthenticated cannot list bookmarks → 401" "401"

req GET /bookmarks "$STUDENT_TOKEN" ""
assert_status "Student lists own bookmarks" "200"

if [[ -n "$LESSON_ID" ]]; then
  # Create bookmark
  req POST /bookmarks "$STUDENT_TOKEN" \
    "{\"resourceType\":\"LESSON\",\"resourceId\":\"$LESSON_ID\",\"title\":\"My Algebra Bookmark\"}"
  assert_status "Student creates bookmark" "201"
  BOOKMARK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  # Duplicate bookmark
  req POST /bookmarks "$STUDENT_TOKEN" \
    "{\"resourceType\":\"LESSON\",\"resourceId\":\"$LESSON_ID\",\"title\":\"Dup\"}"
  assert_status "Duplicate bookmark → 409" "409"

  # Invalid resource type
  req POST /bookmarks "$STUDENT_TOKEN" \
    "{\"resourceType\":\"VIDEO\",\"resourceId\":\"$LESSON_ID\",\"title\":\"Bad type\"}"
  assert_status "Invalid bookmark resource type → 400" "400"

  # Check bookmark
  req GET "/bookmarks/check/LESSON/$LESSON_ID" "$STUDENT_TOKEN" ""
  assert_status "Check bookmark exists" "200"
  if echo "$BODY" | grep -q '"isBookmarked":true'; then
    pass "Bookmark correctly identified as existing"
  else
    fail "isBookmarked should be true"
  fi

  if [[ -n "$BOOKMARK_ID" ]]; then
    # Teacher cannot view student's bookmark
    req GET "/bookmarks/$BOOKMARK_ID" "$TEACHER_TOKEN" ""
    assert_status "Other user cannot view bookmark → 403" "403"

    # Student can view own bookmark
    req GET "/bookmarks/$BOOKMARK_ID" "$STUDENT_TOKEN" ""
    assert_status "Student can view own bookmark" "200"

    # Teacher cannot delete student's bookmark
    req DELETE "/bookmarks/$BOOKMARK_ID" "$TEACHER_TOKEN" ""
    assert_status "Other user cannot delete bookmark → 403" "403"

    # Delete by resource
    req DELETE "/bookmarks/by-resource/LESSON/$LESSON_ID" "$STUDENT_TOKEN" ""
    assert_status "Student deletes bookmark by resource" "200"
  fi

  # Toggle bookmark on/off
  req POST /bookmarks/toggle "$STUDENT_TOKEN" \
    "{\"resourceType\":\"LESSON\",\"resourceId\":\"$LESSON_ID\",\"title\":\"Toggle test\"}"
  assert_status "Toggle bookmark on" "200"

  req POST /bookmarks/toggle "$STUDENT_TOKEN" \
    "{\"resourceType\":\"LESSON\",\"resourceId\":\"$LESSON_ID\",\"title\":\"Toggle test\"}"
  assert_status "Toggle bookmark off" "200"
fi

# =============================================================================
# 7. MUSIC
# =============================================================================
section "7. Music — Tracks & Preferences"

# Tracks are public
req GET /music/tracks "" ""
assert_status "GET /music/tracks (no auth required)" "200"
TRACK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
info "First track ID: $TRACK_ID"

if [[ -n "$TRACK_ID" ]]; then
  req GET "/music/tracks/$TRACK_ID" "" ""
  assert_status "GET /music/tracks/:id (no auth required)" "200"
fi

req GET /music/tracks/nonexistent-id "" ""
assert_status "GET /music/tracks/bad-id → 404" "404"

# Preferences require auth
req GET /music/preferences "" ""
assert_status "GET /music/preferences unauthenticated → 401" "401"

req GET /music/preferences "$STUDENT_TOKEN" ""
assert_status "GET /music/preferences authenticated" "200"

req PATCH /music/preferences "" '{"volume":0.5}'
assert_status "PATCH /music/preferences unauthenticated → 401" "401"

req PATCH /music/preferences "$STUDENT_TOKEN" '{"volume":0.7}'
assert_status "PATCH /music/preferences (volume only)" "200"

if [[ -n "$TRACK_ID" ]]; then
  req PATCH /music/preferences "$STUDENT_TOKEN" "{\"trackId\":\"$TRACK_ID\",\"volume\":0.3}"
  assert_status "PATCH /music/preferences (track + volume)" "200"
fi

# Invalid volume
req PATCH /music/preferences "$STUDENT_TOKEN" '{"volume":99}'
assert_status "PATCH /music/preferences invalid volume → 400" "400"

# Bad trackId
req PATCH /music/preferences "$STUDENT_TOKEN" '{"trackId":"doesnotexist","volume":0.5}'
assert_status "PATCH /music/preferences bad trackId → 400" "400"

# =============================================================================
# 8. STUDENT ROUTES
# =============================================================================
section "8. Student — Completions, Stats, Progress"

# Unauthenticated
req GET /student/completions "" ""
assert_status "GET /student/completions unauthenticated → 401" "401"

req GET /student/stats "" ""
assert_status "GET /student/stats unauthenticated → 401" "401"

req GET /student/progress "" ""
assert_status "GET /student/progress unauthenticated → 401" "401"

# Student can access their own data
req GET /student/completions "$STUDENT_TOKEN" ""
assert_status "Student GET /student/completions" "200"

req GET /student/stats "$STUDENT_TOKEN" ""
assert_status "Student GET /student/stats" "200"

req GET /student/progress "$STUDENT_TOKEN" ""
assert_status "Student GET /student/progress" "200"
if echo "$BODY" | grep -q '"totalCompleted"' && echo "$BODY" | grep -q '"percentComplete"'; then
  pass "Progress response has totalCompleted and percentComplete"
else
  fail "Progress response missing expected fields"
  info "Body: $BODY"
fi

# Teacher cannot access student routes
req GET /student/progress "$TEACHER_TOKEN" ""
assert_status "Teacher cannot GET /student/progress → 403" "403"

req GET /student/completions "$TEACHER_TOKEN" ""
assert_status "Teacher cannot GET /student/completions → 403" "403"

# =============================================================================
# 9. CLEANUP — Delete lesson (teacher)
# =============================================================================
section "9. Cleanup"

if [[ -n "$LESSON_ID" ]]; then
  req DELETE "/lessons/$LESSON_ID" "$TEACHER_TOKEN" ""
  assert_status "Teacher deletes own lesson" "200"

  # Confirm 404 after delete
  req GET "/lessons/$LESSON_ID" "$TEACHER_TOKEN" ""
  assert_status_one_of "Deleted lesson not found → 404" "404" "403"
fi

if [[ -n "$QUIZ_ID" ]]; then
  req DELETE "/quizzes/$QUIZ_ID" "$TEACHER_TOKEN" ""
  assert_status "Teacher deletes own quiz" "200"
fi

# =============================================================================
# SUMMARY
# =============================================================================
TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}Test Results: ${TOTAL} total${NC}"
echo -e "${GREEN}  Passed : $PASS${NC}"
echo -e "${RED}  Failed : $FAIL${NC}"
echo -e "${YELLOW}  Skipped: $SKIP${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
else
  echo -e "${GREEN}${BOLD}All tests passed!${NC}"
  exit 0
fi
