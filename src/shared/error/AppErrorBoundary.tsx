import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/services/queryClient';
import { useApiErrorStore } from '@/shared/stores/useApiErrorStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { recordError } from '@/services/firebase';
import { getFontStyle } from '@/shared/theme/typography';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  recoveryAttempts: number;
  lastErrorTime: number;
}

/**
 * App-wide Error Boundary
 *
 * React 컴포넌트 렌더 에러를 잡아서 앱 크래시 방지
 * Expo Updates를 사용한 앱 재시작 기능 제공
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      recoveryAttempts: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      version: Platform.Version,
      recoveryAttempts: this.state.recoveryAttempts,
    };

    if (__DEV__) {
      console.error('AppErrorBoundary caught error:', errorData);
    } else {
      recordError(error, `ErrorBoundary:${errorInfo.componentStack?.slice(0, 200)}`);
    }
  }

  handleRestart = () => {
    const { recoveryAttempts, lastErrorTime } = this.state;
    const now = Date.now();

    // 30초 내 3회 이상 시도 시 hard restart 권장
    if (recoveryAttempts >= 3 && now - lastErrorTime < 30000) {
      Alert.alert(
        '반복된 오류',
        '앱을 완전히 종료하고 다시 실행해주세요.',
        [{ text: '확인' }]
      );
      return;
    }

    // 앱 상태 초기화
    try {
      // React Query 캐시 초기화
      queryClient.clear();

      // 에러 스토어 초기화
      useApiErrorStore.getState().hideError();

      // Error Boundary 상태 리셋
      this.setState({
        hasError: false,
        error: null,
        recoveryAttempts: recoveryAttempts + 1,
        lastErrorTime: now,
      });
    } catch (resetError) {
      console.error('Error during restart:', resetError);
    }
  };

  render() {
    if (this.state.hasError) {
      // ErrorBoundary는 TamaguiProvider 외부에 있어 useTheme() 사용 불가.
      // zustand store 직접 접근 + Appearance fallback (store hydration 전 에러 대비).
      const storeMode = useThemeStore.getState().mode;
      const mode = storeMode ?? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
      const c = mode === 'dark' ? darkColors : lightColors;

      return (
        <SafeAreaProvider>
          <View style={[styles.container, { backgroundColor: c.background }]}>
            <View style={styles.content}>
              <Text style={[styles.title, { color: c.title }]}>문제가 발생했습니다</Text>
              <Text style={[styles.message, { color: c.message }]}>
                앱을 재시작하면 문제가 해결될 수 있습니다.
              </Text>
              {__DEV__ && this.state.error && (
                <Text style={[styles.errorDetail, { color: c.detail }]}>
                  {this.state.error.toString()}
                </Text>
              )}
              <Pressable style={[styles.button, { backgroundColor: c.button }]} onPress={this.handleRestart}>
                <Text style={styles.buttonText}>앱 재시작</Text>
              </Pressable>
            </View>
            <BannerAdSlot />
          </View>
        </SafeAreaProvider>
      );
    }

    return this.props.children;
  }
}

const lightColors = {
  background: '#FFFFFF',
  title: '#000000',
  message: '#666666',
  detail: '#999999',
  button: '#007AFF',
};

const darkColors = {
  background: '#1C1C1E',
  title: '#FFFFFF',
  message: '#A0A0A0',
  detail: '#777777',
  button: '#0A84FF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    ...getFontStyle('bold'),
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetail: {
    fontSize: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...getFontStyle('600'),
  },
});
