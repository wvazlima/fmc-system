#!/usr/bin/env bash
# PreToolUse (Edit|Write|NotebookEdit)
# Bloqueia a edição de uma migração já aplicada.
# Migração aplicada é imutável (ADR-0005, .claude/rules/db.md): correção vem em
# migração nova. Uma migração é considerada "aplicada" quando já está no git HEAD.
set -uo pipefail

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<<"$input")
[[ -z "$file" ]] && exit 0

# só interessa o diretório de migrations do @fmc/db
case "$file" in
  *packages/db/migrations/*) ;;
  *) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="${file#"$root"/}"

# arquivo que ainda não está no HEAD é migração nova: pode editar
if ! git -C "$root" cat-file -e "HEAD:$rel" 2>/dev/null; then
  exit 0
fi

jq -n --arg f "$rel" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("Migração já aplicada e versionada: \($f). Migração aplicada é imutável (ADR-0005). Gere uma migração NOVA com `pnpm db:generate` para corrigir.")
  }
}'
