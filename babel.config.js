module.exports = function (api) {
  const babelEnv = api.env();
  api.cache(true);

  const plugins = [
    ["@babel/plugin-proposal-private-methods", {
      "loose": true
    }],
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes'],
      },
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
