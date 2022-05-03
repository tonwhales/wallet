module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-reanimated/plugin',
        {
          globals: ['__scanCodes'],
        },
      ],
      ["@babel/plugin-proposal-private-methods", {
        "loose": true
      }]
    ]
  };
};
