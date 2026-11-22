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

---

## 🚀 Installation & Deployment

### Method 1: Upload via WordPress Admin (Recommended)
1. Generate the zip file using the build script:
   ```bash
   node scripts/package_plugin.js
   ```
2. In WordPress Admin, navigate to:
   **Plugins ➔ Add New ➔ Upload Plugin**
3. Select `backend-plugin/thriving-skills-mobile-bridge.zip` and click **Install Now**.
4. Click **Activate Plugin**.

### Method 2: Manual Upload via FTP / cPanel
1. Upload the folder `backend-plugin/thriving-skills-mobile-bridge` into your server directory:
   ```
   wp-content/plugins/thriving-skills-mobile-bridge
   ```
2. Navigate to WordPress Admin ➔ **Plugins** and activate **Thriving Skills Mobile Bridge**.

---

## 📡 Registered REST Endpoints

All endpoints are prefixed under `/wp-json/thrivingskill/v1/`:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/config` | `GET` | Returns app version gates, maintenance mode, and announcement banner data. |
| `/feed` | `GET` | Returns lean, cached courses feed optimized for mobile list rendering. |
| `/lessons/{id}` | `GET` | Returns cleaned lesson metadata and parsed video streaming properties. |
| `/register-push-token` | `POST` | Registers or updates a learner's device Expo push token. |

---

## 🛠️ Maintenance & Safety Principles

1. **Zero Database Alterations**: Uses WordPress standard options and transient caching (`get_transient` / `set_transient`). Does not create or modify custom database tables.
2. **Graceful Deactivation**: If this plugin is deactivated, the mobile app automatically falls back to standard LearnPress `/wp-json/learnpress/v1/...` routes with zero downtime.
3. **Non-blocking Operations**: Push notifications to Expo are executed via non-blocking asynchronous requests (`blocking => false`), guaranteeing that saving courses in WP Admin is never delayed.
