# 📲 SocialChat Mobile Publishing Guide (App Store & Play Store)

This guide documents the step-by-step process to compile, package, and publish **SocialChat** as a native hybrid mobile application for the **Apple App Store** and **Google Play Store** using **CapacitorJS**—the recommended modern industry-standard wrapper for React Vite SPAs.

---

## 🛠️ Prerequisites
1. **Node.js** matching your active container setup.
2. **For Android**: Download and install [Android Studio](https://developer.android.com/studio) and ensure you have the Android SDK tools configured.
3. **For iOS**: Apple macOS with [Xcode](https://developer.apple.com/xcode/) installed (required to compile iOS packages).
4. Developer Accounts:
   - [Google Play Console Developer Account](https://play.google.com/console/signup) ($25 one-time registration fee).
   - [Apple Developer Program Account](https://developer.apple.com/programs/) ($99/year subscription).

---

## 🚀 Step 1: Install Capacitor Dependencies
Run the following commands in your project directory after downloading the exported ZIP of SocialChat:

```bash
# Install Capacitor core CLI and platform bridges
npm install @capacitor/core @capacitor/cli

# Initialize the Capacitor configuration
npx cap init "SocialChat" "com.gnitya2507.socialchat" --web-dir=dist
```

*Note: Ensure the `--web-dir` points to `dist`, which is the default build output directory of our React Vite compiler.*

---

## 🤖 Step 2: Add Target Mobile Platforms
You can add Android, iOS, or both depending on your testing hardware:

```bash
# Install platform packages
npm install @capacitor/android @capacitor/ios

# Create the native IDE workspace folders
npx cap add android
npx cap add ios
```

---

## 📦 Step 3: Build & Sync the Frontend SPA
Every time you make adjustments to your React code, you MUST compile your static build files first, and then synchronize them into the native container wrappers:

```bash
# 1. Run our fully bundle-optimized production build
npm run build

# 2. Sync physical static files into Android and iOS project folders
npx cap sync
```

---

## 📱 Step 4: Open and Launch Native Workspaces
Capacitor has direct utility instructions to open the native IDEs automatically:

### 1. For Google Play Store (Android)
```bash
npx cap open android
```
- This triggers **Android Studio** configured to your project instantly.
- Let Android Studio resolve Gradle dependencies.
- Select your target physical phone (via USB debugging) or virtual emulator, and click the **Run / Play** icon.
- To generate a Play Store release artifact, go to: **Build > Generate Signed Bundle / APK** and follow the prompt keys.

### 2. For Apple App Store (iOS)
```bash
npx cap open ios
```
- This launches **Xcode** automatically on macOS.
- Under **Signing & Capabilities**, select your active Apple Developer team account.
- Select an active target device and hit the Play button to build.
- To package for the App Store, select **Product > Archive** inside Xcode's menu.

---

## 🌐 Hybrid API Mirroring Configurations
Since Mobile Apps run client-side inside a `WebView`, they will default to making secure API calls to your cloud container service.

Inside `capacitor.config.json` (created in your folder root), you can configure server URL fallback coordinates for hybrid server operations:

```json
{
  "appId": "com.gnitya2507.socialchat",
  "appName": "SocialChat",
  "webDir": "dist",
  "server": {
    "url": "https://ais-pre-krud5kedhrqw22yhehgog7-896038444859.asia-east1.run.app",
    "cleartext": true
  }
}
```

*Change the `"url"` parameter above to your live production server address once you deploy to Cloud Run!*

---

## 🛡️ Store Submission Checklist

### 1. App Store Guidelines
- **Mandatory Disconnection / Reporting system**: *SocialChat already includes a pre-built Report Logging module and Quit Session confirmation overlay which complies with App Store safety mandates (User Generated Content block).*
- **Metadata**: Add dynamic app store descriptions, representative mockups, and transparent privacy policy URLs pointing to safe data collection practices on your custom domain.

### 2. Play Store Guidelines
- **SDK Target**: Ensure your compiled target SDK version is updated to the latest standard (usually handled automatically by Capacitor).
- Ensure any user databases (e.g. your `users-db.json` or subsequent Firestore integrations) use TLS/SSL security rules to protect user emails and credentials.
