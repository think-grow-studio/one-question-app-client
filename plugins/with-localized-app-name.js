const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const LOCALIZED_NAMES = {
  ko: '질문 하나',
  en: 'One Question',
  ja: 'ひとつの質問',
};

// Android locale folder naming
const ANDROID_LOCALE_MAP = {
  ko: 'values-ko',
  en: 'values',
  ja: 'values-ja',
};

const withLocalizedAppName = (config) => {
  const isPreview = process.env.APP_ENV === 'preview';

  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res'
      );

      for (const [locale, folderName] of Object.entries(ANDROID_LOCALE_MAP)) {
        const dir = path.join(resDir, folderName);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const stringsPath = path.join(dir, 'strings.xml');
        const appName = isPreview
          ? '질문 하나Preview'
          : LOCALIZED_NAMES[locale];

        if (folderName === 'values') {
          // Default strings.xml - merge with existing
          if (fs.existsSync(stringsPath)) {
            let content = fs.readFileSync(stringsPath, 'utf-8');
            if (content.includes('name="app_name"')) {
              content = content.replace(
                /<string name="app_name">.*?<\/string>/,
                `<string name="app_name">${appName}</string>`
              );
            } else {
              content = content.replace(
                '</resources>',
                `    <string name="app_name">${appName}</string>\n</resources>`
              );
            }
            fs.writeFileSync(stringsPath, content);
          } else {
            fs.writeFileSync(
              stringsPath,
              `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${appName}</string>\n</resources>\n`
            );
          }
        } else {
          // Locale-specific strings.xml
          fs.writeFileSync(
            stringsPath,
            `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${appName}</string>\n</resources>\n`
          );
        }
      }

      return config;
    },
  ]);
};

module.exports = withLocalizedAppName;
