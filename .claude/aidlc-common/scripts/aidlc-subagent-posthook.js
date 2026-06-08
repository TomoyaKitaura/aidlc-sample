#!/usr/bin/env node
// AI-DLC PostToolUse hook (Claude Code port of process-check-hook.kiro.hook).
//
// Fires after the Agent/Task tool completes. When the completed sub-agent is an
// AI-DLC builder or validator, injects a reminder into the orchestrator's
// (main agent's) context to run process_checker and read the checkpoint before
// proceeding. For any other sub-agent it stays silent, so general Agent usage
// is not affected.

"use strict";

const fs = require("fs");

function main() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf-8");
  } catch (_) {
    process.exit(0); // no stdin → nothing to do
  }

  let payload = {};
  try {
    payload = JSON.parse(raw || "{}");
  } catch (_) {
    process.exit(0);
  }

  const toolInput = payload.tool_input || {};
  // Claude Code's Agent/Task tool carries the chosen agent in `subagent_type`.
  const subagentType = String(
    toolInput.subagent_type || toolInput.subagentType || ""
  );

  const isAidlc =
    subagentType === "aidlc-builder-agent" ||
    subagentType === "aidlc-validator-agent";

  if (!isAidlc) {
    process.exit(0); // not an AI-DLC sub-agent → no reminder
  }

  const reminder = [
    "MANDATORY: An AI-DLC sub-agent just completed. Before doing anything else,",
    "run process_checker and read the checkpoint:",
    "1. Run: node .claude/aidlc-common/scripts/aidlc-process-checker.js --from-state <intent-dir>/state/process-checkpoint.json",
    "2. Read the checkpoint file.",
    "3. If 'error' is not null, follow the 'action' instruction to fix the issue.",
    "4. If 'error' is null, proceed with the step indicated in 'next'.",
    "Do NOT skip this. Do NOT proceed without completing these steps.",
  ].join("\n");

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: reminder,
      },
    })
  );
  process.exit(0);
}

main();
