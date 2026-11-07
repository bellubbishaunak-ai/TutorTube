const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(compression());
app.use(express.json());

// Paths
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEOS_FILE = path.join(__dirname, 'data', 'videos.json');

// Load video data
function loadVideoData() {
  try {
    const raw = fs.readFileSync(VIDEOS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Could not load videos.json:', error.message);
    throw error;
  }
}

// Deterministic daily shuffle
function simpleHash(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  return hash;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    application: 'TutorTube'
  });
});

// Get videos
app.get('/api/videos', (req, res) => {
  try {
    const data = loadVideoData();

    const {
      topic,
      sort,
      search,
      page = '1',
      limit = '30'
    } = req.query;

    let videos = [...(data.videos || [])];

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 30)
    );

    // Filter by topic
    if (topic && topic !== 'all') {
      videos = videos.filter(video =>
        video.topics && video.topics.includes(topic)
      );
    }

    // Search
    if (search) {
      const query = String(search).toLowerCase();

      videos = videos.filter(video =>
        (video.title || '').toLowerCase().includes(query) ||
        (video.channel || '').toLowerCase().includes(query) ||
        (video.description || '').toLowerCase().includes(query) ||
        (video.topics || []).some(item =>
          String(item).toLowerCase().includes(query)
        )
      );
    }

    // Sorting
    switch (sort) {
      case 'views':
        videos.sort(
          (a, b) => (b.views || 0) - (a.views || 0)
        );
        break;

      case 'date':
        videos.sort(
          (a, b) =>
            new Date(b.publishedAt || 0) -
            new Date(a.publishedAt || 0)
        );
        break;

      case 'duration':
        videos.sort(
          (a, b) =>
            (b.durationSeconds || 0) -
            (a.durationSeconds || 0)
        );
        break;

      default: {
        const today = new Date().toDateString();

        videos.sort((a, b) =>
          simpleHash(String(a.id) + today) -
          simpleHash(String(b.id) + today)
        );
      }
    }

    const total = videos.length;
    const start = (currentPage - 1) * pageLimit;
    const pagedVideos = videos.slice(start, start + pageLimit);

    res.json({
      videos: pagedVideos,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageLimit),
      topics: data.topics || []
    });

  } catch (error) {
    console.error('Error loading videos:', error);

    res.status(500).json({
      error: 'Failed to load videos'
    });
  }
});

// Get topics
app.get('/api/topics', (req, res) => {
  try {
    const data = loadVideoData();

    res.json({
      topics: data.topics || []
    });

  } catch (error) {
    console.error('Error loading topics:', error);

    res.status(500).json({
      error: 'Failed to load topics'
    });
  }
});

// Serve frontend locally
app.use(express.static(PUBLIC_DIR));

// Frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    error: 'Internal server error'
  });
});

// Export for Vercel
module.exports = app;

// Run locally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`TutorTube running at http://localhost:${PORT}`);
  });
}
