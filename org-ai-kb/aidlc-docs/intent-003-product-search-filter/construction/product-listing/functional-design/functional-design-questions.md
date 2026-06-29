# Functional Design — Clarification Questions

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: functional-design
Step: clarification
Generated: 2026-06-29

## Context

The behaviour of this unit is almost fully specified by `requirements.md`
(FR-1…FR-10, NFR-1/NFR-2) and the wireframe artifacts. The search semantics
(name-only, case-insensitive, single contiguous trimmed substring), the price
filter (optional inclusive bounds, blank min = 0, blank max = no upper bound),
AND-combination, explicit-submit application, distinct empty-state, conditional
Clear, no-persistence, and the full-catalogue default are all locked upstream
and are NOT re-litigated here.

The questions below are the genuinely open *functional-design* decisions that
the requirements leave under-specified and that materially affect how the
domain entities and business rules are modelled. None of them are tech-stack or
UI questions — they are about the business logic of normalising and validating
filter inputs and how the filtered result is conceptually modelled.

---

### Q1: How is a raw price input string normalised before it becomes a numeric bound?

FR-3 says the two price inputs are "optional numeric inputs" with blank min = 0
and blank max = no upper bound, but does not define how a raw input value is
turned into a number or what counts as "blank".

a) **Minimal normalisation** — trim surrounding whitespace; a value that is
   empty after trimming is "absent" (blank); otherwise parse it as a plain
   decimal number. No currency symbols, no thousands separators, no locale
   handling.
b) **Lenient normalisation** — additionally strip a leading currency symbol
   (`$`) and thousands separators (commas) before parsing, to be forgiving of
   shopper input.
c) **Strict numeric** — accept only a bare decimal number with no surrounding
   whitespace; treat anything else (including padded whitespace) as invalid.
d) Other.

**Trade Offs:** (a) is simplest and matches the tiny, plain-number catalogue
($14.50–$129.00) with no formatted prices; it keeps the business rule trivial
and easy to verify. (b) is more shopper-forgiving but adds rules with little
payoff for a 6-product demo and risks ambiguity (is `1,000` one thousand or
two values?). (c) is the most predictable but rejects harmless leading/trailing
spaces, which is user-hostile. Note FR-1/FR-2 already specify trimming for the
search term, so trimming the price inputs (option a) is the consistent choice.

**Recommendation:** (a) — trim then parse as a plain decimal; empty-after-trim
means the bound is absent. Consistent with the search-term trimming already
mandated and adequate for the plain-number catalogue.

[Answer]: a) Minimal normalisation — trim, then parse as a plain decimal; empty-after-trim = absent bound. (Combines with the Q2 decision to use numeric-only input controls.)

---

### Q2: How is a non-numeric or otherwise unparseable price input handled?

The requirements do not say what happens if a price input cannot be parsed as a
number (e.g. `abc`, `1.2.3`, a negative number, `NaN`). This needs a defined
business rule so the price filter is deterministic.

a) **Invalid → treated as absent** — an unparseable (or negative) price input
   is treated exactly like a blank bound: a bad min imposes no lower bound, a
   bad max imposes no upper bound. The filter never errors; it degrades to the
   full price range for that side.
b) **Invalid → empty result** — any unparseable price input makes the price
   filter match nothing (the whole submit yields the empty-state).
c) **Invalid → block submit** — submission is rejected / no recompute happens
   until the input is corrected (requires a validation-error affordance not in
   the wireframes).
d) Other.

**Trade Offs:** (a) is the most forgiving and never surprises the shopper with a
blank catalogue or a blocked button; it keeps the result a total function of the
inputs and needs no new error UI (the wireframes define only the grid, the
empty-state, and the load-error notice — no input-validation error state). (b)
is defensible but punishes a typo with an apparently "broken" empty catalogue.
(c) introduces an input-validation/error affordance the wireframes do not
include and would contradict FR-5's "recompute on submit". A negative number is
folded in here because a negative lower bound is equivalent to no lower bound
and a negative upper bound can never match a positive-priced product — treating
it as absent (a) avoids a surprising empty grid.

**Recommendation:** (a) — treat unparseable or negative price inputs as absent
(no bound on that side). Deterministic, no new error UI, consistent with the
"forgiving default" spirit of FR-6.

[Answer]: d) Other — Use NUMERIC-ONLY input controls for the price min/max so non-numeric values cannot be entered in the first place (HTML number inputs with `min="0"` and a decimal step; negatives and letters are rejected at the input layer). As a safety net, the business rule still treats any blank/absent value as "no bound on that side" (per Q1). This makes the unparseable case effectively unreachable through the UI while keeping the filter a total, deterministic function of its inputs; no separate validation-error UI is introduced.

---

### Q3: When the minimum exceeds the maximum (inverted range), what is the result?

FR-3 defines inclusive bounds (`min ≤ price ≤ max`) but does not say what
happens when a shopper sets, e.g., min = 100 and max = 20.

a) **Honour literally → empty result** — apply `min ≤ price ≤ max` exactly; an
   inverted range matches no product, so the submit yields the empty-state
   message (FR-7). No special-casing.
b) **Auto-correct → swap the bounds** — silently treat min/max as
   low/high and swap them so `20 ≤ price ≤ 100`.
c) **Treat as no price filter** — ignore both bounds when inverted.
d) Other.

**Trade Offs:** (a) keeps the price predicate a single, simple inclusive test
with no special branch, and the resulting empty-state is an honest, truthful
reflection of "no product is both ≥100 and ≤20"; it is the most faithful to the
literal FR-3 wording and the easiest business rule to state and verify. (b) is
friendlier but silently overrides what the shopper typed, which can be
surprising and adds a normalisation rule. (c) hides the inconsistency but is the
least transparent. Option (a) reuses the empty-state the system already has for
no-match.

**Recommendation:** (a) — honour the bounds literally; an inverted range simply
matches nothing and shows the empty-state. Keeps the price predicate a single
inclusive comparison with no special-casing and is the most faithful to FR-3.

[Answer]: a) Honour literally → empty result. An inverted range (min > max) matches no product and yields the empty-state (FR-7); no special-casing.

---

### Q4: How is the search term normalised beyond the specified trim?

FR-1/FR-2 specify: trim leading/trailing whitespace, lowercase, then match as a
single contiguous substring against `name` only. Two residual edge cases need a
defined rule.

a) **Trim + simple lowercase only** — exactly as written: trim ends, lowercase
   both term and name with a simple (ASCII/locale-default) case fold, substring
   match. A term that is all-whitespace trims to empty and therefore imposes no
   search constraint (behaves like FR-6's empty term → full catalogue for the
   search dimension). Internal whitespace inside a non-empty term is preserved
   verbatim (so "lamp  aurora" with two spaces is matched literally).
b) **Trim + collapse internal whitespace** — additionally collapse runs of
   internal whitespace to a single space before matching, so "lamp   aurora"
   matches "lamp aurora".
c) **Trim + Unicode-aware case folding** — use full Unicode case folding rather
   than a simple lowercase.
d) Other.

**Trade Offs:** (a) is the literal reading of FR-1/FR-2 ("the *entire trimmed*
search input is treated as one substring", "no whitespace tokenisation") and is
the simplest, most predictable rule; all-whitespace → empty falls out naturally
and aligns with FR-6. (b) is friendlier for accidental double-spaces but starts
to "interpret" the term, which FR-2 explicitly warns against (no tokenisation /
exact contiguous sequence) — collapsing whitespace is a mild form of
re-interpretation. (c) matters only for non-ASCII product names; the current
catalogue is ASCII, so it adds complexity with no present payoff, though it is
the most correct for internationalised data.

**Recommendation:** (a) — trim and simple-lowercase only; preserve internal
whitespace verbatim; an all-whitespace term collapses to empty and imposes no
search constraint. Most faithful to FR-1/FR-2 and to "no tokenisation".

[Answer]: a) Trim + simple lowercase only; internal whitespace preserved verbatim; an all-whitespace term collapses to empty (full catalogue for the search dimension).

---

### Q5: Is the filtered catalogue modelled as a pure derived view or as a stateful entity?

This is the core domain-modelling decision for `domain-entities.md`. The filter
controls and the result can be conceptualised two ways.

a) **Pure derived view** — model the catalogue as the single source of truth and
   the displayed result set as a pure function `filter(catalogue, criteria)`
   recomputed on each explicit submit (FR-5). The "applied criteria" (term, min,
   max) are a value object captured at submit time; there is no long-lived
   mutable result entity and no lifecycle/state machine — the result is always
   derivable from (catalogue, last-applied-criteria). No persistence (FR-9).
b) **Stateful filter session** — model a stateful "search session" entity that
   holds current control values, the last-applied criteria, and the current
   result set, with a lifecycle (default → filtered → empty → cleared) and
   transitions driven by submit/clear.
c) Other.

**Trade Offs:** (a) matches the requirements precisely — explicit-submit
recompute (FR-5), no persistence/reset-on-load (FR-9), full-catalogue default
when criteria are empty (FR-6), and a result that is purely a function of
inputs. It yields the simplest, most testable domain model (one value object +
one pure predicate) and avoids inventing lifecycle state the requirements do not
call for. The "pending control values vs applied criteria" distinction (FR-5:
editing without submitting changes nothing) is captured as the difference
between the live control values and the value object snapshotted at submit, not
as entity lifecycle. (b) front-loads a state machine and mutable result entity
that the requirements do not need (there is no persistence, no concurrency, no
multi-step lifecycle); the "states" in (b) are really just which derived view is
shown, which (a) already captures via the criteria value object.

**Recommendation:** (a) — model the result as a pure derived view over the
catalogue, with an "applied filter criteria" value object captured at submit.
The only stateful nuance (pending vs applied criteria, FR-5) is expressed as
that snapshot, not as an entity lifecycle. This is the cleanest fit for FR-5,
FR-6, and FR-9 and keeps the domain model minimal and fully testable.

[Answer]: a) Pure derived view — catalogue is the single source of truth; result = filter(catalogue, appliedCriteria); applied criteria is a value object snapshotted at submit (pending vs applied distinction per FR-5); no lifecycle entity, no persistence (FR-9).
