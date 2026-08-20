// @ts-check
import tseslint from 'typescript-eslint';

/**
 * README/CLAUDE.md의 "절대 규칙" 의존 방향을 자동 검증한다 (ROADMAP Phase 8).
 * 범위를 의도적으로 좁게 유지한다 — import 경계만. 스타일/일반 lint 규칙은 다루지 않는다.
 */

function getOwnFeature(filename) {
  const match = filename.match(/[\\/]src[\\/]features[\\/]([^\\/]+)[\\/]/);
  return match ? match[1] : null;
}

function getImportedFeature(source) {
  const match = source.match(/^@\/features\/([^/]+)(\/.*)?$/);
  if (!match) return null;
  return { feature: match[1], subpath: match[2] ?? '' };
}

/** @type {import('eslint').ESLint.Plugin} */
const localPlugin = {
  rules: {
    'no-cross-feature-deep-import': {
      meta: {
        type: 'problem',
        docs: {
          description:
            "다른 feature의 내부 경로 대신 그 feature의 public.ts contract만 import하도록 강제한다.",
        },
        schema: [],
        messages: {
          deepImport:
            "다른 feature('{{feature}}') 내부 경로를 직접 import할 수 없습니다 — '@/features/{{feature}}/public'만 사용하세요.",
        },
      },
      create(context) {
        const ownFeature = getOwnFeature(context.filename);
        // 이 규칙은 features/* 내부 파일에서만 적용한다 (app/shared/platform은 별도 규칙).
        if (!ownFeature) return {};

        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            if (typeof source !== 'string') return;

            const imported = getImportedFeature(source);
            if (!imported) return;
            if (imported.feature === ownFeature) return;
            if (imported.subpath === '/public') return;

            context.report({ node, messageId: 'deepImport', data: { feature: imported.feature } });
          },
        };
      },
    },
  },
};

const FORBID_FEATURES = { group: ['@/features', '@/features/**'] };
const FORBID_APP = { group: ['@/app', '@/app/**'] };
const FORBID_SHARED = { group: ['@/shared', '@/shared/**'] };

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'dist/**',
      '.expo/**',
      '.tamagui/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      local: localPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'local/no-cross-feature-deep-import': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // platform → features/app/shared 금지 (TARGET §4 platform 절대 규칙)
  {
    files: ['src/platform/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { ...FORBID_FEATURES, message: 'platform은 features를 import할 수 없습니다.' },
            { ...FORBID_APP, message: 'platform은 app을 import할 수 없습니다.' },
            { ...FORBID_SHARED, message: 'platform은 shared를 import할 수 없습니다.' },
          ],
        },
      ],
    },
  },
  // shared → features/app 금지 (TARGET §4 shared 절대 규칙)
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['src/shared/error/AppErrorBoundary.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              ...FORBID_FEATURES,
              message:
                'shared는 features를 import할 수 없습니다 (유일한 예외: AppErrorBoundary → admob).',
            },
            { ...FORBID_APP, message: 'shared는 app을 import할 수 없습니다.' },
          ],
        },
      ],
    },
  },
  // 명시된 예외: 크래시 화면 배너 노출을 위한 shared → features/admob (README/CLAUDE.md 문서화된 결정)
  {
    files: ['src/shared/error/AppErrorBoundary.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ ...FORBID_APP, message: 'shared는 app을 import할 수 없습니다.' }],
        },
      ],
    },
  },
);
