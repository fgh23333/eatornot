Refactor the current EatOrNot MVP. The current version is too simple and behaves like a McDonald's recommendation wrapper. Redesign it into a dual-mode, multi-turn, Google ADK-based diet decision assistant.

Main product goal:
EatOrNot must support both:

1. Long-term mode: user manages body goal, budget, nutrition, eating habits, and meal history over time.
2. Quick mode: user casually asks for help choosing one meal without creating a full profile.

Core changes:

1. Add mode selection landing page

* Add two primary entry cards:

  * "长期管理我的饮食"
  * "就这顿帮我选一下"
* Long-term mode requires profile onboarding.
* Quick mode asks only minimal questions and does not force registration.

2. Add reset buttons
   Add two reset actions:

* Reset current conversation: clears chat messages, active plan, selected order, agent debate state.
* Reset profile: clears user profile and returns to onboarding.

3. Add user body profile onboarding
   Create a profile setup form with:

* height_cm
* weight_kg
* age
* sex
* activity_level
* goal: lose_weight / maintain / gain_muscle / save_money / regular_meals
* daily_budget
* weekly_budget
* weekly_indulgence_allowance
* allergies
* dislikes
* taste_preferences
* preferred_tone: strict_coach / gentle_friend / funny_friend

4. Add quick-use profile
   For quick mode, ask only:

* goal for this meal: lose_weight / cheap / satisfying / fast / balanced
* budget limit
* hunger level
* craving level
* allergies
* optional current mood

5. Make recommendations multi-turn editable
   Introduce an ActivePlan object:

* plan_id
* version
* items
* nutrition
* price
* reasons
* tradeoffs
* change_log
* constraints

Add endpoint:
POST /api/plan/refine

Example user messages:

* "不要咖啡，换成零度可乐"
* "太贵了，控制在25元以内"
* "我想吃爽一点"
* "不要炸的"
  Each refinement should create a new plan version and explain:
* what changed
* why changed
* impact on calories, price, sodium, protein, budget, indulgence

6. Upgrade Agent debate UI
   Replace simple score cards with a "Round Table Debate" view.

The debate should have stages:

* Stage 1: Initial opinions
* Stage 2: Conflicts detected
* Stage 3: Compromises
* Stage 4: Final recommendation

Each Agent should output:

* position
* objection
* concession
* final_vote
* confidence
* evidence

Agents:

* Profile Agent
* Weight Goal Agent
* Nutrition Agent
* Budget Agent
* Craving Agent
* Time Context Agent
* Menu Provider Agent
* Safety Agent
* Future Simulation Agent
* Reflection Agent

7. Actually integrate Google ADK
   Do not only simulate agents with custom classes.
   Add google-adk to requirements.

Use ADK concepts:

* root Agent or Supervisor Agent
* sub-agents if appropriate
* SkillToolset
* file-based skills loaded from /skills
* MCP tool integration abstraction

At minimum, create:
apps/api/adk_app/

* agent.py
* skills_loader.py
* tools/
* workflows/

Use:
from google.adk import Agent
from google.adk.skills import load_skill_from_dir
from google.adk.tools import skill_toolset

Load these skills:

* weight-loss-skill
* nutrition-balance-skill
* controlled-indulgence-skill
* spending-control-skill
* mcdonalds-order-skill
* image-meal-analysis-skill

8. Add image mode
   Add a photo upload feature:

* User can upload a meal photo, tray photo, receipt photo, or menu photo.
* The system should identify visible food items.
* It should estimate nutrition as a range, not an exact value.
* It must ask the user to confirm the detected items.
* It should then update meal record or generate a recommendation.

Add endpoints:
POST /api/vision/test
POST /api/meal/analyze-image
POST /api/menu/analyze-image

Important:

* Do not claim exact calorie counting from images.
* Always show "estimated range" and ask for confirmation.
* If Gemma 4 endpoint does not support image input, use a fallback mock vision response.

9. Improve UI quality
   Redesign the interface:

* cleaner layout
* better spacing
* modern cards
* less orange
* more neutral background
* clear mode selection
* chat-centered workflow
* current plan version panel
* agent round table panel
* profile drawer
* reset buttons
* image upload button

10. Rename product positioning
    Do not position as "McDonald's assistant".
    Position as:
    "EatOrNot: a dual-mode multi-agent diet decision companion."

McDonald's MCP is only one FoodProvider.

Add provider abstraction:
FoodProvider interface:

* search_stores
* search_menu
* get_nutrition
* calculate_price
* create_order_draft
* confirm_order

Implement:

* McDonaldsMcpProvider
* MockMcDonaldsProvider
* MockMeituanProvider
* ManualMealProvider

11. Update README and docs
    Update:

* product_plan.md
* architecture.md
* demo_script.md
* README.md

The new demo story:
A user can either:
A. Use long-term mode to manage weight, budget, and meal habits.
B. Use quick mode to casually pick one meal.

Demo should show:

* onboarding
* quick mode
* multi-agent debate
* plan refinement
* image upload
* confirmation before order
* meal record update
* future simulation

Acceptance criteria:

* The app starts normally.
* User can choose long-term or quick mode.
* User can input body profile.
* User can reset conversation.
* User can reset profile.
* Recommendation supports multi-turn refinement.
* Agent debate shows staged roundtable process.
* Google ADK is installed and used in code.
* Skills are loaded through ADK SkillToolset.
* Image upload UI exists.
* If vision model is unavailable, fallback mock image analysis works.
* Food provider abstraction exists.
* McDonald's is not hardcoded as the only product path.
