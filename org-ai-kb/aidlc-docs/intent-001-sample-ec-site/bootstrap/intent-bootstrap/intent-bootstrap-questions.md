# Intent Bootstrap — Clarifying Questions

> human-clarification: "false" — answers below are the builder's own recommended answers, filled in for traceability. No human was consulted.

### Q1: Intent slug

The auto-generated kebab-case slug for this intent is `sample-ec-site`. Do you want to use it or override?

a) Use `sample-ec-site` (auto-generated)
b) Override with a custom slug

**Recommendation:** (a) `sample-ec-site` — concise, ASCII kebab-case, and accurately captures the "サンプルECサイト" (sample EC site) intent.

[Answer]: a) Use `sample-ec-site`. It is a clear, ASCII kebab-case derivation of the intent.

### Q2: Intent type

How should this intent be classified by type?

a) feature (new build)
b) bug fix
c) migration
d) refactor
e) prototype

**Trade Offs:** "prototype" signals throwaway/exploratory work with lower rigour; "feature" signals an intended deliverable built from scratch. The phrasing "サンプルECサイトを構築したい" ("want to build a sample EC site") describes building a working minimal site, not throwaway exploration.

**Recommendation:** (a) feature — this is a greenfield build of a working (if minimal) EC site, best treated as a feature build rather than a throwaway prototype.

[Answer]: a) feature (greenfield new build). The intent is to construct a working minimal EC site from scratch.

### Q3: Classification (greenfield / brownfield / mixed)

Is there an existing codebase or repository in scope for this intent?

a) greenfield — brand-new build, no existing repos
b) brownfield — extend/modify existing repos
c) mixed

**Recommendation:** (a) greenfield — the intent describes constructing a new sample EC site with no reference to any existing codebase or repository.

[Answer]: a) greenfield. No existing repos are in scope; everything is built new. Consequently repos-in-scope = none, RE-kb status = n/a, and reverse-engineering is not needed.
