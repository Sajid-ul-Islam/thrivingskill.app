# Antigravity Skills & Developer Tooling Manual (SKILLS)
## Thriving Skills Mobile Application

This document provides a guide to the tools, automation scripts, developer skills, and execution runbooks used to build, audit, and maintain the **Thriving Skills** mobile learning application.

---

## 🛠️ Automated Scripts & Tooling Catalog

### 1. Codebase Health & Audit Scanner (`scripts/audit_app.js`)
* **Location**: `scripts/audit_app.js`
* **Purpose**: Performs a 5-dimension static analysis across all 75 TypeScript and TSX files in the project.
* **Checks Executed**:
  1. **Relative Imports**: Scans every `import ... from './...'` to ensure target files exist on disk with `.ts`, `.tsx`, or `.json` extensions.
  2. **Missing StyleSheet Keys**: Cross-references style usages (e.g. `styles.cardTitle`) with defined keys in `StyleSheet.create({...})` to prevent undefined style references.
  3. **Timer Memory Leaks**: Scans for unmanaged `setInterval` and `setTimeout` usages lacking cleanup teardown effects.
  4. **Social Auth Remnants**: Identifies residual references to deprecated Facebook/Google login providers.
  5. **Unsafe JSON Parsing**: Flags raw `JSON.parse()` calls not wrapped in `try/catch` blocks.
* **Usage**:
  ```powershell
  node scripts/audit_app.js
  ```

---

## 🚀 Standard Development Commands

### 1. Static Typecheck (Strict Mode)
* **Command**:
  ```powershell
  npm run typecheck
  ```
* **Engine**: `tsc --noEmit`
* **Requirement**: Must complete with 0 errors before staging or committing changes.

### 2. Start Expo Metro Bundler
* **Command**:
  ```powershell
  npm start
  ```
  *(or `npx expo start --clear` to clear cache)*
* **Verification**: Checks bundle compilation on port 8081 for Android and iOS clients.

### 3. Linting & Formatting
* **Command**:
  ```powershell
  npm run lint
  ```
* **Scope**: Validates React Hooks rules, unused variables, and JSX formatting.

---

## 🤖 Antigravity AI Agent Skills Configuration

When working within Google Antigravity, the following specialized skills enhance productivity on the ThrivingSkills codebase:

| Skill Name | Purpose on ThrivingSkills | Invocation Guide |
| :--- | :--- | :--- |
| **`chrome-devtools`** | Inspects WordPress staging and production LMS endpoints, network headers, and response payloads. | Triggered when diagnosing staging DNS or REST API schema changes. |
| **`android-cli`** | Orchestrates Android Virtual Devices (AVDs), takes screenshots, and verifies layout on physical devices. | Used when checking notch handling, safe area insets, and keyboard avoiding views. |
| **`gemini-api-dev`** | Powers the AI Skill Copilot screen (`CopilotScreen.tsx`) for conversational skill advising. | Consulted when updating Copilot prompts or model generation parameters. |
| **`auth0` / Authentication** | Security reference for JWT token validation, bearer token headers, and mobile OTP session expiration. | Consulted when updating authentication contracts. |
| **`ui-ux-design-laws`** (`.agents/skills/ui-ux-design-laws/SKILL.md`) | Audits and enforces Core UI Principles, UX Honeycomb, and Hick's, Fitts's, Jakob's, Miller's, and Aesthetic-Usability laws. | Triggered whenever designing, modifying, or verifying any UI screen, modal, form, or component. |

---

## 📋 Standard Code Modification Workflow

All developers and autonomous agents must follow this 6-step workflow:

```
1. Plan / Inspect   ──► 2. Code Edits   ──► 3. Typecheck
   (Read files)         (Use edit_file)      (npm run typecheck)
                                                    │
                                                    ▼
6. Remote Push      ◄── 5. Git Commit   ◄── 4. Codebase Audit
   (git push)           (git commit)         (node scripts/audit_app.js)
```

1. **Plan & Inspect**: Read existing files, interfaces, and theme tokens before introducing changes.
2. **Code Edits**: Make focused, atomic edits using `edit_file`. Preserve all docstrings and existing comments.
3. **Typecheck Verification**: Run `npm run typecheck` to ensure 0 TypeScript compilation errors.
4. **Codebase Audit**: Run `node scripts/audit_app.js` to ensure no memory leaks, broken imports, or missing styles were introduced.
5. **Git Commit**: Stage changes (`git add`) and commit with descriptive conventional commit messages.
6. **Remote Push**: Push verified changes to `origin master`.
