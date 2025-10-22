# Android Preview Build Guide

## 🚀 Quick Start

Your app is ready to build! Follow these steps to create an Android preview build.

---

## Prerequisites

1. **EAS CLI installed**
   ```bash
   npm install -g eas-cli
   ```

2. **Logged into Expo**
   ```bash
   eas login
   ```

3. **Project configured** ✅ (Already done!)
   - EAS Project ID: `7bea0453-324a-4cb4-894c-48f86d8f37cc`
   - Package: `com.fleetos.app`
   - Version: `1.0.0`

---

## Build Commands

### Option 1: Standard Preview Build (Recommended)
```bash
eas build --platform android --profile preview
```

This creates an APK file that you can install directly on Android devices for testing.

### Option 2: Non-Interactive (for CI/CD)
```bash
eas build --platform android --profile preview --non-interactive
```

### Option 3: Local Build (if you have Android Studio)
```bash
eas build --platform android --profile preview --local
```

---

## What Happens During Build

1. **Upload Code**: Your code is uploaded to EAS servers
2. **Install Dependencies**: npm packages installed
3. **Prebuild**: Native Android project generated
4. **Compile**: Android APK compiled
5. **Sign**: APK signed with your credentials
6. **Upload**: APK uploaded to Expo servers
7. **Download Link**: You get a download URL

**Estimated Time:** 10-15 minutes

---

## After Build Completes

### 1. Download the APK
You'll get a download URL like:
```
https://expo.dev/artifacts/eas/...
```

### 2. Install on Android Device

**Method A: Direct Install**
- Open the link on your Android device
- Download the APK
- Tap to install
- Allow "Install from unknown sources" if prompted

**Method B: ADB Install**
```bash
# Download APK first
adb install path/to/your-app.apk
```

**Method C: Share via QR Code**
- Expo generates a QR code
- Scan with Android device
- Download and install

---

## Build Profiles Explained

### Preview Profile (Current)
```json
{
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- **Format**: APK (easy to install)
- **Purpose**: Internal testing
- **Distribution**: Direct install
- **Size**: ~50-100 MB

### Production Profile
```json
{
  "android": {
    "buildType": "apk"
  }
}
```
- **Format**: APK or AAB
- **Purpose**: Production release
- **Distribution**: Google Play or direct

---

## Common Issues & Solutions

### Issue 1: "No credentials found"
**Solution:**
```bash
eas credentials
# Follow prompts to configure Android keystore
```

### Issue 2: "Build failed - insufficient memory"
**Solution:** EAS automatically retries with more resources

### Issue 3: "SVG icon not supported"
**Problem:** Your icon is SVG, Android needs PNG

**Solution:** Convert icon or update app.json:
```bash
# Option 1: Use existing PNG (recommended for quick build)
# Update app.json:
"icon": "./assets/icon.png",  # if you have a PNG
"splash": {
  "image": "./assets/splash-icon.png"
}

# Option 2: Let EAS handle it (may have issues)
# Keep as is, EAS will try to convert
```

### Issue 4: "Package name already in use"
**Solution:** Change package name in app.json:
```json
"android": {
  "package": "com.yourcompany.fleetos"
}
```

---

## Monitoring Build Progress

### Via CLI:
```bash
eas build:list
```

### Via Web:
```
https://expo.dev/accounts/[your-account]/projects/fleetos/builds
```

### Via Dashboard:
1. Go to https://expo.dev
2. Select your project
3. Click "Builds"
4. See live progress

---

## Build Commands Cheat Sheet

```bash
# Start a preview build
eas build -p android --profile preview

# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Cancel a build
eas build:cancel

# Configure credentials
eas credentials

# View project info
eas project:info

# Submit to Play Store (after production build)
eas submit -p android
```

---

## Testing Your Build

### Checklist:
- [ ] App launches successfully
- [ ] Can login/signup
- [ ] Can add vehicles
- [ ] Can create contracts
- [ ] License plate auto-complete works
- [ ] Photos can be captured
- [ ] Dark mode is disabled (light theme only)
- [ ] All features work as expected

---

## Version Management

Current version: **1.0.0**

To update version:
```json
// app.json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

Then rebuild:
```bash
eas build -p android --profile preview
```

---

## Distribution Options

### Option 1: Internal Testing (Current)
- Build APK with preview profile
- Share download link
- Direct install on devices

### Option 2: Google Play Internal Testing
```bash
# Build AAB for Play Store
eas build -p android --profile production

# Submit to internal testing
eas submit -p android --latest
```

### Option 3: Firebase App Distribution
```bash
# Install Firebase CLI
npm install -g firebase-tools

# After build, upload to Firebase
firebase appdistribution:distribute your-app.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers
```

---

## Optimization Tips

### Reduce Build Time:
1. Use `--non-interactive` flag
2. Cache dependencies (automatic)
3. Use local builds for quick iteration

### Reduce APK Size:
1. Enable Hermes engine (already enabled)
2. Remove unused dependencies
3. Optimize images
4. Use AAB format for Play Store

### Better Testing:
1. Use EAS Update for OTA updates
2. Set up internal testing track
3. Use TestFlight equivalent for Android
4. Implement crash reporting (Sentry)

---

## Next Steps After Preview Build

### 1. Test Thoroughly
- Install on multiple devices
- Test all features
- Collect feedback

### 2. Prepare for Production
```bash
# Update version
# Update app.json version to 1.0.0

# Build production
eas build -p android --profile production

# Submit to Play Store
eas submit -p android
```

### 3. Set Up OTA Updates
```bash
# Configure updates
eas update:configure

# Push update
eas update --branch production --message "Bug fixes"
```

---

## Environment Variables

If you need to add environment variables:

```bash
# Add to eas.json
{
  "build": {
    "preview": {
      "env": {
        "SUPABASE_URL": "your-url",
        "SUPABASE_ANON_KEY": "your-key"
      }
    }
  }
}
```

Or use `.env` files with `expo-env`:
```bash
npm install expo-env
```

---

## Support & Resources

### Documentation:
- EAS Build: https://docs.expo.dev/build/introduction/
- Android Specific: https://docs.expo.dev/build-reference/android-builds/

### Common Commands:
```bash
# Help
eas build --help

# Check account
eas whoami

# View projects
eas project:list

# Configure project
eas build:configure
```

---

## Quick Start Summary

**To build right now:**

```bash
# 1. Login (if not already)
eas login

# 2. Build preview
eas build --platform android --profile preview

# 3. Wait ~10-15 minutes

# 4. Get download link

# 5. Install on Android device

# 6. Test!
```

---

## Icon/Splash Recommendation

For a smoother build, consider using PNG icons:

1. **Create PNG versions** (or use existing):
   - Icon: 1024x1024px PNG
   - Splash: 1284x2778px PNG (for various screens)

2. **Update app.json**:
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#0f172a"
    }
  }
}
```

Or keep SVG and let EAS handle conversion (may have issues).

---

## 🎉 You're Ready!

Run this command to start your build:

```bash
eas build --platform android --profile preview
```

Good luck! 🚀

