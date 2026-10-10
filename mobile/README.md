# MOVAni Flutter Mobile & Cross-Platform Client

This directory contains the production-grade Flutter implementation for **MOVAni (Movies, Web Series, and Anime Simulcasts)**, architected with Clean Architecture principles, null-safety, and smooth integration with the MOVAni Python backend.

---

## 📱 Architecture Overview

```
mobile/
├── pubspec.yaml                 # Dependencies: video_player, chewie, http, cached_network_image
├── README.md                    # Setup & architectural guide
└── lib/
    ├── models/
    │   └── title_model.dart     # Strong Dart models for Titles, X-Ray, Actors, Providers
    ├── services/
    │   └── movani_api_service.dart # Cross-platform HTTP client (handles Android 10.0.2.2 vs localhost)
    └── widgets/
        └── streaming_player_view.dart # In-stream Chewie/VideoPlayer HUD with X-Ray drawer
```

---

## 🚀 Running on Emulators and Real Devices

### 1. Backend Prerequisite
Ensure the Python server is running on your host machine:
```bash
python run.py
```
This serves the API at `http://localhost:5000` (and `http://127.0.0.1:5000`).

### 2. Android Emulator Connection
Android emulators run inside a virtual network where `127.0.0.1` refers to the emulator itself. To connect to the host computer's backend:
- The `MovaniApiService` automatically detects `Platform.isAndroid` and connects to `http://10.0.2.2:5000`.
- For iOS Simulator or Desktop/Web builds, it connects to `http://localhost:5000`.

### 3. Android Cleartext Traffic (HTTP)
Because the local development server runs over HTTP (`http://10.0.2.2:5000`), ensure `android/app/src/main/AndroidManifest.xml` allows cleartext traffic:
```xml
<application
    android:name="io.flutter.app.FlutterApplication"
    android:label="MOVAni"
    android:usesCleartextTraffic="true"
    android:icon="@mipmap/ic_launcher">
    ...
</application>
```

### 4. Install Dependencies & Launch
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🎬 Real Streaming & X-Ray Integration

1. **Direct Video Playback:** Uses `VideoPlayerController.networkUrl` backed by native ExoPlayer on Android and AVPlayer on iOS for butter-smooth 60fps streaming with hardware acceleration.
2. **Resumption Tracking:** Submits playback position down to the exact second (`current_seconds`) every 10 seconds to `/api/continue-watching`.
3. **Prime-Style X-Ray:** Slide-out drawer exposing scene music (song title, artist), verified production trivia, and cast headshots in real-time.
