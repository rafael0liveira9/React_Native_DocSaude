#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments (accept --platform but ignore it since we only target iOS Podfile)
const args = process.argv.slice(2);
const platformIndex = args.indexOf('--platform');
if (platformIndex !== -1 && args[platformIndex + 1] !== 'ios') {
  console.log('⚠️  Skipping: This script only runs for iOS platform');
  process.exit(0);
}

const podfilePath = path.join(__dirname, '..', 'ios', 'Podfile');

if (!fs.existsSync(podfilePath)) {
  console.log('⚠️  Podfile not found, skipping...');
  process.exit(0);
}

let podfileContent = fs.readFileSync(podfilePath, 'utf8');

// Check if use_modular_headers! is already present
if (podfileContent.includes('use_modular_headers!')) {
  console.log('✅ use_modular_headers! already exists in Podfile');
  process.exit(0);
}

// Add use_modular_headers! after the platform line
const platformRegex = /(platform :ios, ['"][^'"]+['"])/;
if (platformRegex.test(podfileContent)) {
  podfileContent = podfileContent.replace(
    platformRegex,
    '$1\nuse_modular_headers!'
  );

  fs.writeFileSync(podfilePath, podfileContent, 'utf8');
  console.log('✅ Added use_modular_headers! to Podfile');
} else {
  // If platform line not found, add it at the beginning of the file
  podfileContent = 'use_modular_headers!\n\n' + podfileContent;
  fs.writeFileSync(podfilePath, podfileContent, 'utf8');
  console.log('✅ Added use_modular_headers! to the beginning of Podfile');
}
