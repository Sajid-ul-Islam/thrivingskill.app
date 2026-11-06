# AI Agents Specification & Operating Instructions (AGENTS)
## Autonomous AI Pair Programming Guide for ThrivingSkills

This document establishes the architecture, operating principles, guardrails, and quality protocols for Google DeepMind Antigravity and autonomous AI agents contributing to the **Thriving Skills** mobile application codebase.

---

## 1. Multi-Agent Roles & Specialization

When working on complex initiatives within this repository, agents operate according to four core specialized roles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANTIGRAVITY ORCHESTRATOR                        │
│             (Main Planner, Task Decomposition & Coordination)          │
└───────────────┬────────────────────────┬───────────────────────────────┘
                │                        │
       ┌────────▼───────┐       ┌────────▼───────┐
       │ ARCHITECT / QA │       │ BROWSER AGENT  │
       │ Code Audits,   │       │ Staging Site,  │
       │ Typechecks,    │       │ WP Admin, Live │
       │ Memory Leaks   │       │ LMS Inspection │
       └────────────────┘       └────────────────┘
```

1. **Lead Orchestrator (Antigravity)**:
   - Evaluates user intent, breaks down goals into milestones, manages subagents, and ensures comprehensive verification.
2. **Architect & Type Safety Specialist**:
   - Analyzes TypeScript contracts, ensures strict compiler conformity (`tsc --noEmit`), eliminates circular imports, and manages memory hygiene.
3. **Frontend & Mobile UI Specialist**:
   - Implements responsive React Native components, maintains bilingual i18n dictionaries, and ensures WCAG accessibility standards.
4. **Browser Controller Subagent (`browser`)**:
   - Inspects staging WordPress environments, audits responsive web views, verifies live LearnPress REST API schemas, and checks authentication flows.

---

## 2. Mandatory Agent Operating Rules & Guardrails

All autonomous agents working on this project MUST strictly adhere to the following rules:

### Rule 1: Non-Negotiable Type Safety
* Before marking any task or goal complete, the agent MUST run:
  ```powershell
  npm run typecheck
  ```
* The command must exit with code 0 (zero errors). Never suppress errors using `any` or `@ts-ignore` unless explicitly justified.

### Rule 2: Strict Brand Identity Preservation
* All visual interfaces, buttons, badges, and progress gauges MUST align with the official Thriving Skills color tokens:
  - **Brand Deep Navy**: `#102F53`
  - **Sunshine Gold**: `#FFB606`
  - **Crimson / Coral**: `#E34234`
  - **Dark Surfaces**: `#0F192C` / `#1E293B`
  - **Light Surfaces**: `#FFFFFF` / `#F8FAFC`

### Rule 3: Cross-Platform Timer Hygiene
* Never declare timers with `NodeJS.Timeout` in client code.
* Always use `ReturnType<typeof setTimeout>` or `ReturnType<typeof setInterval>`.
* Every timer created inside a React component MUST be stored in a `useRef` and canceled in a `useEffect` unmount teardown function to prevent memory leaks and state updates on unmounted trees.

### Rule 4: Windows PowerShell Syntax Safety
* When executing terminal commands on Windows PowerShell:
  - Do NOT pass complex inline JavaScript with double quotes, `$`, or `||` via `node -e`. PowerShell interprets these characters prior to Node execution.
  - Instead, write a standalone script file into `scripts/` using the `write_file` tool, and execute it via `node scripts/<script_name>.js`.

### Rule 5: Documentation Integrity & Clickable Links
* Maintain existing docstrings and architectural comments.
* Always generate clickable GitHub-style file links (`file:///...`) for referenced files and types.

---

## 3. Slash Command Reference for Developers & Agents

Agents can recommend and participate in the following slash commands:

* **`/goal`**: Triggers autonomous, long-running agent execution. The agent iterates through research, implementation, auditing, and verification, concluding only when the goal is achieved and confirmed with `<!-- GOAL_COMPLETE -->`.
* **`/plan`**: Requests a comprehensive architectural implementation plan before touching code.
* **`/browser`**: Launches the autonomous browser controller subagent to inspect staging or production web portals.
* **`/compact`**: Summarizes long conversational trajectories to optimize context window utilization.
* **`/schedule`**: Configures recurring automated health checks or timers.

---

## 4. Agent Verification Checklist

Before reporting completion to the user or closing a pull request, every agent must verify:
- [ ] `npm run typecheck` exits with 0 errors.
- [ ] `node scripts/audit_app.js` runs clean with 0 broken imports, 0 missing styles, and 0 unhandled timers.
- [ ] No hardcoded personal mock strings remain in production screens.
- [ ] All client requirements (CR-01 through CR-05) remain functional and intact.
- [ ] Git working tree is committed with descriptive conventional commit messages.
