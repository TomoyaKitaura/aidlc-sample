# Workflow Composition — Clarification Questions

Intent: intent-001-sample-ec-site (greenfield, minimal EC site — product listing, product detail, cart, checkout/order; no existing repos; reverse-engineering not needed).

The following questions tailor the composed workflow and the OWASP security lens to this intent. A recommendation is provided for each; please confirm or override. `[Answer]:` lines are left blank for you.

> **Human decision (recorded by orchestrator):** The human explicitly chose the **shortest workflow: requirements analysis → code generation → build and test**, single unit, with the OWASP lens **deactivated**. All design/NFR stages are skipped per this decision. Answers below reflect that choice (which overrides several of the builder's recommendations).

---

## Part 1 — Workflow shape

Always-on stages already assumed (not asked): requirements analysis, code generation, build and test. Reverse-engineering is skipped (greenfield, no repos, no integration targets — per bootstrap context).

### Q1: Is this built as a single deployable unit, or split into multiple units/services?

a) Single unit — one application/service covering all four capabilities (catalogue, cart, checkout/order).
b) Multiple units — e.g. separate catalogue, cart, and order/checkout services.
c) Other / not sure.

**Trade Offs:** A single unit keeps the workflow lean — the per-unit construction stages collapse into one pass and the units generation stage is unnecessary. Splitting into multiple units adds the units generation stage and fans out construction stages per unit, which is heavier than a minimal sample warrants.

**Recommendation:** (a) Single unit.

[Answer]: (a) Single unit. Confirmed.

### Q2: An EC site is inherently user-facing (catalogue, detail, cart, checkout screens). Should the workflow include the wireframes stage to map screens and screen-data before design?

a) Yes — include the wireframes stage.
b) No — skip wireframes.
c) Other.

**Recommendation:** (b) Skip wireframes for now.

[Answer]: (b) Skip wireframes.

### Q3: How far down the construction design stages should the workflow go for this sample?

a) Full design depth — include NFR assessment, NFR design, and infrastructure design.
b) Light — include NFR assessment only, skip NFR design and infrastructure design.
c) Minimal — skip all three; go from functional design straight to code generation.

**Recommendation:** (b) Light.

[Answer]: (c) Minimal — skip NFR assessment, NFR design, and infrastructure design. (Human chose the shortest path; functional design is ALSO skipped — see Q4.)

### Q4: Confirm the inception stages user stories and application design are included.

a) Include both.
b) Include user stories only.
c) Include application design only.
d) Skip both (treat as trivial).

**Recommendation:** (a) Include both.

[Answer]: (d) Skip both. Per the human's explicit "shortest path: requirements → code → test" decision, user stories, application design, AND functional design are all skipped. The workflow is requirements-analysis → code-generation → build-and-test only. (Overrides the builder's recommendation; the orchestrator may insert a skipped stage mid-flight per composition rule 5 if a real ambiguity surfaces during code generation.)

---

## Part 2 — OWASP security lens

The OWASP lens has default activation true and applies to all stages.

### Q5: Activate the OWASP security lens for this intent?

a) Yes — activate (default).
b) No — deactivate.

**Recommendation:** (a) Yes, activate.

[Answer]: (b) No — deactivate. The human chose the shortest plan without the security lens. (Overrides the default and the builder's recommendation.)

### Q6: What is the sensitivity of the data this system handles?

[Answer]: N/A — OWASP lens deactivated (Q5=b). For reference: sample data only, simulated checkout, no real PII/payment data.

### Q7: What authentication model applies, and is checkout guest-only or account-based?

[Answer]: N/A — OWASP lens deactivated. For reference: guest checkout only, no accounts.

### Q8: Is the system internet-facing, and what is the risk tolerance?

[Answer]: N/A — OWASP lens deactivated. For reference: sample/demo, no specific compliance regime assumed.
