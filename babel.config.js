module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/lib': './lib',
            '@/types': './types',
            '@/hooks': './hooks',
            '@/stores': './stores',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
