#!/usr/bin/env bash
# PreToolUse (Bash) — só dispara em `git commit`, via o campo `if` do hook.
# Roda os testes dos pacotes afetados pelo que está em stage.
set -uo pipefail

input=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
[[ "$cmd" != *"git commit"* ]] && exit 0
# --no-verify é uma decisão explícita de quem escreveu o comando
[[ "$cmd" == *"--no-verify"* ]] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0
command -v pnpm >/dev/null 2>&1 || exit 0

staged=$(git diff --cached --name-only 2>/dev/null)
[[ -z "$staged" ]] && exit 0
grep -qE '\.(ts|tsx|mts|cts)$' <<<"$staged" || exit 0

# pacotes afetados: apps/<x> e packages/<x> presentes no stage
# (sem mapfile: o bash do macOS ainda é 3.2)
filters=()
while IFS= read -r d; do
  [[ -z "$d" ]] && continue
  [[ -f "$d/package.json" ]] || continue
  name=$(jq -r '.name // empty' "$d/package.json")
  [[ -n "$name" ]] && filters+=(--filter "$name")
done < <(grep -oE '^(apps|packages)/[^/]+' <<<"$staged" | sort -u)
[[ ${#filters[@]} -eq 0 ]] && exit 0

if ! out=$(pnpm "${filters[@]}" test 2>&1); then
  {
    echo "Testes falharam nos pacotes afetados pelo commit. Corrija antes de commitar."
    echo "Se o commit for intencional mesmo assim, use \`git commit --no-verify\` e explique o porquê."
    echo
    tail -n 60 <<<"$out"
  } >&2
  exit 2   # bloqueia o commit
fi
exit 0
