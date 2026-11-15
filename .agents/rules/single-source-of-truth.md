# Single Source of Truth Rule: https://thrivingskill.com

The live website [https://thrivingskill.com](https://thrivingskill.com) is the supreme, authoritative **Single Source of Truth** for the entire ThrivingSkills mobile application codebase.

---

## Mandatory Operating Principles

1. **Absolute Parity with Live Platform**:
   - All authentication flows, user registration fields, password rules, checkout steps, LearnPress course structures, pricing models, and order statuses MUST reflect the actual behavior of [https://thrivingskill.com](https://thrivingskill.com).
   - Never invent arbitrary constraints, input requirements, or heuristic validation rules (e.g., mandatory phone numbers when the live site doesn't ask for them, or complex password regex when WordPress core only requires minimum 6 characters).

2. **Empirical Verification Over Assumptions**:
   - Before implementing, refactoring, or claiming any business rule or field requirement, agents MUST empirically verify the real-world behavior against `https://thrivingskill.com` (via REST API calls, HTML probing, or browser inspection).
   - If a discrepancy exists between mobile code/documentation and the live website, **the live website always wins**.

3. **User Flow Fidelity**:
   - **Registration**: Match `https://thrivingskill.com/register/` (Username + Email only, no phone number required, email verification link with one-time key).
   - **Password Requirements**: Match WordPress core standard (`pwsL10n` advisory meter, minimum 6 characters, no forced symbol/case blocking).
   - **Checkout & Enrollment**: Match WooCommerce & LearnPress order processing and web checkout bridge URLs.

4. **Audit Requirement**:
   - Any agent asserting that a requirement is "from the site" must cite empirical verification evidence from `https://thrivingskill.com`.
