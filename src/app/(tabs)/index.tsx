import { useCallback, useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';
import { QuestionHistoryView } from '@/features/question/components/QuestionHistoryView';
import { useScreenBackground } from '@/shared/theme';
import { logScreenView } from '@/services/firebase';

export default function HomeScreen() {
  const screenBg = useScreenBackground();
  const { t } = useTranslation();
  const exitDialog = useAlertDialog();
  const showExitDialog = exitDialog.show;

  // Analytics: 화면 조회
  useEffect(() => {
    logScreenView('Today');
  }, []);

  // Android 하드웨어 뒤로가기 — 홈(루트)에서는 즉시 종료 대신 확인 다이얼로그.
  // useFocusEffect: 홈 탭 포커스일 때만 가로채고, 다른 탭에선 backBehavior(initialRoute)가
  // 홈으로 보내는 기존 동작 유지. true 반환으로 기본 종료 동작 차단.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        showExitDialog({
          title: t('exitApp.title'),
          message: t('exitApp.message'),
          buttons: [
            { label: t('exitApp.cancel'), variant: 'default' },
            {
              label: t('exitApp.confirm'),
              variant: 'primary',
              onPress: () => BackHandler.exitApp(),
            },
          ],
        });
        return true;
      });
      return () => subscription.remove();
    }, [showExitDialog, t])
  );

  return (
    <Screen edges={['top']} bgColor={screenBg}>
      <QuestionHistoryView />
      <AlertDialog
        visible={exitDialog.visible}
        title={exitDialog.config.title}
        message={exitDialog.config.message}
        buttons={exitDialog.config.buttons}
        onClose={exitDialog.hide}
      />
    </Screen>
  );
}
