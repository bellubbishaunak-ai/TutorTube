const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve video data
app.get('/api/videos', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'videos.json'), 'utf8'));
    const { topic, sort, search, page = 1, limit = 30 } = req.query;
    
    let videos = [...data.videos];
    
    // Filter by topic
    if (topic && topic !== 'all') {
      videos = videos.filter(v => v.topics && v.topics.includes(topic));
    }
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.channel.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (v.topics && v.topics.some(t => t.toLowerCase().includes(q)))
      );
    }
    
    // Sort
    switch(sort) {
      case 'views':
        videos.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'date':
        videos.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
        break;
      case 'duration':
        videos.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
        break;
      default:
        // Shuffle for "For You" feel - seeded by day so it's stable
        const today = new Date().toDateString();
        videos.sort((a, b) => {
          const hashA = simpleHash(a.id + today);
          const hashB = simpleHash(b.id + today);
          return hashA - hashB;
        });
    }
    
    const start = (page - 1) * limit;
    const paged = videos.slice(start, start + parseInt(limit));
    
    res.json({
      videos: paged,
      total: videos.length,
      page: parseInt(page),
      totalPages: Math.ceil(videos.length / limit),
      topics: data.topics || []
    });
  } catch (err) {
    console.error('Error loading videos:', err);
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

// Get topics list
app.get('/api/topics', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'videos.json'), 'utf8'));
    res.json({ topics: data.topics || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load topics' });
  }
});

// Simple hash for deterministic daily shuffle
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ▶ TutorTube is running at http://localhost:${PORT}\n`);
});
