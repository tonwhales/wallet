const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const {
  resolver: { sourceExts, assetExts }
} = defaultConfig;


/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  ...defaultConfig,
  transformer: {
    // Preserve defaults (e.g., assetRegistryPath) and only override transformer path
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native'),
  },

  resolver: {
    ...defaultConfig.resolver,
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    extraNodeModules: {
      stream: require.resolve('stream-browserify'),
    },
  },
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config;