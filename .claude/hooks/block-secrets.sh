#!/usr/bin/env bash
# PreToolUse (Edit|Write)
# Bloqueia gravação de segredo em arquivo versionado (constitution §10,
# .claude/rules/security.md). Segredo vive no Secret Manager ou nos secrets do Worker.
set -uo pipefail

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<<"$input")
[[ -z "$file" ]] && exit 0

content=$(jq -r '
  (.tool_input.content // empty),
  (.tool_input.new_string // empty),
  ((.tool_input.edits // []) | map(.new_string // empty) | join("\n"))
' <<<"$input" 2>/dev/null | tr -d '\r')
[[ -z "${content// }" ]] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="${file#"$root"/}"

deny() {
  jq -n --arg f "$rel" --arg why "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("Possível segredo em arquivo versionado (\($f)): \($why). Segredo vai para o Secret Manager (GCP) ou para os secrets do Worker (Cloudflare) — nunca para o repositório. Se for um valor de exemplo, use algo obviamente falso como `changeme` ou `local-only`.")
    }
  }'
  exit 0
}

# 1. .env real (o .env.example é permitido)
case "$rel" in
  *.env|*.env.local|*.env.production|*.env.prod|*.env.staging|.env|.env.*)
    case "$rel" in
      *.env.example|*.env.sample|*.env.template) ;;
      *) deny "arquivo .env real não é versionado" ;;
    esac
    ;;
esac

# 2. formatos de credencial reconhecíveis
grep -qE 'BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY'          <<<"$content" && deny "chave privada"
grep -qE '\bAKIA[0-9A-Z]{16}\b'                                 <<<"$content" && deny "access key da AWS"
grep -qE '\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{50,}' <<<"$content" && deny "token do GitHub"
grep -qE '\bsk-[A-Za-z0-9]{32,}\b'                              <<<"$content" && deny "chave de API"
grep -qE '"type"[[:space:]]*:[[:space:]]*"service_account"'     <<<"$content" && deny "service account do Google"
grep -qE '\bxox[baprs]-[A-Za-z0-9-]{10,}'                       <<<"$content" && deny "token do Slack"

# 3. atribuição de segredo com valor que parece real
#    (valores de exemplo óbvios são liberados)
while IFS= read -r line; do
  val=$(sed -E 's/.*[:=][[:space:]]*["'"'"']?([^"'"'"']*).*/\1/' <<<"$line")
  [[ ${#val} -lt 16 ]] && continue
  grep -qiE 'changeme|example|placeholder|your[-_]|dummy|sample|local-only|xxx|\$\{|\$\(|process\.env|env\.|<[a-z_]+>' <<<"$val" && continue
  deny "atribuição de segredo com valor literal"
done < <(grep -inE '(secret|password|passwd|api[-_]?key|access[-_]?token|private[-_]?key|credential)[[:space:]]*[:=]' <<<"$content" || true)

exit 0
