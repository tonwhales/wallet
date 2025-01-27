const { mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
const {
  resolver: { sourceExts, assetExts }
} = defaultConfig;


/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve(
      "react-native-svg-transformer/react-native"
    )
  },

  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    extraNodeModules: {
      stream: require.resolve('stream-browserify'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);