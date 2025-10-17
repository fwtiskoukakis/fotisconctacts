# App Store Deployment Checklist

## Pre-Deployment Checklist

### ✅ App Configuration
- [x] EAS configuration created (`eas.json`)
- [x] Project ID set (`fotisconctacts-2024`)
- [x] Bundle identifiers configured
- [x] App icons ready
- [x] Permissions configured

### 📱 App Store Assets Needed

#### **App Icons**
- [x] iOS: 1024x1024 (App Store)
- [x] Android: 512x512 (Play Store)
- [x] Adaptive icon configured

#### **Screenshots** (Required)
- [ ] iPhone screenshots (6.7", 6.5", 5.5")
- [ ] iPad screenshots (12.9", 11")
- [ ] Android screenshots (various sizes)

#### **App Information**
- [x] App name: "Ενοικιάσεις Πειραιάς"
- [x] Description: Created (`APP_STORE_DESCRIPTION.md`)
- [x] Privacy Policy: Created (`PRIVACY_POLICY.md`)
- [ ] Keywords: rental, contracts, vehicle, management
- [ ] Category: Business/Productivity

### 🔧 Technical Requirements

#### **iOS App Store**
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect access
- [ ] TestFlight testing
- [ ] App review submission

#### **Google Play Store**
- [ ] Google Play Console account ($25)
- [ ] Play Console access
- [ ] Internal testing
- [ ] Production release

### 📋 Submission Process

#### **Step 1: Build**
```bash
# Install EAS CLI (after freeing disk space)
npm install -g @expo/cli@latest

# Login to Expo
npx expo login

# Build for production
npx eas build --platform all --profile production
```

#### **Step 2: Submit**
```bash
# Submit to Google Play Store
npx eas submit --platform android

# Submit to Apple App Store
npx eas submit --platform ios
```

### 🎯 Next Steps

1. **Free up disk space** (5GB minimum)
2. **Create developer accounts**:
   - Apple Developer Program
   - Google Play Console
3. **Take screenshots** of your app
4. **Run production build**
5. **Submit to stores**

### 📞 Support

If you need help with any step, refer to:
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Google Play Store Guidelines](https://support.google.com/googleplay/android-developer/)

---

**Status**: Ready for deployment once disk space is available
**Estimated Time**: 2-3 hours (including review time)
**Cost**: $124 ($99 Apple + $25 Google)
