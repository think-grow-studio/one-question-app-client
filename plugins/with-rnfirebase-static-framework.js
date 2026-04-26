const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RNFIREBASE_STATIC_FRAMEWORK_LINE = '$RNFirebaseAsStaticFramework = true';

const withRNFirebaseStaticFramework = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      podfile = podfile.replace(/\nuse_modular_headers!\n/g, '\n');

      if (!podfile.includes(RNFIREBASE_STATIC_FRAMEWORK_LINE)) {
        podfile = podfile.replace(
          "  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']",
          `  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']\n\n  ${RNFIREBASE_STATIC_FRAMEWORK_LINE}`
        );
      }

      fs.writeFileSync(podfilePath, podfile);

      return config;
    },
  ]);
};

module.exports = withRNFirebaseStaticFramework;
