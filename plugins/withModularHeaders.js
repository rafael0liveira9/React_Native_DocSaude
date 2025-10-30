const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to add use_modular_headers! to Podfile
 */
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        console.log('⚠️  Podfile not found, skipping modular headers setup');
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Check if use_modular_headers! is already present
      if (podfileContent.includes('use_modular_headers!')) {
        console.log('✅ use_modular_headers! already exists in Podfile');
        return config;
      }

      // Add use_modular_headers! after the platform line
      const platformRegex = /(platform :ios, ['"][^'"]+['"])/;
      if (platformRegex.test(podfileContent)) {
        podfileContent = podfileContent.replace(
          platformRegex,
          '$1\n  use_modular_headers!'
        );

        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('✅ Added use_modular_headers! to Podfile');
      } else {
        // If platform line not found, add it at the beginning
        podfileContent = 'use_modular_headers!\n\n' + podfileContent;
        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('✅ Added use_modular_headers! to the beginning of Podfile');
      }

      return config;
    },
  ]);
};
