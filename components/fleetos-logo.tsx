import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode, Rect, Text, G } from 'react-native-svg';

interface FleetOSLogoProps {
  variant?: 'horizontal-light' | 'horizontal-dark' | 'icon';
  size?: number;
  style?: ViewStyle;
  showText?: boolean;
  color?: string; // Override gradient colors with solid color
}

export const FleetOSLogo: React.FC<FleetOSLogoProps> = ({
  variant = 'horizontal-light',
  size = 200,
  style,
  showText = true,
  color,
}) => {
  const isHorizontal = variant.includes('horizontal');
  const isDark = variant.includes('dark');
  const isIcon = variant === 'icon';
  
  // Calculate dimensions based on variant
  const width = isHorizontal ? size : size;
  const height = isHorizontal ? size * 0.24 : size; // Maintain aspect ratio for horizontal
  
  // Colors based on variant
  const backgroundColor = isDark ? '#0f172a' : 'transparent';
  const textColor = isDark ? '#ffffff' : '#0B132B';
  const gradientColors = ['#06B6D4', '#22D3EE'];
  
  // Use solid color if provided, otherwise use gradient
  const fillColor = color || 'url(#gLight)';
  
  const IconComponent = () => (
    <Svg width={width} height={height} viewBox={isHorizontal ? "0 0 200 48" : "0 0 48 48"}>
      <Defs>
        <LinearGradient id="gLight" x1="0%" y1="0%" x2="100%" y2={isHorizontal ? "0%" : "100%"}>
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="100%" stopColor={gradientColors[1]} />
        </LinearGradient>
        <Filter id="glow">
          <FeGaussianBlur stdDeviation={isHorizontal ? "3" : "2"} result="coloredBlur" />
          <FeMerge>
            <FeMergeNode in="coloredBlur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      
      
      <G filter="url(#glow)">
        {/* Main circular arrow path */}
        <Path
          fill={fillColor}
          d={isHorizontal 
            ? "M4,24 C4,17.37 9.37,12 16,12 L20,12 L20,16 L16,16 C11.58,16 8,19.58 8,24 C8,28.42 11.58,32 16,32 L20,32 L20,36 L16,36 C9.37,36 4,30.63 4,24 Z"
            : "M8,24 C8,17.37 13.37,12 20,12 L25,12 L25,16 L20,16 C15.58,16 12,19.58 12,24 C12,28.42 15.58,32 20,32 L25,32 L25,36 L20,36 C13.37,36 8,30.63 8,24 Z"
          }
        />
        
        {/* Arrow head */}
        <Path
          fill={fillColor}
          d={isHorizontal 
            ? "M16,20 L32,24 L16,28 Z"
            : "M18,20 L36,24 L18,28 Z"
          }
        />
      </G>
      
      {/* Text for horizontal variants */}
      {isHorizontal && showText && (
        <Text
          x="48"
          y="32"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill={textColor}
          letterSpacing="-0.5"
        >
          FleetOS
        </Text>
      )}
    </Svg>
  );

  return (
    <View style={[styles.container, { width, height }, style]}>
      <IconComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Convenience components for common use cases
export const FleetOSHeaderLogo: React.FC<Omit<FleetOSLogoProps, 'variant'>> = (props) => {
  return <FleetOSLogo variant="horizontal-light" {...props} />;
};

export const FleetOSDarkLogo: React.FC<Omit<FleetOSLogoProps, 'variant'>> = (props) => (
  <FleetOSLogo variant="horizontal-dark" {...props} />
);

export const FleetOSIcon: React.FC<Omit<FleetOSLogoProps, 'variant'>> = (props) => (
  <FleetOSLogo variant="icon" showText={false} {...props} />
);

export default FleetOSLogo;
