import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

// Styling standard (US006) — see docs/STYLING.md.
// Colour values live in globals.css theme tokens; a hex in a component means the
// token got bypassed. The same regex catches the arbitrary-value form
// (`text-[#0A3654]`) because the hex sits inside the class string.
// It only catches `#`-prefixed colours — `rgb(0,187,0)` slips past and stays a
// review-time catch.
const noColourLiterals = [
  {
    selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
    message:
      'No colour literals — use a theme token from globals.css (docs/STYLING.md).',
  },
  {
    selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]',
    message:
      'No colour literals — use a theme token from globals.css (docs/STYLING.md).',
  },
];

// Static appearance belongs in a utility class or a `cva` variant on the ui/
// primitive. Files whose `style` is genuinely computed from data are listed in
// the override further down, each with the dynamic value named.
const noInlineStyle = {
  selector: 'JSXAttribute[name.name="style"]',
  message:
    'No inline style — use utility classes or a variant on the ui/ primitive. ' +
    'Genuinely dynamic values are allowlisted per-file in eslint.config.mjs.',
};

export default tseslint.config(
  {
    ignores: [
      '.next',
      'tailwind.config.ts',
      'src/components/ui/chart.tsx', // This file is generated and have too many lint issues to fix manually
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // This codebase deliberately uses `||` for string fallbacks so that an
      // empty string falls through to the default, e.g.
      // `searchParams.get('language') || 'en'` or
      // `question.description || question.mainQuestion`. Rewriting those to `??`
      // would preserve '' and change behaviour, so string operands are exempt.
      // Nullish-coalescing is still enforced for every other operand type.
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true } },
      ],
      'no-restricted-syntax': ['error', ...noColourLiterals, noInlineStyle],
    },
  },
  {
    // recharts props and the canvas 2D context cannot consume CSS custom
    // properties, so this module is the one place resolved colour strings are
    // allowed to live. Every constant in it names the token it mirrors.
    files: ['src/lib/chart-colors.ts'],
    rules: {
      'no-restricted-syntax': ['error', noInlineStyle],
    },
  },
  {
    // Inline-`style` allowlist. Re-declares the rule without `noInlineStyle`,
    // so colour literals stay banned in these files too. Adding a file here is
    // the deliberate, visible act of asking for an exception.
    files: [
      'src/components/ui/progress.tsx', // transform: indicator offset from `value`
      'src/components/ui/sidebar.tsx', // --sidebar-width / --sidebar-width-icon / --skeleton-width: CSS custom properties, which a utility class cannot set
      'src/components/questionnaire/progress-bar.tsx', // width: completion percentage
      'src/components/questionnaire/signature-pad.tsx', // height: `height` prop, shared with the canvas backing store
      'src/components/charts/aggregated-score-chart.tsx', // width: each risk band's share of the total
      'src/components/charts/score-trends-chart.tsx', // backgroundColor: legend swatch from getRiskChartColor; style: recharts LabelList takes an object, not a className
      'src/components/suppliers/suppliers-table.tsx', // width: supplier.evaluationProgress
      'src/components/supplier-evaluation-report/ser-sidebar.tsx', // height: calc() against the fixed navbar/header heights
      'src/components/supplier-evaluation-report/environmental/ghg-emissions-assurance.tsx', // backgroundColor: scope colour prop
      'src/components/supplier-evaluation-report/social/child-labour-prevention.tsx', // filter/transform: hovered pie slice; backgroundColor: selected category colour
    ],
    rules: {
      'no-restricted-syntax': ['error', ...noColourLiterals],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
