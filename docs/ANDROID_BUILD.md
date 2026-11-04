# Android Build & Compilation Guide

**Project:** MU Canteen  
**Application ID:** `com.marwadiuniversity.mucanteen`  
**Framework:** Expo SDK 58 / React Native 0.88.1 (Hermes Engine)

---

## 1. Local Android Bundle Validation

The project codebase has been validated using the Expo Android production export pipeline:

```bash
cd frontend
npx expo export --platform android
```

### Result:
- **3072 modules bundled** successfully in ~36.9 seconds.
- **Hermes Bytecode (`.hbc`)** generated: `index-3a672bfadb755a958a77dbbaf444ca38.hbc` (6.4 MB).
- **All Assets & Icons processed**: Back icons, search icons, adaptive icons, and vector glyphs verified.

---

## 2. Generating Android Standalone APK via EAS Build

To generate an installable `.apk` file for testing on physical Android devices:

### Step 2.1: Install EAS CLI Globally
```bash
npm install -g eas-cli
```

### Step 2.2: Log in to Expo Account
```bash
eas login
```

### Step 2.3: Initialize EAS Configuration (if not present)
Create `frontend/eas.json`:
```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 2.4: Trigger Standalone APK Build
```bash
cd frontend
eas build -p android --profile preview
```

Upon completion, EAS provides a direct download link and QR code to install the `.apk` directly onto any Android phone or tablet.

---

## 3. Local Development Run via Expo Go

For instant live preview on an Android device:
```bash
cd frontend
npx expo start
```
Scan the displayed QR code using the **Expo Go** application on any Android device connected to the same local network.

