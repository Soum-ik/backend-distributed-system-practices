#!/usr/bin/env bun
// PreToolUse(Bash) hook: when a `git commit` is about to run, inject
// commit best-practices as guidance. Non-blocking — always allows the
// command, only adds context. Runs on Bun (project runtime).
//
// Wired in .claude/settings.json under hooks.PreToolUse.

interface HookInput {
  tool_name?: string;
  tool_input?: { command?: string };
}

const GUIDANCE = `Commit best practices for this repo (Conventional Commits):
- Subject: <type>(<scope>): <imperative summary> — types: feat|fix|refactor|perf|docs|test|chore|build|ci|style|revert
- Imperative mood ("add", not "added"); ≤50 chars (hard cap 72); no trailing period.
- Body only when the *why* isn't obvious; wrap at 72; bullets with "-".
- Never write "this commit does X", "I"/"we", or AI attribution in the message body.
- Stage intentionally (avoid blind \`git add -A\`); one logical change per commit.
- Don't commit secrets, .env, or lockfile churn unrelated to the change.
See .claude/skills/caveman-commit/SKILL.md for the full ruleset.`;

function allow(reason?: string) {
  const out: Record<string, unknown> = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
  if (reason) {
    (out.hookSpecificOutput as Record<string, unknown>).permissionDecisionReason = reason;
  }
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

let raw = '';
for await (const chunk of Bun.stdin.stream()) raw += new TextDecoder().decode(chunk);

let input: HookInput = {};
try {
  input = JSON.parse(raw) as HookInput;
} catch {
  allow(); // malformed input → don't interfere
}

const command = input.tool_input?.command ?? '';

// Match `git commit` but not `git commit --help`, log, etc.
const isCommit = /\bgit\b[^\n|&;]*\bcommit\b/.test(command) && !/--help|-h\b/.test(command);

if (isCommit) {
  allow(GUIDANCE);
} else {
  allow();
}
