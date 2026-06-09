```markdown
# Gesture Garden · Interactive Web Experience

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Webcam Required](https://img.shields.io/badge/Requires-Webcam-blue)

**Gesture Garden** is an immersive browser-based interactive installation that recognizes hand gestures, facial expressions, and environmental interactions to generate real-time visual & audio feedback. It creates a meditative, ever-changing "garden" responding to your movements — butterflies, flowers, raindrops, mushrooms, and a hidden dandelion farewell ceremony.

## ✨ Features

### 🖐️ Gesture Recognition (5 core types)
| Gesture | Visual Effect | Audio Feedback |
|---------|---------------|----------------|
| Butterfly | Fading butterfly wings | Fluttering sound |
| Flower | 5–6 petals blooming | Gentle chime |
| Raindrop | Droplet with ripple | Rain volume changes |
| Tear / Water drop | Teardrop shape | Single drop sound |
| Mushroom | Mushroom + snail easter egg | Low hum + tiny bell |

- **Educational floating texts** — random psychology explanation appears per gesture.
- **Life & fade** — every effect fades smoothly; disappears when hand leaves.

### 🌿 Ambient Atmosphere
- Pollen particles, vignette shading, falling petals (adjustable by performance)
- Color temperature breathing — 30s warm/cool cycle
- Puddle reflections on the ground
- Dynamic shadow & bloom-like glow

### 🔊 Immersive Audio (9 sound layers)
- Butterfly flutter, bloom chime, rain loop (vol controllable), water drop, mushroom hum+bell
- Ambient rustle, bird chirps, after‑rain moisture texture
- **AudioContext** resumes on first user interaction, debug panel shows real status

### 😊 Facial Micro‑interactions
- Smile → flower sprouts near mouth corner
- Eyes closed → warm light fills the scene
- Nod → flowers sway gently

### 🐌 Easter Eggs & Special Events
- Snail appears when mushroom gesture is held
- Sunbeam after rain gesture
- Petals falling around mushroom

### 🌬️ Dandelion Farewell Ceremony
- Trigger: perform any gesture 10 times AND keep hand away for 10 seconds
- Visual: dandelion seeds disperse by blowing (microphone detection / simulated blow)
- Random farewell message appears

### 🎛️ UI & Helpers
- Floating info panel, debug panel (FPS, audio status, gesture count)
- Tutorial overlay (first visit)
- Breathing ring & perseverance ring (visual progress)
- Dark mode, loading indicator

### 🌱 Seed Orb Hint
- After collecting all 5 gesture types once, a one‑time hint appears at bottom

### 📊 Wristband Report Page
- Access via `?report=wristband`
- Displays weather log with real data parsing + "Back to Garden" button

### ⚡ Performance optimization
- FPS monitoring, auto particle reduction in low‑performance mode
- Works on most devices with webcam

## 🧪 Tech Stack

- **HTML5 / CSS3 / JavaScript (ES6)**
- **Canvas 2D** for all real‑time rendering
- **Web Audio API** for layered sound synthesis
- **MediaPipe / TensorFlow Lite** (or similar hand & face tracking via `camera_utils.js`)
- Responsive design — works on desktop & tablet (camera required)

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Edge, Safari 15+)
- A working webcam
- Local or HTTPS server (required for camera access in some browsers)

### Running locally
```bash
git clone https://github.com/yourusername/gesture-garden.git
cd gesture-garden
# Use any static server, e.g.:
python -m http.server 8000
# then open http://localhost:8000
```

First interaction

1. Allow camera permission when prompted.
2. Tutorial overlay will appear after 3.8 seconds.
3. Show your hand to the camera — try each gesture.
4. Smile, close eyes, or nod for extra micro‑magic.
5. After 10 gestures, try keeping your hand away to trigger the dandelion farewell.

🔧 Customization hints

· Change gesture sensitivity – edit gestureCaptions array and gesture logic inside camera_utils.js.
· Adjust particle count – modify maxPollenCount in lowPerformanceMode branch.
· Sound volume – edit gain node values inside updateRainVolume() etc.
· Report page data – replace mock data in ?report=wristband branch with real sensor parsing.

📁 File structure

```
.
├── index.html          # Main entry (all‑in‑one after polishing)
├── camera_utils.js     # Hand & face detection logic
├── style.css           # (embedded inside index.html if not separated)
└── README.md
```

The final polished version outputs a single HTML file that contains all JS/CSS – ideal for standalone deployment or embedding.

💡 Usage ideas

· Interactive art installation in exhibitions
· Relaxation / mindfulness tool
· Educational demo for gesture‑based interaction
· Companion visualizer for wristband sensor data (report page)

🙌 Credits

· Hand tracking powered by MediaPipe
· Inspired by biomimetic interfaces & generative art

📄 License

MIT — free for personal and commercial use.

---

Enjoy your invisible garden. Let every gesture grow a memory. 🌸

```
