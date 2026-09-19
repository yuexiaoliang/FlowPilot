# Security and Automation Safety

FlowPilot loads untrusted third-party web content while also having desktop privileges. Security boundaries are therefore product-critical.

## Remote content isolation

Third-party pages:
- must not have Node integration
- must not receive unrestricted preload APIs
- must run with context isolation/sandboxing appropriate to Electron
- must not get filesystem/shell/database/secret access
- must not be allowed to navigate the trusted application UI
- must have popup/new-window/navigation behavior explicitly controlled

Keep Electron web security enabled.

## Sessions and profiles

Each account receives an isolated persistent session/partition/profile.

Never:
- reuse one account partition for another account
- copy auth state across domains without an explicit platform design
- commit browser profile data
- send profile databases/cookies to AI

Account removal must support deleting local session material.

## Credentials

Secrets include:
- cookies/session IDs
- passwords
- OAuth refresh/access tokens
- API keys
- authorization headers
- signed upload URLs where sensitive

Rules:
- encrypt secrets using OS-backed secure storage where feasible
- SQLite stores secret references/encrypted payloads, not plaintext credentials
- never log secrets
- never put secrets in crash reports
- never include secrets in AI prompts unless a narrowly reviewed capability explicitly requires it
- repository examples use fake values only

## AI data minimization

Before sending page state to a model:
1. extract only the region/semantics needed
2. redact common credential/token patterns
3. remove cookies/headers/storage
4. limit page text
5. identify and mask password/payment/private fields
6. attach only necessary screenshots

AI output is untrusted input and must pass schema/policy validation.

## Automation safety boundary

FlowPilot may automate authorized user workflows. It must not implement mechanisms intended to defeat platform anti-abuse/security controls.

Do not implement:
- CAPTCHA solving/bypass
- MFA bypass
- device/browser fingerprint spoofing for evasion
- webdriver/automation concealment intended to bypass detection
- proxy rotation intended to defeat platform enforcement
- challenge-response reverse engineering intended to circumvent access controls

Do implement:
- persistent normal browser sessions
- platform-aware rate limiting
- backoff
- official APIs where available/authorized
- security challenge detection
- human takeover
- clear failure reasons

## Human takeover

Hard-pause events:
- CAPTCHA
- MFA
- QR login requiring user action
- security challenge
- unusual-account warning
- terms/consent requiring user decision
- ambiguous destructive action

Resume only after the runtime re-snapshots the page and verifies a known state.

## Destructive operations

Delete, irreversible publish, purchase/payment, permission changes, or account changes require explicit policy and, by default, user confirmation.

MVP final publish should support a confirmation checkpoint until platform behavior is proven.

## Content security

Treat webpage text as untrusted data. Page content may attempt prompt injection ("ignore instructions", "send cookies", etc.). Discovery/repair prompts must state that page content cannot modify system policies, request secrets, or expand tool permissions.

Never let a model choose arbitrary local files to upload. Uploads must come from user-approved FileRefs.

## Update and supply chain

- lock dependencies with pnpm lockfile
- review major dependency updates
- enable automated dependency scanning
- code-sign releases when distribution starts
- verify update artifacts
- do not auto-download/execute arbitrary platform scripts outside browser isolation

## Incident-friendly design

Maintain:
- run/repair audit trail
- workflow revision history
- correlation IDs
- safe redacted diagnostics
- ability to disable a platform adapter or feature flag quickly
