const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/**
 * Metro configuration wrapped with Sentry so JS bundles and Hermes source maps
 * include Debug IDs and uploadable source maps cleanly.
 */
const config = getSentryExpoConfig(__dirname);

module.exports = config;
