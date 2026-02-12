# Media Hub Pro 🚀

A high-performance, real-time media suite for screen recording, live streaming, and instant video editing.

## 🌟 Key Features
- **Dual Mode Studio**: Toggle between high-quality **Screen Recording** and **Live Streaming**.
- **On-the-Fly Editing**: Integrated **FFmpeg.wasm** allows you to trim and process videos directly in the browser.
- **Micro-Animations**: Fluid transitions and real-time state feedback powered by **Framer Motion**.
- **Pro-Grade Aesthetics**: Modern dark studio interface with high-contrast UI elements.
- **Zero Privacy Risk**: All processing happens locally on your machine.

## 🛠️ Technical Stack
- **Frontend**: React + TypeScript
- **Bundler**: Vite
- **Video Engine**: MediaRecorder API + FFmpeg.wasm
- **UI Components**: Lucide React + Framer Motion
- **Styling**: Tailwind CSS + Custom CSS Variables

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- NPM

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sechan9999/mediaapp.git
   cd mediaapp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### ⚠️ Important Note
This application requires **SharedArrayBuffer** for video processing. The development server is configured with the following headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## 📂 Project Structure
- `src/App.tsx`: The heart of the application – handles media streams and FFmpeg logic.
- `src/index.css`: Design system and global aesthetics.
- `vite.config.ts`: Advanced configuration for WASM and security headers.

## 📄 License
MIT License - Developed by Antigravity AI.
