## 2026-11-08T09:29:37Z
You are specminer_survey_api_2.
Your working directory is d:\Repo\thrivingskill.app\.agents\teamwork\specminer_survey_api_2\

Task Objective:
Investigate and document WordPress & LearnPress REST API specifications, contracts, and authentication/user endpoints for the Thriving Skills mobile app.

Instructions:
1. First, read ORIGINAL_REQUEST.md at d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md and user rules at d:\Repo\thrivingskill.app\AGENTS.md.
2. Investigate the API contracts and backend endpoints:
   - Target API base: `https://staging.thrivingskill.com/wp-json`.
   - Inspect existing API service client in the codebase (`src/services/api.ts` or similar). How are authentication headers, token storage, and requests handled?
   - Examine `/learnpress/v1/token` and `/learnpress/v1/token/register` endpoints. How does authentication error handling work? What response structures indicate non-existent user / invalid username vs incorrect password?
   - Examine password recovery & reset: `/learnpress/v1/users/reset-password`, `/wp/v2/users/lostpassword`, or WordPress core endpoints. How can the app trigger a WordPress password reset email containing the reset link?
   - Examine user profile endpoints: `/wp/v2/users/me` and `/learnpress/v1/users/{id}`. What fields are supported for fetching and updating (display name, email, phone number, bio, avatar)?
   - Examine role verification: How does WordPress/LearnPress return user roles or capabilities? How can the app verify WordPress administrator roles strictly (`administrator`) vs other roles?
3. Document your findings with concrete endpoint schemas, request/response formats, error codes, and implementation recommendations in:
   `d:\Repo\thrivingskill.app\.agents\teamwork\specminer_survey_api_2\handoff.md`
4. Update `progress.md` in your directory as you make progress.
5. Once your report is complete, send a message to orchestrator with your findings summary and handoff report path.
