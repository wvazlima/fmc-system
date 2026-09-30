/**
 * Componentes compartilhados, sem domínio.
 *
 * Componente que conhece `cattle_lot`, `plot` ou `season` mora em `apps/web`, não aqui.
 *
 * Todo componente daqui respeita `.claude/rules/web.md`:
 * alvo de toque ≥ 44×44 px, contraste mínimo WCAG AA, `<label>` associado em todo
 * campo, nada crítico dependendo de `hover`.
 */

export const TOUCH_TARGET_MIN_PX = 44

export {}
