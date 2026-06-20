# 📲 Windows Guide: Publishing SocialChat on the Google Play Store & Apple App Store

This guide details the exact steps a developer working on a **Windows** computer must follow to compile, package, and upload **SocialChat** to the Google Play Store (Android) and Apple App Store (iOS). 

Since Android development is fully supported on Windows, and iOS compilation strictly requires macOS, this guide provides native Windows procedures for Android and modern cloud-based workarounds to compile and submit iOS builds directly from your Windows machine.

---

## 🛠️ Phase 1: Local Development Setup on Windows

Before building for mobile, set up your Windows workspace to compile and bundle the React web app.

### 1. Install Node.js & NPM
- Download and install the Recommended/LTS version of [Node.js for Windows](https://nodejs.org/).
- Verify the installation by opening **PowerShell** or **Command Prompt** and running:
  ```powershell
  node -v
  npm -v
  ```

### 2. Export & Extract Your Code
- In AI Studio, open the settings menu and click **Export as ZIP**.
- Extract the ZIP archive into a dedicated workspace folder on your drive (e.g., `C:\Workspaces\SocialChat`).

### 3. Install Capacitor Packages
Navigate into your project folder in PowerShell and run:
```powershell
# Install dependencies
npm install

# Build static React production bundle
npm run build

# Install Capacitor core & CLI
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor configuration
# Replce the App ID with your preferred identifier, and app name with SocialChat
npx cap init "SocialChat" "com.gnitya2507.socialchat" --web-dir=dist
```

---

## 🤖 Phase 2: Android Setup & Play Store Publishing (Fully on Windows)

You can write, build, sign, and compile Android App Bundles (`.aab`) directly on Windows.

### Step 1: Install Android Development Tools
1. **Install Java (JDK 17)**: 
   - Download the Windows x64 Installer for JDK 17 (recommended for Android Gradle builds) from [Oracle JDK Downloads](https://www.oracle.com/java/technologies/downloads/) or installation packages like Microsoft Build of OpenJDK.
2. **Install Android Studio**:
   - Download and run the [Android Studio for Windows Installer](https://developer.android.com/studio).
   - During the setup wizard, select **Standard Installation** and accept all SDK licenses.

### Step 2: Configure System Environment Variables
For Capacitor and Android command utilities to connect properly, configure Windows variables:
1. Open the Windows Search bar, search for **"Edit the system environment variables"**, and click it.
2. Click **Environment Variables...** at the bottom.
3. Under **User variables** (or System variables), click **New...**:
   - **Variable name**: `ANDROID_HOME`
   - **Variable value**: `C:\Users\<YOUR_WINDOWS_USERNAME>\AppData\Local\Android\Sdk` *(Replace `<YOUR_WINDOWS_USERNAME>` with your actual account name)*
4. Under **User variables**, select the variable named `Path` (or create one if missing) and click **Edit...**. Click **New** and add:
   - `%ANDROID_HOME%\platform-tools`
5. Click **OK** to save and apply. Close and restart your open PowerShell terminal so the new paths load.

### Step 3: Add and Sync the Android Platform
Run the following commands in your project's root folder:
```powershell
# Install Capacitor Android package
npm install @capacitor/android

# Append native Android project files
npx cap add android

# Build the frontend and sync files to Android project workspace
npm run build
npx cap sync
```

### Step 4: Run & Test on Real Android Device
1. On your Android physical phone, go to **Settings > About Phone** and tap **Build Number** 7 times to unlock Developer Options.
2. Go to **Settings > Developer Options** and enable **USB Debugging**.
3. Plug your phone into your Windows PC via a USB cable.
4. Open the Android project in Android Studio by running:
   ```powershell
   npx cap open android
   ```
5. Android Studio will open automatically. Let it finish indexing and installing Gradle scripts.
6. Click the target device selection dropdown in the top toolbar. Your physical phone should be listed. Select it.
7. Click the green **Run (Play button)** icon to compile and launch the app directly onto your phone screen!

### Step 5: Create a Signed Release Bundle for Google Play Store
Google Play requires publishing Android apps in the **Android App Bundle (.aab)** format.
1. In Android Studio, click **Build > Generate Signed Bundle / APK...** from the top menu.
2. Select **Android App Bundle** and click **Next**.
3. Under **Key store path**, click **Create new...** to create a custom security certificate:
   - Provide a path lock to save the key file securely (e.g. `C:\Keys\socialchat.jks`).
   - Fill out alias name, password, and your organization's descriptive details.
   - **CRITICAL**: Store this certificate file and passwords safely! If lost, you will not be able to publish future updates to your app.
4. Click **Next**, choose **release** as the destination build variant, and click **Create / Finish**.
5. Once compilation finishes, navigate to the indicated folder to locate your production bundle:
   `android\app\release\app-release.aab`

### Step 6: Submit to Google Play Console
1. Go to your [Google Play Console](https://play.google.com/console/) on your Windows browser.
2. Click **Create app** and complete the initial metadata forms (App Name, category, privacy settings).
3. Under the sidebar, select **Production** or **Internal testing**, create a fresh release, and drag and drop your `app-release.aab` file.
4. Setup policies, privacy questionnaire sheets, and complete content ratings. Click **Roll out Release**!

---

## 🍎 Phase 3: iOS Setup & App Store Submission (From a Windows Machine)

Apple requires compilation of modern iOS applications using **Xcode**, which strictly runs on macOS. However, Windows developers can successfully compile and publish hybrid Capacitor apps using three popular, modern approaches:

---

### Option A: Cloud Builds with Ionic Appflow (Easiest & Most Direct)
**Ionic Appflow** is the official continuous integration/continuous deployment (CI/CD) platform built by the makers of Capacitor specifically to compile iOS IPA files in the cloud from your web project.

1. **Upload your code to GitHub**:
   - Create a private repository on [GitHub](https://github.com/) and push your SocialChat source code.
2. **Sign up for Appflow**:
   - Create an account on the [Ionic Appflow Platform](https://ionic.io/appflow).
3. **Link Repository**:
   - Connect your GitHub account to Appflow and import the SocialChat repository.
4. **Acquire Apple Certificates**:
   - Log into your [Apple Developer Account](https://developer.apple.com/) on your browser.
   - Go to **Certificates, Identifiers & Profiles** and generate:
     - An **iOS Distribution Certificate** (`.p12` file)
     - An **iOS Provisioning Profile** tied to your app ID (`com.gnitya2507.socialchat`).
5. **Configure Credentials in Appflow**:
   - Upload the `.p12` certificate bundle and your Provisioning Profile with their passwords into Ionic Appflow's secure build credential manager.
6. **Trigger Cloud Build**:
   - Click **Builds > New Build** in Appflow.
   - Select **iOS** as the target platform, choose **App Store** as the build intent, select the latest capacitor version, and select your uploaded signing credential locks.
   - Appflow runs a security-hardened Mac container to build the `.ipa` bundle.
7. **Deploy to TestFlight / App Store**:
   - You can connect your App Store Connect API keys to Appflow to automatically dispatch compiled builds straight to Apple's TestFlight app for immediate verification.

---

### Option B: Cloud Builds via Codemagic (Highly Customizable, Great Free Tier)
**Codemagic** is a popular DevOps CI/CD provider that supports Capacitor/React workspaces and offers a generous free build tier.

1. Publish your code to GitHub, GitLab, or Bitbucket.
2. Sign up at [Codemagic.io](https://codemagic.io/) using your Git account.
3. Add your repository as an active app.
4. Go to **Design Workflow** and set:
   - **Environment**: macOS (running on Codemagic's server farms).
   - **Platform**: iOS.
   - **Build triggers**: Automatic builds on commit or manual build triggers.
5. Under the **Build** configuration dropdown, add your compilation scripts:
   ```bash
   npm install
   npm run build
   npx cap sync ios
   ```
6. Under **iOS Code Signing**, select **Automatic code signing** (you supply your App Store Connect API key) or **Manual** (uploading `.p12` and provisioning profiles generated on Windows using online OpenSSL keys).
7. Start the build. Codemagic will output a secure download link for your compiled `.ipa` file or deliver it straight to Apple App Store Connect.

---

### Option C: Rent a Virtual macOS Desktop (MacInCloud or MacStadium)
If you want to physically use macOS and Xcode but do not have a physical Apple computer, you can rent a cloud-based macOS computer and control it from Windows.

1. Sign up for a subscription at a macOS virtualization host like [MacInCloud](https://www.macincloud.com/) or [MacStadium](https://www.macstadium.com/).
2. On your Windows machine, open **Remote Desktop Connection** (pre-installed utility on Windows).
3. Type the custom IP address and port credentials provided by the host service and click **Connect**.
4. You will see a full, high-speed macOS desktop on your Windows monitor!
5. On the host virtual Mac:
   - Install **Node.js** and **Git**.
   - Open the App Store and download the latest version of **Xcode**.
   - Clone your GitHub repository.
   - Run the standard build commands:
     ```bash
     npm install
     npm run build
     npx cap add ios
     npx cap sync ios
     npx cap open ios
     ```
   - Build, run, archive, and upload your iOS target using Xcode's native publishing pipeline inside the remote screen.

---

### Option D: GitHub Actions Workflow (Automated CI/CD)
You can configure a GitHub continuous delivery script that compiles your iOS app on GitHub's dedicated macOS virtual servers for free (with monthly limits).

Create a file named `.github/workflows/ios-deploy.yml` inside your project root directory on Windows:

```yaml
name: Compile iOS App
on:
  push:
    branches: [ main ]

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-size: '18'

      - name: Install Packages & Compile Web Assets
        run: |
          npm install
          npm run build

      - name: Build Capacitor iOS App
        run: |
          npm install @capacitor/ios
          npx cap add ios
          npx cap sync ios
```

Once pushed, GitHub Actions will trigger automatically, build your files, and report errors or compile the target workspace structure cleanly!

---

## 🛡️ Critical Configuration: Capacitor API Proxying
Because your mobile app runs inside a native web sandbox on the physical phone, internal local file reading commands like `users-db.json` will not run locally on the device itself. Mobile apps expect a backend server API to call.

Once you deploy your Node.js full-stack container to Cloud Run (the service is configured and ready at port `3000`), modify `capacitor.config.json` on Windows top level:

```json
{
  "appId": "com.gnitya2507.socialchat",
  "appName": "SocialChat",
  "webDir": "dist",
  "server": {
    "url": "https://<YOUR_PROD_CLOUD_RUN_URL_HERE>",
    "cleartext": true
  }
}
```
*Tip: Change `<YOUR_PROD_CLOUD_RUN_URL_HERE>` to your active live Production Server URL so that mobile users can register, verify codes, retrieve recovering key sessions, and input journals seamlessly across the globe!*
