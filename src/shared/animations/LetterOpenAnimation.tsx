import { useRef, useEffect } from 'react';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { Paragraph } from 'tamagui';

interface LetterOpenAnimationProps {
  isPlaying: boolean;
  question?: string;
  onAnimationFinish?: () => void;
  speed?: number;
}

/**
 * LetterOpenAnimation Component
 *
 * Best Practice:
 * - 애니메이션은 별도의 컴포넌트로 분리하여 재사용성 증대
 * - Lottie JSON은 assets/animations/에 저장
 * - 상태와 콜백을 props로 제어하여 부모 컴포넌트에서 관리
 * - 애니메이션 완료 후 콜백 처리로 다음 동작 연결
 */
export function LetterOpenAnimation({
  isPlaying,
  question,
  onAnimationFinish,
  speed = 1,
}: LetterOpenAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  // 질문 텍스트 애니메이션용 공유값
  const questionScale = useSharedValue(0.8);
  const questionOpacity = useSharedValue(0);

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: questionScale.value }],
    opacity: questionOpacity.value,
  }));

  // isPlaying 상태에 따라 애니메이션 제어
  useEffect(() => {
    if (isPlaying) {
      animationRef.current?.play();

      // 질문 텍스트 애니메이션 시작 (Lottie와 동시에)
      questionScale.value = withTiming(1, { duration: 500 });
      questionOpacity.value = withTiming(1, { duration: 500 });

      // 애니메이션 완료 후 콜백 실행 (0.5초)
      const timer = setTimeout(() => {
        if (onAnimationFinish) {
          onAnimationFinish();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, onAnimationFinish, questionScale, questionOpacity]);

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('@/assets/animations/letter-open.json')}
        autoPlay={false}
        loop={false}
        speed={speed}
        style={styles.animation}
        resizeMode="contain"
      />

      {/* 질문 텍스트 (Lottie 위에 겹침) */}
      {question && (
        <Animated.View style={[styles.questionOverlay, questionAnimatedStyle]}>
          <Paragraph
            fontSize="$5"
            fontWeight="500"
            lineHeight={24}
            textAlign="center"
            px="$3"
          >
            {question}
          </Paragraph>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  questionOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    height: 160,
  },
});
