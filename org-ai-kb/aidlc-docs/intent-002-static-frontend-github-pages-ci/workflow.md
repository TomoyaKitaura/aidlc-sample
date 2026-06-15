# Inception phase
requirements-analysis org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/intent.md
application-design org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/inception/requirements-analysis/requirements.md

# Construction phase — single unit: static-frontend
functional-design --unit static-frontend org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/inception/requirements-analysis/requirements.md org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/inception/application-design/components.md
infrastructure-design --unit static-frontend org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/inception/application-design/components.md org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/construction/static-frontend/functional-design/business-logic-model.md
code-generation --unit static-frontend org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/construction/static-frontend/functional-design/business-logic-model.md org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/construction/static-frontend/infrastructure-design/infrastructure-design.md

# build-and-test is catalogue status 🚧 (not yet implemented — no skill folder under .claude/skills/).
# Included per right-sizing rule 2 (always-on). The orchestrator will surface the missing folder when it
# reaches this line; until the skill exists, build verification is covered as described in workflow-rationale.md.
build-and-test --phase construction org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/inception/requirements-analysis/requirements.md org-ai-kb/aidlc-docs/intent-002-static-frontend-github-pages-ci/construction/static-frontend/code-generation/CODE_SUMMARY.md
