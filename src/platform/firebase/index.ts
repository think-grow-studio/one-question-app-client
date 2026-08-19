/**
 * Firebase Services
 *
 * Firebase Analytics 및 Crashlytics를 위한 헬퍼 함수들
 */

export { initializeFirebase } from './firebaseApp';

export {
  logScreenView,
  logEvent,
  setUserProperty,
  setUserId,
  AnalyticsEvents,
} from './analytics';

export {
  enableCrashlytics,
  setCrashlyticsUserId,
  setCrashlyticsAttribute,
  logCrashlytics,
  recordError,
  testCrash,
} from './crashlytics';

export {
  signInAnonymously,
  isFirebaseAnonymousUser,
  signOutFirebase,
  getCurrentFirebaseUser,
} from './auth';

export {
  getFCMToken,
  onFCMTokenRefresh,
  onFCMMessage,
  onFCMNotificationOpened,
  getInitialFCMNotification,
} from './messaging';
