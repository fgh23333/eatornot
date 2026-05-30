You are Claude Code working on the repository `fgh23333/eatornot`.

Build the first MVP of **EatOrNot**, a Gemma 4 + Google ADK style multi-agent nutrition and spending companion. The project must not be a simple McDonald's MCP wrapper. It should be structured as a multi-agent decision system with reusable skills, nutrition knowledge, personal memory, budgeting, and McDonald's MCP as only one execution tool.

Important constraints:

* Never hardcode secrets.
* Never commit API tokens.
* Read all secrets from `.env`.
* Do not create a real paid order without explicit user confirmation.
* If McDonald's MCP token is missing, use mock MCP responses so the demo still runs.
* Keep the first version simple, stable, and demo-ready.

Target tech stack:

* Backend: Python 3.12 + FastAPI
* Agent layer: Python modules designed to be compatible with Google ADK style agents/skills
* Frontend: React + Vite + TypeScript
* Database: SQLite for MVP
* LLM: OpenAI-compatible endpoint through Cloudflare AI Gateway
* Model env variable: `GEMMA_MODEL=google-ai-studio/gemma-4-31b-it`
* API key env variable: `CF_AIG_TOKEN`
* Base URL env variable: `CF_AIG_BASE_URL`

Project structure to create:

```text
eatornot/
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── llm_client.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user_profile.py
│   │   │   ├── meal_record.py
│   │   │   ├── recommendation.py
│   │   │   └── agent_result.py
│   │   ├── agents/
│   │   │   ├── supervisor_agent.py
│   │   │   ├── profile_agent.py
│   │   │   ├── nutrition_agent.py
│   │   │   ├── weight_loss_agent.py
│   │   │   ├── budget_agent.py
│   │   │   ├── craving_agent.py
│   │   │   ├── time_context_agent.py
│   │   │   ├── menu_agent.py
│   │   │   ├── safety_agent.py
│   │   │   ├── future_simulation_agent.py
│   │   │   └── reflection_agent.py
│   │   ├── services/
│   │   │   ├── mcdonalds_mcp_client.py
│   │   │   ├── mock_mcdonalds_mcp.py
│   │   │   ├── nutrition_calculator.py
│   │   │   ├── calorie_calculator.py
│   │   │   ├── budget_service.py
│   │   │   └── memory_service.py
│   │   ├── api/
│   │   │   ├── profile_routes.py
│   │   │   ├── recommend_routes.py
│   │   │   ├── meal_routes.py
│   │   │   ├── order_routes.py
│   │   │   └── chat_routes.py
│   │   └── data/
│   │       ├── demo_user.json
│   │       ├── mock_mcdonalds_menu.json
│   │       └── mock_nutrition_foods.json
│   └── web/
│       ├── package.json
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── api/client.ts
│       │   ├── components/
│       │   │   ├── ProfileCard.tsx
│       │   │   ├── AgentDebatePanel.tsx
│       │   │   ├── MealRecommendationCard.tsx
│       │   │   ├── BudgetBar.tsx
│       │   │   ├── NutritionBalancePanel.tsx
│       │   │   └── OrderConfirmModal.tsx
│       │   └── styles.css
├── skills/
│   ├── weight-loss-skill/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── weight_loss_rules.md
│   ├── nutrition-balance-skill/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── nutrition_rules.md
│   ├── controlled-indulgence-skill/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── craving_rules.md
│   ├── spending-control-skill/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── budget_rules.md
│   └── mcdonalds-order-skill/
│       ├── SKILL.md
│       └── references/
│           └── mcdonalds_mcp_usage.md
├── knowledge/
│   ├── nutrition_guidelines/
│   │   ├── healthy_diet_summary.md
│   │   ├── sodium_sugar_fat_limits.md
│   │   └── food_diversity_rules.md
│   ├── weight_loss/
│   │   ├── calorie_deficit_rules.md
│   │   ├── bmi_and_tdee_notes.md
│   │   └── safe_weight_loss_boundaries.md
│   └── safety/
│       ├── allergy_rules.md
│       ├── extreme_diet_warning.md
│       └── medical_disclaimer.md
├── docs/
│   ├── product_plan.md
│   ├── architecture.md
│   ├── demo_script.md
│   └── judging_story.md
├── README.md
└── .gitignore
```

MVP feature goal:

The demo should support this flow:

```text
1. User creates or loads a profile:
   - height
   - weight
   - age
   - sex
   - goal: lose_weight / maintain / gain_muscle
   - daily budget
   - weekly indulgence allowance
   - taste preferences
   - allergies
   - meal schedule

2. User says:
   “I want McDonald's. I am losing weight, but I am tired and do not want to spend too much.”

3. Supervisor Agent calls multiple agents:
   - Profile Agent: loads user profile and history
   - Weight Loss Agent: estimates daily calorie target and meal calorie budget
   - Nutrition Agent: evaluates calories, protein, fat, carbs, sodium
   - Budget Agent: checks today/weekly budget
   - Craving Agent: detects emotional eating, stress, or controlled indulgence need
   - Time Context Agent: checks whether user is busy, late, or needs fast food
   - Menu Agent: calls McDonald's MCP or mock MCP
   - Safety Agent: checks allergies, extreme dieting, and order confirmation risk
   - Future Simulation Agent: simulates effect on today’s calories, budget, and indulgence balance

4. The system returns 3 recommendation plans:
   - disciplined weight-loss plan
   - budget-friendly filling plan
   - controlled indulgence plan

5. User can select one plan.

6. Before order creation, system must show confirmation:
   - selected food
   - estimated calories
   - protein/fat/carbs/sodium
   - price
   - budget impact
   - indulgence impact
   - reason for recommendation

7. After confirmation:
   - if MCP token exists, call create-order or return payment link
   - if MCP token is missing, simulate order creation
   - save meal record
   - update user memory
```

Implementation details:

1. Backend configuration

Create `apps/api/core/config.py`.

It should load:

```text
CF_AIG_TOKEN
CF_AIG_BASE_URL
GEMMA_MODEL
MCD_MCP_TOKEN
MCD_MCP_URL=https://mcp.mcd.cn
DATABASE_URL=sqlite:///./eatornot.db
USE_MOCK_MCP=true
```

Create `.env.example` with placeholders only.

2. LLM client

Create `apps/api/core/llm_client.py`.

It should expose:

```python
generate_json(system_prompt: str, user_prompt: str, schema_hint: dict) -> dict
generate_text(system_prompt: str, user_prompt: str) -> str
```

Use OpenAI-compatible client.

Do not fail the whole app if the LLM call fails. Return a safe fallback response.

3. Data models

Create Pydantic models:

```python
UserProfile
MealRecord
AgentResult
RecommendationPlan
RecommendationResponse
OrderDraft
OrderConfirmation
```

Recommendation plan fields:

```text
id
title
mode
items
estimated_price
estimated_calories
protein
fat
carbohydrate
sodium
budget_impact
calorie_impact
indulgence_impact
pros
cons
agent_votes
safety_warnings
final_reason
```

4. Multi-agent orchestration

Create each agent as a class with a `run(context: dict) -> AgentResult` method.

`AgentResult` should include:

```text
agent_name
score
decision
reasons
warnings
data
```

Agents should not directly return final user-facing text. They should return structured opinions.

Supervisor Agent should:

* collect all agent results
* call Menu Agent to get candidate meals
* score candidate meals
* produce 3 recommendation plans
* explain trade-offs
* never create order directly

5. Agent behavior

Profile Agent:

* load profile
* infer missing preferences conservatively
* return user constraints

Weight Loss Agent:

* calculate BMI
* estimate BMR using Mifflin-St Jeor
* estimate TDEE using activity level
* set daily calorie target depending on goal
* set current meal calorie budget

Nutrition Agent:

* evaluate food candidates
* prefer protein-positive and lower sugar/fat options in weight-loss mode
* warn about high sodium
* avoid medical claims

Budget Agent:

* check daily budget and weekly budget
* prefer coupon/low-cost combinations
* output budget score

Craving Agent:

* detect whether user is in:

  * normal mode
  * choice fatigue
  * stress eating
  * controlled indulgence
  * strong craving
* do not shame the user
* allow controlled indulgence when reasonable

Time Context Agent:

* decide whether user needs:

  * fastest option
  * delivery
  * pickup
  * late-night lighter choice

Menu Agent:

* first try McDonald's MCP if token exists
* otherwise load mock data
* expose methods:

  * list_nutrition_foods()
  * query_nearby_stores()
  * query_meals()
  * query_meal_detail()
  * calculate_price()
  * create_order()
  * query_order()

Safety Agent:

* check allergies
* warn if target is extreme
* block automatic order creation without confirmation
* output safety warnings

Future Simulation Agent:

* simulate effects:

  * remaining daily calories
  * remaining budget
  * weekly indulgence balance
  * next meal suggestion

Reflection Agent:

* after meal feedback, update user memory
* summarize what the system learned

6. Skills

Create `SKILL.md` files for each skill.

Each `SKILL.md` should include:

* Purpose
* When to use
* Inputs
* Outputs
* Rules
* Failure handling
* Example

Skill list:

`weight-loss-skill`

* Handles BMI, BMR, TDEE, calorie deficit, safe boundaries.

`nutrition-balance-skill`

* Handles calories, protein, fat, carbs, sodium, food diversity.

`controlled-indulgence-skill`

* Handles craving, stress eating, controlled indulgence, no-shame language.

`spending-control-skill`

* Handles daily budget, weekly budget, coupon preference, price trade-offs.

`mcdonalds-order-skill`

* Handles McDonald's MCP usage, mock fallback, order confirmation, no automatic payment.

7. Knowledge documents

Create concise markdown knowledge files.

Do not pretend to provide medical diagnosis.
Do not copy long copyrighted text.
Write summarized rules and add source links.

Include rules like:

* calorie balance matters for weight change
* moderate calorie deficit is preferred
* protein helps satiety
* high sodium should be warned about
* sugary drinks and desserts are controlled indulgence items
* fast food can be included occasionally but should be balanced by later meals
* extreme restriction should be blocked and redirected

8. API endpoints

Create these routes:

```text
GET /health
GET /api/demo/profile
POST /api/profile
GET /api/today/status
POST /api/recommend
POST /api/order/draft
POST /api/order/confirm
POST /api/meal/record
POST /api/feedback
POST /api/chat
```

`POST /api/recommend` input:

```json
{
  "user_id": "demo-user",
  "message": "I want McDonald's. I am losing weight but I am tired and do not want to spend too much.",
  "context": {
    "time_pressure": "high",
    "mood": "tired",
    "meal_type": "dinner"
  }
}
```

Output should include:

* agent debate results
* 3 recommendation plans
* final summary
* safety warnings

9. Frontend

Create a clean demo interface with:

* left side: user profile and today’s calorie/budget/indulgence balance
* center: chat input and recommendation cards
* right side: agent debate panel

Recommendation cards should show:

* title
* mode
* price
* calories
* protein
* sodium warning
* why recommended
* trade-off
* select button

Agent debate panel should show each agent’s opinion:

* Nutrition Agent
* Budget Agent
* Craving Agent
* Time Agent
* Safety Agent
* Future Simulation Agent

Order confirmation modal:

* show selected plan
* show warning
* require explicit confirm button
* never auto-confirm

10. Mock data

Create realistic mock McDonald's data with at least 12 items:

* burger
* chicken burger
* grilled chicken option
* fries
* salad or lighter side if available
* cola
* zero sugar drink
* coffee
* dessert
* breakfast item
* chicken nuggets
* combo meal

Each item should include:

* name
* item_code
* category
* price
* calories
* protein
* fat
* carbs
* sodium
* tags

11. README

Write README with:

* project intro
* why it is not just McDonald's MCP
* multi-agent architecture
* skills architecture
* knowledge sources
* setup instructions
* env variables
* how to run backend
* how to run frontend
* demo scenario
* safety limitations

12. Demo script

Create `docs/demo_script.md`.

Demo story:

```text
A busy student or worker has skipped meals, is trying to lose weight, has limited budget, and wants McDonald's late at night.

EatOrNot does not simply say no.
It lets multiple agents debate:
- health goal
- nutrition
- budget
- craving
- time pressure
- future consequence
- safety

Then it provides three choices:
1. disciplined weight-loss plan
2. budget-friendly filling plan
3. controlled indulgence plan

The user chooses one.
EatOrNot explains the trade-off, asks for confirmation, creates a mock order or real MCP order, records the meal, and updates tomorrow's plan.
```

13. Acceptance criteria

The MVP is complete when:

* `apps/api` can start with `uvicorn main:app --reload`
* `apps/web` can start with `npm run dev`
* frontend can call backend
* demo profile loads
* recommend endpoint returns 3 plans
* agent debate panel shows at least 6 agent opinions
* mock MCP works when no token exists
* order confirmation requires user confirmation
* meal record is saved
* README explains architecture clearly
* no secret is committed
* code is clean and modular

14. Development order

Implement in this order:

Phase 1:

* create repository structure
* backend config
* Pydantic models
* mock MCP data
* simple recommendation endpoint

Phase 2:

* implement agents as structured scoring modules
* implement supervisor orchestration
* implement calorie and budget calculators

Phase 3:

* implement frontend demo UI
* show profile, budget, calories, recommendation cards, agent debate

Phase 4:

* implement order draft/confirm flow
* implement meal record and reflection update

Phase 5:

* write README, architecture doc, and demo script

Do not over-engineer. Prefer a stable hackathon demo over a perfect system.
