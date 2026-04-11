const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const mobileModules = path.resolve(projectRoot, 'node_modules');
const rootModules = path.resolve(monorepoRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Only watch the root node_modules (for hoisted deps) — NOT the entire monorepo
config.watchFolders = [rootModules];

// Resolve from mobile first, then root
config.resolver.nodeModulesPaths = [mobileModules, rootModules];

// Force react to ALWAYS resolve from mobile's node_modules (React 19).
// react-native@0.81.5 is hoisted to root alongside react@18 — without this,
// Metro's default resolver will pick the sibling react@18 and crash at runtime.
const mobileReact = path.resolve(mobileModules, 'react');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect all react imports to mobile's React 19
  if (moduleName === 'react') {
    return { type: 'sourceFile', filePath: path.resolve(mobileReact, 'index.js') };
  }
  if (moduleName.startsWith('react/')) {
    const subpath = moduleName.slice('react/'.length);
    // Resolve the subpath from mobile's react package
    const resolved = require.resolve('react/' + subpath, { paths: [mobileModules] });
    return { type: 'sourceFile', filePath: resolved };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
