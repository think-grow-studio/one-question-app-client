module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: process.env.APP_ENV === 'production' ? '.env.production' : '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/app': './src/app',
            '@/features': './src/features',
            '@/services': './src/services',
            '@/shared': './src/shared',
            '@/constants': './src/constants',
            '@/assets': './src/assets',
          },
        },
      ],
      // Tamagui babel plugin은 테스트 환경에서 react-dom을 요구하므로 제외
      ...(isTest
        ? []
        : [
            [
              '@tamagui/babel-plugin',
              {
                components: ['tamagui'],
                config: './tamagui.config.ts',
                disableExtraction: process.env.NODE_ENV === 'development',
              },
            ],
            'react-native-reanimated/plugin', // MUST be last
          ])
    ],
  };
};
