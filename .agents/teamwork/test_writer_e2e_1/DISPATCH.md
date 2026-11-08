# Task Assignment

Role: E2E Test Writer
Working Directory: d:\Repo\thrivingskill.app\.agents\teamwork\test_writer_e2e_1\
Original Request: d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document: d:\Repo\thrivingskill.app\PROJECT.md

## 2026-11-08T09:41:31Z
You are test_writer_e2e_1.
Your working directory is d:\Repo\thrivingskill.app\.agents\teamwork\test_writer_e2e_1\

Task Objective:
Build the complete Dual Track E2E Test Suite (Tiers 1-4) derived from user requirements and specifications, and publish TEST_READY.md.

Instructions:
1. First, read ORIGINAL_REQUEST.md at d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md, PROJECT.md at d:\Repo\thrivingskill.app\PROJECT.md, and AGENTS.md at d:\Repo\thrivingskill.app\AGENTS.md.
2. Review E2E Testing Track Principles:
   - Derives tests from user requirements in ORIGINAL_REQUEST.md, not implementation internals.
   - 4-Tier test design:
     * Tier 1: Feature Coverage (>=5 test cases per feature)
     * Tier 2: Boundary & Corner Cases (>=5 test cases per feature)
     * Tier 3: Cross-Feature Combinations (pairwise interactions)
     * Tier 4: Real-World Application Scenarios (end-to-end student & admin workflows)
   - Interface-compatible: test against live staging backend (https://staging.thrivingskill.com/wp-json) and static code contracts.
   - Use dynamic test accounts via `/learnpress/v1/token/register` for non-destructive live testing.
3. Deliverables:
   - Create `TEST_INFRA.md` at project root documenting test philosophy, 4-tier feature inventory, and architecture.
   - Implement the runnable test suite in `scripts/e2e_full_suite.js`. Follow Rule 4: Windows PowerShell safe standalone Node script.
   - Run the test suite: `node scripts/e2e_full_suite.js`.
   - Publish `TEST_READY.md` at project root with runner command, tier breakdown, and feature checklist.
   - Document results in `d:\Repo\thrivingskill.app\.agents\teamwork\test_writer_e2e_1\handoff.md`.
4. Update `progress.md` in your directory regularly.
5. When complete, send a message to orchestrator with handoff report path and summary.
