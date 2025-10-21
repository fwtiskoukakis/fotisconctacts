# FleetOS Animated Logos

Animated SVG versions ready to use in your app!

## 📦 Available Animations

### 1. `hero-animation.svg` ⭐ RECOMMENDED
**Best for:** Landing pages, hero sections, splash screens
- Smooth rotation with scale effect
- Multi-layer glow animation
- 4 second loop
- Most visually impressive

### 2. `pulse-glow.svg`
**Best for:** Status indicators, live data displays
- Gentle pulsing effect
- Brightness variation
- 2 second loop
- Subtle and professional

### 3. `rotate-continuous.svg`
**Best for:** Loading states, processing indicators
- Continuous 360° rotation
- Constant speed
- 3 second loop
- Classic spinner style

### 4. `arrow-slide.svg`
**Best for:** Navigation, forward action buttons
- Arrow slides forward
- Opacity variation
- 1.5 second loop
- Clear directional cue

### 5. `loading-spinner.svg`
**Best for:** Data fetching, background tasks
- Rotation + opacity pulse
- Dual animation effect
- 2 second loop
- Perfect for loading screens

### 6. `float-bounce.svg`
**Best for:** Interactive elements, hover states
- Vertical floating motion
- Drop shadow effect
- 2 second loop
- Playful and engaging

## 💻 Usage Examples

### HTML
```html
<!-- Direct embed -->
<img src="animated/hero-animation.svg" alt="FleetOS" width="150">

<!-- Or as object for better animation support -->
<object type="image/svg+xml" data="animated/hero-animation.svg" width="150">
  FleetOS Logo
</object>
```

### React
```jsx
import HeroLogo from './animated/hero-animation.svg';

function App() {
  return (
    <div>
      <img src={HeroLogo} alt="FleetOS" width={150} />
    </div>
  );
}
```

### React Native (Expo)
```jsx
import { SvgUri } from 'react-native-svg';

// From local assets
import HeroLogo from './animated/hero-animation.svg';

function App() {
  return (
    <View>
      <HeroLogo width={150} height={150} />
    </View>
  );
}
```

### Vue
```vue
<template>
  <img src="@/assets/animated/hero-animation.svg" alt="FleetOS" width="150" />
</template>
```

### Angular
```typescript
@Component({
  selector: 'app-logo',
  template: `
    <img [src]="logoSrc" alt="FleetOS" width="150">
  `
})
export class LogoComponent {
  logoSrc = 'assets/animated/hero-animation.svg';
}
```

### Next.js
```jsx
import Image from 'next/image';
import HeroLogo from '@/public/animated/hero-animation.svg';

export default function Home() {
  return (
    <Image 
      src={HeroLogo} 
      alt="FleetOS" 
      width={150} 
      height={150}
      priority
    />
  );
}
```

## 🎨 Customization

All animations use CSS animations embedded in the SVG, so they work everywhere SVGs are supported!

### Change Animation Speed
Edit the `animation` property in the `<style>` tag:

```svg
<style>
  #logo-group { 
    /* Change 4s to your preferred duration */
    animation: hero-rotate 4s ease-in-out infinite;
  }
</style>
```

### Change Colors
Edit the gradient stops:

```svg
<linearGradient id="hero">
  <stop offset="0%" style="stop-color:#YOUR_COLOR"/>
  <stop offset="100%" style="stop-color:#YOUR_COLOR"/>
</linearGradient>
```

## 🚀 Performance Tips

1. **Use for key areas only** - Animations consume more resources
2. **Pause on scroll** - Stop animations when not visible
3. **Reduce motion** - Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
```

4. **Lazy load** - Load animated versions only when needed

## 📱 Mobile Optimization

For React Native / Expo:

```bash
# Install required package
npm install react-native-svg
# or
expo install react-native-svg
```

Then import and use:
```jsx
import HeroAnimation from './animated/hero-animation.svg';

<HeroAnimation width={100} height={100} />
```

## 🎯 Recommended Usage

| Context | Recommended Animation |
|---------|---------------------|
| App Launch Screen | `hero-animation.svg` |
| Loading Data | `loading-spinner.svg` |
| Processing Request | `rotate-continuous.svg` |
| Navigation Button | `arrow-slide.svg` |
| Status Indicator | `pulse-glow.svg` |
| Interactive Element | `float-bounce.svg` |

## ⚡ File Sizes

All animated SVG files are under 2KB each - extremely lightweight!

- `hero-animation.svg` - ~1.5KB
- `pulse-glow.svg` - ~1.3KB
- `rotate-continuous.svg` - ~1.2KB
- `arrow-slide.svg` - ~1.4KB
- `loading-spinner.svg` - ~1.5KB
- `float-bounce.svg` - ~1.4KB

## 🔧 Browser Support

✅ All modern browsers (Chrome, Firefox, Safari, Edge)
✅ Mobile browsers (iOS Safari, Chrome Mobile)
✅ React Native (with react-native-svg)
✅ Electron apps
✅ Progressive Web Apps (PWA)

---

Need help? Check the main README.md in the parent folder!

