// React Native / Expo Component Example for FleetOS Animated Logo
import React from 'react';
import { View, StyleSheet } from 'react-native';

// Import SVG components (requires react-native-svg)
import HeroAnimation from './hero-animation.svg';
import PulseGlow from './pulse-glow.svg';
import RotateContinuous from './rotate-continuous.svg';
import ArrowSlide from './arrow-slide.svg';
import LoadingSpinner from './loading-spinner.svg';
import FloatBounce from './float-bounce.svg';

interface FleetOSLogoProps {
  variant?: 'hero' | 'pulse' | 'rotate' | 'arrow' | 'loading' | 'float';
  size?: number;
  style?: any;
}

export const FleetOSLogo: React.FC<FleetOSLogoProps> = ({
  variant = 'hero',
  size = 100,
  style,
}) => {
  const logos = {
    hero: HeroAnimation,
    pulse: PulseGlow,
    rotate: RotateContinuous,
    arrow: ArrowSlide,
    loading: LoadingSpinner,
    float: FloatBounce,
  };

  const SelectedLogo = logos[variant];

  return (
    <View style={[styles.container, style]}>
      <SelectedLogo width={size} height={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Usage examples:
// <FleetOSLogo variant="hero" size={150} />
// <FleetOSLogo variant="loading" size={50} />
// <FleetOSLogo variant="pulse" size={80} style={{ marginTop: 20 }} />

export default FleetOSLogo;

