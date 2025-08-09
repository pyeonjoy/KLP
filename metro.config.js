const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// React Native Web에서 shadow 관련 경고 억제
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 웹 플랫폼에서 shadow 관련 경고를 억제하기 위한 설정
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    // 경고 억제 옵션 추가
    keep_fnames: true,
  },
};

module.exports = config;
