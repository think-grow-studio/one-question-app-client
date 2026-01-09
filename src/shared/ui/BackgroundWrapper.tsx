import { ReactNode } from 'react';
import { StyleSheet, ImageBackground } from 'react-native';

interface BackgroundWrapperProps {
  children: ReactNode;
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  return (
    <ImageBackground
      source={require('../../../assets/crayon-yellow.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
