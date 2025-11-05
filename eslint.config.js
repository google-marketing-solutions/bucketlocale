/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting'
export default [
  {
    ignores: ["dist", "reference", "node_modules"],
  },
  js.configs.recommended,
  /**
   * https://eslint.vuejs.org
   *
   * pluginVue.configs.base
   *   -> Settings and rules to enable correct ESLint parsing.
   * pluginVue.configs[ 'flat/essential']
   *   -> base, plus rules to prevent errors or unintended behavior.
   * pluginVue.configs["flat/strongly-recommended"]
   *   -> Above, plus rules to considerably improve code readability and/or dev experience.
   * pluginVue.configs["flat/recommended"]
   *   -> Above, plus rules to enforce subjective community defaults to ensure consistency.
   */
  ...pluginVue.configs[ 'flat/essential' ],
  // https://github.com/vuejs/eslint-config-typescript
  ...vueTsEslintConfig({
    // Optional: extend additional configurations from typescript-eslint'.
    // Supports all the configurations in
    // https://typescript-eslint.io/users/configs#recommended-configurations
    // tsconfigPath: './tsconfig.json', // Removed as it was not effective
    extends: [
      // By default, only the recommended rules are enabled.
      'recommended'
      // You can also manually enable the stylistic rules.
      // "stylistic",
      // Other utility configurations, such as 'eslintRecommended', (note that it's in camelCase)
      // are also extendable here. But we don't recommend using them directly.
    ]
  }),
  // Explicit configuration for .vue files to ensure type information
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: ['./tsconfig.app.json'],
        extraFileExtensions: ['.vue']
      }
    }
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        process: 'readonly', // process.env.*
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly' // BEX related
      }
    },
    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' }
      ],
      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },
  {
    files: [ 'src-pwa/custom-service-worker.ts' ],
    languageOptions: {
      globals: {
        ...globals.serviceworker
      }
    }
  },
  prettierSkipFormatting
]
