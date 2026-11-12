const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const materialSymbolsStub = path.resolve(__dirname, 'src/stubs/material-symbols.js');

// Не включать в сборку шрифты Material Symbols, которые подтягивает expo-router → expo-symbols:
// в приложении они не используются, а весят около 19 МБ.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@expo-google-fonts/material-symbols')) {
    return { type: 'sourceFile', filePath: materialSymbolsStub };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
