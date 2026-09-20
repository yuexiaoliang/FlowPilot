# Documentation Language Policy

FlowPilot maintains two human-readable documentation languages:

- **English** — canonical/default
- **简体中文** — synchronized reading mirror

## Canonical rule

The English document is the source of truth. If English and Chinese disagree, implementation, architecture, acceptance, and Codex behavior follow the English version, and the Chinese mirror should be corrected.

The Chinese version must never introduce requirements that do not exist in the English canonical document.

## File layout

- `README.md` / `README.zh-CN.md`
- `AGENTS.md` / `AGENTS.zh-CN.md`
- `docs/<FILE>.md` / `docs/zh-CN/<FILE>.md`
- `docs/adr/<FILE>.md` / `docs/zh-CN/adr/<FILE>.md`
- future stable design docs: `design/<FILE>.md` / `design/zh-CN/<FILE>.md`

## What must be bilingual

Maintain Chinese mirrors for durable human-facing project documents: product model, project state, development plan, acceptance, architecture, technology decisions, security, workflow semantics, development process, stable design contracts, and ADRs.

## What stays English-only by default

Do not duplicate source code, tests, migrations, package/config files, `.codex/config.toml`, `.codex/agents/*.toml`, generated artifacts, transient `work/` Task Packets, temporary handoff notes, or commit messages unless there is a specific need.

## Update rule

When a canonical English document changes materially:

1. update English first;
2. update the corresponding Chinese mirror in the same change when practical;
3. keep headings/structure comparable;
4. keep code identifiers, schema names, paths, commands, and API names unchanged;
5. translate meaning, not implementation identifiers.

Trivial typo fixes that do not change meaning may defer mirror synchronization.

## Codex rule

Codex MUST use English canonical documents for planning, implementation, and acceptance. Chinese mirrors are for human readability and must not override English canonical content.

When a Codex task materially changes a durable bilingual document, Builder should update both language versions before Gatekeeper review.

Gatekeeper should treat a missing/outdated Chinese mirror as blocking for a deliberate durable documentation change, but non-blocking for code-only changes that do not alter documented semantics.

## Translation style

Use clear Simplified Chinese. Keep precise domain terms such as Goal, Task, Source, InputBundle, Flow, Run, Workflow IR, and BrowserDriver when the English term improves precision. Preserve code and technical identifiers.

## Navigation

Top-level documentation indexes should provide obvious links between English and Chinese versions.