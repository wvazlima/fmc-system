#!/usr/bin/env bash
# PostToolUse (Edit|Write)
# Depois de editar TypeScript: formata e roda lint + typecheck do pacote afetado.
# Não bloqueia a edição; devolve o resultado para o agente corrigir.
set -uo pipefail

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<<"$input")
[[ -z "$file" ]] && exit 0

case "$file" in
  *.ts|*.tsx|*.mts|*.cts) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/*|*/dist/*|*/.next/*) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
[[ -f "$root/package.json" ]] || exit 0

# descobre o pacote dono do arquivo, subindo até achar um package.json
dir=$(dirname "$file")
pkg_dir=""
while [[ "$dir" == "$root"/* ]]; do
  if [[ -f "$dir/package.json" ]]; then pkg_dir="$dir"; break; fi
  dir=$(dirname "$dir")
done
[[ -z "$pkg_dir" ]] && exit 0

pkg=$(jq -r '.name // empty' "$pkg_dir/package.json")
[[ -z "$pkg" ]] && exit 0

cd "$root" || exit 0
command -v pnpm >/dev/null 2>&1 || exit 0

# 1. formatar só o arquivo tocado (rápido e silencioso)
pnpm exec prettier --write "$file" >/dev/null 2>&1

# 2. lint e typecheck do pacote; só reporta quando falha
out=""
if ! lint_out=$(pnpm --filter "$pkg" lint 2>&1); then
  out+=$'### lint falhou em '"$pkg"$'\n'"$(tail -n 40 <<<"$lint_out")"$'\n\n'
fi
if ! tc_out=$(pnpm --filter "$pkg" typecheck 2>&1); then
  out+=$'### typecheck falhou em '"$pkg"$'\n'"$(tail -n 40 <<<"$tc_out")"$'\n'
fi

if [[ -n "$out" ]]; then
  printf '%s' "$out" >&2
  exit 2   # devolve a saída ao agente para ele corrigir
fi
exit 0
