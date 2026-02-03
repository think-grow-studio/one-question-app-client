const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

const DEFAULT_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const DEFAULT_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

function ensureMetaDataItem(application, name, value) {
  if (!application || !Array.isArray(application['meta-data'])) {
    application['meta-data'] = [];
  }

  const existing = application['meta-data'].find((item) => item.$['android:name'] === name);
  if (existing) {
    existing.$['android:value'] = value;
    existing.$['tools:replace'] = 'android:value';
  } else {
    application['meta-data'].push({
      $: {
        'android:name': name,
        'android:value': value,
        'tools:replace': 'android:value',
      },
    });
  }
}

const withCustomGoogleMobileAds = (config, props = {}) => {
  const androidAppId = props.androidAppId || process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || DEFAULT_ANDROID_APP_ID;
  const iosAppId = props.iosAppId || process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || DEFAULT_IOS_APP_ID;

  config = withInfoPlist(config, (config) => {
    config.modResults.GADApplicationIdentifier = iosAppId;
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const application = manifest.manifest.application?.[0];
    if (application) {
      ensureMetaDataItem(application, 'com.google.android.gms.ads.APPLICATION_ID', androidAppId);
    }
    return config;
  });

  return config;
};

module.exports = withCustomGoogleMobileAds;
