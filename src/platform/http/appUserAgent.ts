import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { config } from '@/constants/config';

// 서버 로그(nginx UA, 백엔드 MDC)에서 기기/버전을 식별할 수 있도록
// OkHttp/NSURLSession 기본 UA 대신 앱이 직접 채운 값을 보낸다.
// 값은 기기 세션 동안 고정이므로 모듈 로드 시 1회만 계산한다.
export const APP_USER_AGENT = `one-question/${config.appVersion} (${Platform.OS} ${Device.osVersion ?? 'unknown'}; ${Device.modelName ?? 'unknown'})`;
