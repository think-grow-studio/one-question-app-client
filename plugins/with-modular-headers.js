const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('use_modular_headers!')) {
        podfile = podfile.replace(
          'prepare_react_native_project!',
          'prepare_react_native_project!\n\nuse_modular_headers!'
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};

module.exports = withModularHeaders;
