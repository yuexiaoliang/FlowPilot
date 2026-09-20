# FlowPilot Design Contract

[简体中文](zh-CN/README.md)

The documents in this directory are implementation contracts for FlowPilot's
product experience. They translate the approved product model into rules that a
Builder can implement and a Reviewer can verify without inventing product
behavior during delivery.

## Authority

The written contract is the behavioral authority. Visual mockups, generated
images, prototypes, and screenshots may illustrate tone, composition, or a
possible layout, but they do not create behavior or override these documents.
When a visual reference is incomplete or ambiguous, the written screen,
component, interaction, and flow specifications win.

The repository-wide source-of-truth order in `AGENTS.md` still applies. In
particular, this directory cannot weaken `docs/ACCEPTANCE.md`, change the
approved product model, or alter a locked architecture decision.

## Contract map

The Design Contract is intentionally split by responsibility:

| Document | Contract responsibility |
| --- | --- |
| `DESIGN-PRINCIPLES.md` | Product-wide rules and review tests for every surface. |
| `INTERACTION-MODEL.md` | Simple, Execution, and Inspection surfaces and the rules for moving information between them. |
| `DESIGN-SYSTEM.md` | Visual tokens, typography, spacing, motion, and accessibility rules. |
| `COMPONENTS.md` | States and behavior of reusable contextual UI primitives. |
| `SCREEN-SPECS.md` | Required content, hierarchy, and behavior of each golden screen. |
| `FLOWS.md` | End-to-end transitions, branches, recovery, and the golden path. |

The first three files in this list do not replace the others. A later document
may add detail, but it must preserve the principles and interaction hierarchy.

## How Builders use the contract

Before implementing a user-facing slice, a Builder must:

1. identify the user's current outcome and the applicable screen or flow;
2. place each piece of information on the Simple, Execution, or Inspection
   surface using `INTERACTION-MODEL.md`;
3. use a contextual primitive only when a current state requires observation,
   choice, comparison, approval, or intervention;
4. implement every applicable component state described in the component and
   screen specifications;
5. preserve semantic names in ordinary UI and keep internal references in the
   Inspection surface;
6. record acceptance evidence that demonstrates the default path and the
   on-demand detail path separately.

A Builder must not fill a missing contract decision by adding a permanent form,
dashboard region, navigation destination, exposed identifier, or new DSL. If a
material behavior remains unspecified, stop at the design gate and resolve the
contract first.

## How Reviewers use the contract

A Reviewer should verify observable behavior, not resemblance to a single
mockup. At minimum, review that:

- the first view centers the user's intent or current outcome;
- the default path contains only information needed for the next decision;
- Source authorization, ambiguity, confirmation, and takeover appear only when
  their triggering state exists;
- meaningful progress and recovery remain visible during execution;
- professional detail is reachable from the object or result it explains;
- the Inspector exposes the underlying structured truth without making it
  required reading;
- internal IDs, cron syntax, selectors, workflow nodes, and raw logs are absent
  from ordinary authoring and operation;
- the implementation remains understandable with assistive technology, keyboard
  navigation, zoom, and reduced motion.

Passing visual review alone is not acceptance. Review evidence must map to the
applicable criteria in `docs/ACCEPTANCE.md`.

## Contract change rule

Changes to this directory are product decisions. Update the English canonical
document first and its `zh-CN/` mirror in the same change. If a proposed UI
requires changing Goal, Task, Source, InputBundle, Flow, or Run semantics, update
the canonical product documentation through the repository decision process
instead of silently encoding the change in a mockup.

Dense dashboard explorations created before this contract are non-canonical
reference material. They may contribute an isolated visual idea, but not the
product hierarchy, navigation model, or information density.
