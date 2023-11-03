module.exports = function (api) {
  const babelEnv = api.env();
  api.cache(true);

  const plugins = [
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes'],
      },
    ],
    [
      'module-resolver',
      {
        alias: {
          '@assets': './assets',
        },
      },
    ],
    ["@babel/plugin-proposal-private-methods", {
      "loose": true
    }]
  ];

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console']);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins
  };
};
