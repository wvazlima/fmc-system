import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

/**
 * Configuração base de ESLint do monorepo.
 * As regras aqui refletem `.claude/rules/` — não são preferência de estilo.
 * Formatação é do Prettier; `eslint-config-prettier` desliga o que conflita.
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/.next/**', '**/out/**', '**/node_modules/**', '**/.turbo/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      // `any` atravessa a validação Zod e apaga o erro (.claude/rules/api.md)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // dependência entre pacotes é por nome (@fmc/x), nunca por caminho relativo (ADR-0002)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/../../packages/**', '**/../../apps/**'],
              message:
                'Dependência entre pacotes é por nome (@fmc/...), nunca por caminho relativo. Ver ADR-0002.',
            },
          ],
        },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
)
