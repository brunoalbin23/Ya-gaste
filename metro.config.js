// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
