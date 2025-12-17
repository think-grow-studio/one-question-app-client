module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/app': './src/app',
            '@/features': './src/features',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/shared': './src/shared',
            '@/hooks': './src/hooks',
            '@/types': './src/types',
            '@/constants': './src/constants',
            '@/utils': './src/utils',
            '@/assets': './src/assets',
          },
        },
      ],
      'react-native-reanimated/plugin', // ✅ MUST be last
    ],
  };
};
