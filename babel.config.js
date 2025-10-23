module.exports = function (api) {
  const babelEnv = api.env();
  api.cache(true);

  const plugins = [
    ["@babel/plugin-transform-flow-strip-types", { "loose": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    ["@babel/plugin-proposal-private-methods", { "loose": true }],
    [
      'module-resolver',
      {
        alias: {
          '@assets': './assets',
          'crypto': 'react-native-quick-crypto',
          'buffer': '@craftzdog/react-native-buffer'
        },
      },
    ],
    'react-native-worklets/plugin',
  ];

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console']);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins
  };
};
