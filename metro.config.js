const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    extraNodeModules: {
      '@mediapipe/face_detection': require.resolve('./mediapipe-stub.js'),
      '@mediapipe/face_mesh': require.resolve('./mediapipe-stub.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);