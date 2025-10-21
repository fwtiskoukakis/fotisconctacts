// React Component Example for FleetOS Animated Logo
import React from 'react';

// Import your preferred animation
import HeroAnimation from './hero-animation.svg';
import PulseGlow from './pulse-glow.svg';
import RotateContinuous from './rotate-continuous.svg';
import ArrowSlide from './arrow-slide.svg';
import LoadingSpinner from './loading-spinner.svg';
import FloatBounce from './float-bounce.svg';

interface FleetOSLogoProps {
  variant?: 'hero' | 'pulse' | 'rotate' | 'arrow' | 'loading' | 'float';
  size?: number;
  className?: string;
}

export const FleetOSLogo: React.FC<FleetOSLogoProps> = ({
  variant = 'hero',
  size = 100,
  className = '',
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
    <img
      src={SelectedLogo}
      alt="FleetOS Logo"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
      }}
    />
  );
};

// Usage examples:
// <FleetOSLogo variant="hero" size={150} />
// <FleetOSLogo variant="loading" size={50} />
// <FleetOSLogo variant="pulse" size={80} className="my-custom-class" />

export default FleetOSLogo;

