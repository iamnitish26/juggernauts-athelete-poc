# JSF Camp Verified — Model Documentation

## What is JSF Camp Verified?

JSF Camp Verified is a structured talent identification and assessment layer within the Juggernauts Athlete ID platform. It allows Juggernauts Sporting Foundation (JSF) to:

- Organise grassroots football assessment camps across Odisha
- Assess athletes using structured sport-specific tests
- Generate performance scores using camp-relative percentiles
- Assign recommendation categories based on objective criteria
- Show a safe "Camp Verified" badge on approved public athlete profiles

**Important:** JSF Camp Verified recommendations are intended for further evaluation only. They do not guarantee selection for any team, academy, or programme.

---

## Module 1: Football

Module 1 implements the football camp model. Future modules will add athletics, hockey, badminton, cricket, and more.

---

## Football Test Model

### A. Athletic Base (25 points)

| Test | Unit | Direction | Measures |
|------|------|-----------|---------|
| 30m Sprint | seconds | Lower is better | Acceleration / speed |
| 5-10-5 Agility Test | seconds | Lower is better | Change of direction |
| Yo-Yo / Beep Test | level | Higher is better | Endurance / repeated effort |

### B. Technical Skill (35 points)

| Test | Unit | Direction | Measures |
|------|------|-----------|---------|
| Dribble Slalom | seconds | Lower is better | Ball control / agility with ball |
| Passing Accuracy | out of 10 | Higher is better | Passing technique |
| Shooting Accuracy | out of 10 | Higher is better | Finishing / shooting |

### C. Game / Coach Assessment (25 points)

Coaches score each field 1–5:

- First Touch
- Decision Making
- Off-Ball Movement
- Defensive Effort
- Communication
- Teamwork
- Overall Game Score

Scores are converted from 1–5 to 0–10 scale and averaged.

### D. Development Potential (10 points)

Based on:
- Coachability score (1–5)
- Attitude score (1–5)
- High Potential Flag bonus (+1.0 if flagged, capped at 10)

### E. Data Confidence (5 points)

| Factor | Points |
|--------|--------|
| Attended camp | 1 |
| ≥50% tests completed | 1 |
| 100% tests completed | 2 |
| Coach assessment done | 1 |
| Results verified | 1 |

---

## Scoring Model

```
Final Score (100) =
  Athletic Base (25)
  + Technical Skill (35)
  + Game / Coach Assessment (25)
  + Development Potential (10)
  + Data Confidence (5)

Rating = Final Score / 10
```

---

## Percentile Scoring

All physical and technical test scores use **camp-relative percentile scoring**.

Cohort for percentile calculation:
- Same camp
- Same age group
- Same gender

Formula:
```
percentile = (athletes_beaten + 0.5 × athletes_tied) / total_in_cohort × 100
score_out_of_10 = percentile / 10
```

**Small cohort warning:** If fewer than 5 athletes in the cohort, scores are still calculated but marked with a small cohort warning.

---

## Recommendation Categories

| Category | Criteria |
|----------|---------|
| **JSF Recommended** | Rating ≥ 8.0 AND overall game score ≥ 7/10 AND data confidence ≥ 3.0 |
| **JSF Watchlist** | Rating ≥ 7.0 OR (potential flag AND U-13/U-15) |
| **Development Track** | Rating ≥ 6.0 |
| **Participation Track** | Rating < 6.0 |

**Language note:** Always use "Recommended for further evaluation" — never "guaranteed selection."

---

## Age Group Notes

Module 1 uses the same weights for all age groups. Future versions will apply age-specific adjustments:

- **U-13:** Emphasise movement quality and coachability
- **U-15:** Balance athletic base and technical skill
- **U-17:** Emphasise technical skill and game awareness
- **U-19/Senior:** Emphasise match readiness and consistency

---

## Public Profile Visibility Rules

A Camp Verified badge is shown on a public athlete profile ONLY if:

1. `profile_status = approved`
2. `is_public = true`
3. `camp_participants.public_summary_enabled = true`

**Never shown publicly:**
- Private coach notes
- Raw test result details
- Phone, email, guardian info
- Internal data confidence notes
- Rejection reasons

---

## How to Create a Camp

1. Go to Admin → Camps → New Camp
2. Fill in: name, district, venue, date, age groups
3. Set status to "Draft" or "Open"
4. Click Create Camp

---

## How to Add Participants

1. Open camp → Participants tab
2. Search by athlete name or Athlete ID
3. Click Add to add them to the camp
4. Mark attendance by clicking the attendance badge (cycles: Registered → Attended → Absent → Withdrawn)

---

## How to Enter Scores

1. Open camp → Participants → Results (for an athlete)
2. Enter attempt values for each physical test
3. Click Save for each test
4. Fill in the Coach Assessment (1–5 scores)
5. Save the assessment

---

## How to Calculate Recommendations

1. After entering tests and coach assessment, click **Calculate Score**
2. The system will:
   - Calculate percentile scores within the cohort
   - Compute all sub-scores
   - Generate a final rating and recommendation category
3. To make the result visible on the public profile, enable **Show on Public Profile**

---

## How to Export Results

From the camp detail page:
- **Export Shortlist CSV:** Athletes with calculated scores and recommendation categories
- **Export Full Results CSV:** All test values, sub-scores, ratings, and confidence labels

Exports never include phone, email, guardian, or private notes.

---

## Database Schema

New tables added in migration `010_camp_verified.sql`:

| Table | Purpose |
|-------|---------|
| `camps` | Camp records |
| `camp_participants` | Athletes enrolled in each camp |
| `test_definitions` | Football test catalogue |
| `test_results` | Individual attempt values and calculated scores |
| `coach_assessments` | Coach 1–5 scores and notes |
| `athlete_camp_scores` | Calculated sub-scores and final rating |

Columns added to `athletes`:
- `latest_camp_verified_at`
- `latest_camp_rating`
- `latest_recommendation_category`

---

## Known Limitations (Module 1)

- Football only — other sports not yet implemented
- No historical norms — uses camp-relative percentiles only
- No repeat test tracking across multiple camps
- No volunteer interface for camp data entry (admin only)
- No trend analytics across multiple camps
- No bulk participant import
- Small cohort warning shown but does not prevent scoring

---

## Planned Future Modules

- Module 2: Athletics camp model
- Module 3: Hockey camp model
- Module 4: Badminton, Cricket, Volleyball
- Cross-camp trend analytics
- JSF Odisha Norms (once sufficient data collected)
- Volunteer interface for test entry
- Bulk participant import via CSV
