import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
import eslintPluginEslintComments from 'eslint-plugin-eslint-comments';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		plugins: {
			'@typescript-eslint': ts.plugin,
			'eslint-comments': eslintPluginEslintComments
		},
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'no-undef': 'off',
			'svelte/require-each-key': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					varsIgnorePattern: '^(T|_|_unused|_event|_e).*$',
					argsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'eslint-comments/no-use': ['error', { allow: [] }]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		ignores: ['eslint.config.js', 'svelte.config.js'],
		plugins: {
			svelte: svelte
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			},
			globals: {
				...globals.browser
			}
		},
		processor: svelte.processors['.svelte'],
		rules: {
			'eslint-comments/no-use': ['error', { allow: [] }],
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/no-target-blank': 'warn'
		}
	},
	prettier,
	...svelte.configs.prettier
);
