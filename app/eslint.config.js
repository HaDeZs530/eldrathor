import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: { ...globals.browser, __ELD_BUILD__: 'readonly' }, // __ELD_BUILD__: vite.config.js `define`
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // a screen may export its own constants / hooks next to the component (fast refresh just reloads the module)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Node-side files: the Vite config (trace receiver) and the tests
    files: ['vite.config.js', '**/*.test.js'],
    languageOptions: { globals: { ...globals.node } },
  },
])
