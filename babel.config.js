module.exports = (api) => {
  const babelEnv = api.env();
  api.cache(true);

  const plugins = [
    ['@babel/plugin-transform-flow-strip-types', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes']
      }
    ],
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          '@assets': './assets',
          crypto: 'react-native-quick-crypto',
          buffer: '@craftzdog/react-native-buffer'
        }
      }
    ]
  ];

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console']);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins
  };
};
