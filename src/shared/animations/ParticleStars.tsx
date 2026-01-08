import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeOut,
} from 'react-native-reanimated';
import { StyleSheet, Text } from 'react-native';

interface Particle {
  id: number;
  initialX: number;
  delay: number;
}

interface ParticleStarsProps {
  isActive: boolean;
  particleCount?: number;
}

/**
 * ParticleStars Component
 * 질문이 나올 때 별들이 위에서 떨어지는 파티클 효과
 */
export function ParticleStars({
  isActive,
  particleCount = 12,
}: ParticleStarsProps) {
  // 랜덤하게 배치된 별들 생성
  const particles: Particle[] = Array.from({ length: particleCount }).map(
    (_, i) => ({
      id: i,
      initialX: Math.random() * 100, // 0~100% 좌우 위치
      delay: (i * 50) % 200, // 0~200ms 지연
    })
  );

  return (
    <>
      {particles.map((particle) => (
        <Star key={particle.id} particle={particle} isActive={isActive} />
      ))}
    </>
  );
}

interface StarProps {
  particle: Particle;
  isActive: boolean;
}

function Star({ particle, isActive }: StarProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    if (isActive) {
      // 시작: 투명도 1, 위치 0
      translateY.value = 0;
      opacity.value = 1;

      // 500ms 후: 아래로 떨어지고 투명도 0
      const timer = setTimeout(() => {
        translateY.value = withTiming(300, { duration: 800 });
        opacity.value = withTiming(0, { duration: 800 });
      }, particle.delay);

      return () => clearTimeout(timer);
    }
  }, [isActive, particle.delay, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${particle.initialX}%`,
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.starEmoji}>⭐</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    top: -50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEmoji: {
    fontSize: 24,
  },
});
