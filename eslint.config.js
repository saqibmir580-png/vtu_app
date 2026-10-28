// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig.map(config => {
    if (config.rules && config.rules['react-hooks/refs']) {
      return {
        ...config,
        rules: {
          ...config.rules,
          'react-hooks/refs': 'warn',
          'react-hooks/set-state-in-effect': 'warn',
        }
      };
    }
    return config;
  }),
  {
    ignores: ["dist/*", "node_modules/*", ".expo/*"],
  }
]);
