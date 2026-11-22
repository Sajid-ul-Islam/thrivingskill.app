# Thriving Skills Mobile Bridge (WordPress Companion Plugin)

Official WordPress companion plugin for the **Thriving Skills** mobile application (React Native / Expo).

---

## 🎯 Purpose & Architecture

This plugin acts as the high-speed API bridge between WordPress/LearnPress and the Thriving Skills mobile app:

1. **Google Play Safe Hybrid Checkout**: Retains web-based checkout to comply 100% with Google Play In-App Purchase and digital goods guidelines.
2. **80% Lighter Course Feed**: Delivers ultra-lean course cards (`/wp-json/thrivingskill/v1/feed`) with pre-calculated BDT pricing, clean excerpts, and transient caching, dropping payload size from ~450KB to ~20KB.
3. **Direct Video Stream Parsing**: Exposes clean video types (`youtube`, `vimeo`, `mp4`) without requiring brittle client-side regex parsing of raw HTML `video_intro` iframes.
4. **Push Notifications Engine**: Bridges WordPress post publishing directly to Expo Push Notification service for instant course alerts.
5. **App Remote Config**: Control min/latest app versions, maintenance mode, and home banners directly from the WordPress Admin Dashboard.
6. **Self-Contained Single File**: Contains all controllers, endpoints, and admin pages in one standalone file (`thriving-skills-mobile-bridge.php`) with zero external file dependencies.

---

## 🚀 Installation & Deployment

### Method 1: Upload via WordPress Admin (ZIP)
1. In WordPress Admin, navigate to:
   **Plugins ➔ Add New ➔ Upload Plugin**
2. Select `backend-plugin/thriving-skills-mobile-bridge.zip` and click **Install Now**.
3. Click **Activate Plugin**.

### Method 2: Direct File Drop-In via cPanel / FTP
1. Open cPanel File Manager or FTP.
2. Navigate to: `wp-content/plugins/`
3. Upload `thriving-skills-mobile-bridge.php` directly into `wp-content/plugins/`.
4. In WP Admin ➔ **Plugins ➔ Installed Plugins**, click **Activate**.

---

## 📡 Registered REST Endpoints

All endpoints are prefixed under `/wp-json/thrivingskill/v1/`:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/config` | `GET` | Returns app version gates, maintenance mode, and announcement banner data. |
| `/feed` | `GET` | Returns lean, cached courses feed optimized for mobile list rendering. |
| `/lessons/{id}` | `GET` | Returns cleaned lesson metadata and parsed video streaming properties. |
| `/register` | `POST` | Fast in-app student registration endpoint. |
| `/register-push-token` | `POST` | Registers or updates a learner's device Expo push token. |
