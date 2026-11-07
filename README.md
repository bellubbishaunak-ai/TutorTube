# ▶ TutorTube

**A focused YouTube-style learning library for AI/ML/Deep Learning content.**

Made by Shaunak Bellubbi.

![TutorTube Screenshot](https://img.shields.io/badge/Status-Live-brightgreen)

## ✨ Features

- **🧠 Curated AI Content** — Hand-picked videos across 15+ AI/ML topics
- **🏠 YouTube-style navigation** — Home, Subscriptions, Live, Trending, and local library views
- **🔍 Smart Search** — Search by title, channel, or topic
- **📂 16 Topic Categories** — LLMs, Agents, Deep Learning, Computer Vision, NLP, and more
- **🌓 Dark/Light Theme** — Beautiful UI with theme toggle
- **📖 Local Library** — Watch History, Watch Later, and Liked Videos (browser-local)
- **▶️ Embedded Player** — Watch videos directly without leaving the site
- **📱 Fully Responsive** — Works great on mobile, tablet, and desktop
- **⌨️ Keyboard Shortcuts** — Press `/` to search, `Esc` to close

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
# → http://localhost:3000
```

## 📡 Fetch Real YouTube Data (Optional)

To fetch fresh videos from YouTube's API:

1. Get a free API key at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable "YouTube Data API v3"
3. Run:

```bash
YOUTUBE_API_KEY=your_key npm run fetch-videos
```

This will search 45+ AI/ML queries and build a curated dataset of 400+ videos.

## 🗂️ Topics

| Icon | Topic | Description |
|------|-------|-------------|
| 🧠 | Large Language Models | GPT, Claude, LLaMA, transformers |
| 🤖 | AI Agents | LangChain, CrewAI, AutoGen, tool use |
| 🔬 | Deep Learning | Neural networks, architectures, training |
| 📊 | Machine Learning | Classical ML, algorithms, theory |
| 👁️ | Computer Vision | Object detection, segmentation, ViT |
| 💬 | NLP | Text processing, BERT, speech |
| 🎮 | Reinforcement Learning | RL, RLHF, game-playing AI |
| 📈 | Data Science | Pandas, analysis, visualization |
| 🎨 | Generative AI | Diffusion, GANs, image/video gen |
| 🦾 | Robotics | Autonomous systems, embodied AI |
| ⚙️ | MLOps | Deployment, monitoring, CUDA |
| 📄 | Research Papers | Paper reviews and explanations |
| 🎓 | Tutorials | Courses and learning resources |
| 🎙️ | Interviews & Podcasts | Conversations with AI leaders |
| 🚀 | AI Startups | Building AI companies |

## 🏗️ Architecture

```
tutortube/
├── server.js              # Express server with API
├── public/
│   ├── index.html         # Single-page application
│   ├── styles.css         # Full YouTube-like styling
│   └── app.js             # Client application logic
├── data/
│   └── videos.json        # Curated video dataset
└── scripts/
    └── fetch-videos.js    # YouTube API data fetcher
```

## 🎨 Design Philosophy

Design principles:
- **No clickbait** — Clean thumbnails, honest titles
- **Curated learning** — A focused catalog instead of an engagement feed
- **No login** — All state stored locally in your browser
- **No tracking** — Zero analytics, zero cookies
- **Open data** — The video dataset is a plain JSON file

## License

MIT
