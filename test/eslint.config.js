import love from 'eslint-config-love'
import stylistic from '@stylistic/eslint-plugin'

export default [
  // FORMATTING RULES
  stylistic.configs['recommended-flat'],
  {
    rules: {
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/indent': ['error', 2, { ignoreComments: true }],
      '@stylistic/max-statements-per-line': ['error', { max: 2 }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/type-generic-spacing': 'error'
    }
  },
  // STRUCTURAL RULES
  {
    ...love,
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      // '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }], // disallow typecasting with e.g. <string> because it's very confusing vs generics
      '@typescript-eslint/explicit-function-return-type': 'off', // useless boilerplate
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off', // would have disabled using ! to mark something as non-null,
                                                         // generally not avoidable without wasting cpu cycles on a check
      '@typescript-eslint/no-unused-vars': 'off', // typescript already reports this and VSCode darkens the variable
      '@typescript-eslint/prefer-destructuring': 'off', // no reason to force destructuring
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignoreConditionalTests: true }], // this is supposed to be the default but apparently eslint-config-love overrode it to something stupid
      '@typescript-eslint/prefer-readonly': 'off', // readonly adds a lot of complication and often infects other code with its complexity
      '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true }], // `${myVar}` is fine if myVar is `any`
      '@typescript-eslint/strict-boolean-expressions': 'off' // we know how truthiness works, annoying to have to avoid
    }
  }
]
