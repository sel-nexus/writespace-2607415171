# WriteSpace change-run changelog

## Added
- Safe browser-local light/dark preference under `writespace_theme`, initialized to light for absent/invalid/unavailable storage.
- One App-root controller and a named, keyboard-operable ThemeToggle in public/authenticated navigation; preference independent of session/logout.
- Class-based Tailwind dark mode and inline dark slate styling across landing, authentication, reading, writing, administrator dashboard, user tables/cards, forms, errors, metadata and controls.

## Modified files
- App.jsx, tailwind.config.js; new utils/theme.js, ThemeToggle.jsx and theme tests.
- PublicNavbar.jsx/Navbar.jsx and existing page signatures forward the single theme controller without replacing page-owned navigation.
- LandingPage.jsx, LoginPage.jsx, RegisterPage.jsx, DemoWarning.jsx, BlogsPage.jsx, BlogReaderPage.jsx, PostEditorPage.jsx, NotFoundPage.jsx, AdminDashboardPage.jsx, UsersPage.jsx, StatCard.jsx and UserRow.jsx receive paired dark variants and readable JSX.
- Component/utility tests extended for both themes, independent validation omissions/types, helper fallbacks, content counting and 65,536-character content create/edit operations.
- New theme/auth-theme/writing-theme/admin-theme/recovery E2E specs; existing discovery/auth/reading/preflight specs corrected for exact/scoped locators and expanded UI-click journeys.
- README and verification/handoff artifacts document actual results and limitations.

## Preserved / migration
No breaking changes or migrations. Existing routes, layouts, light styles, role/ownership rules, demo credentials, data schemas and CRUD remain. Only new persisted key is writespace_theme; existing posts/users/session need no transformation. Counter already existed: preserved and verified, not duplicated. Content remains uncapped; inherited title cap remains 140. No Context, OS synchronization, backend/API/database, custom CSS or dependency upgrade introduced. Existing static Docker/Vercel deployment remains unchanged.

## Verification and known limitations
Baseline 81 tests passed. Slice verifies: theme 56, auth 22, writing 33, administration 33. Post-review full suite 196 tests passed in 12 files; production build passed. Independent critic round 2 PASS 1.00, zero high failures. Chromium preflight captured 28 representative desktop/mobile views without browser errors.

E2E **blocked/unverified**: Playwright test execution timed out before collection/output (900s, 600s with preview restarted and reachable, then authorized 60s single-spec list diagnostic). Human approved proceeding with warning. Browser captures do not substitute for journey results.

Inherited npm audit reports 11 vulnerabilities (2 moderate, 7 high, 2 critical); upgrade remediation deferred outside narrow scope. Critic also identified inherited helper behavior: padded roles such as ` Admin ` validate after trimming but persist untrimmed, then fail exact admin-role checks. Native role dropdown emits canonical values; discrepancy deferred rather than altering permissions in a theme revision. Client-local passwords/security/data-loss limitations remain documented.
