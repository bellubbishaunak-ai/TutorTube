/**
 * Fetch Videos Script
 * 
 * This script fetches real AI/ML video data from the YouTube Data API
 * and builds the curated dataset for AITube.
 * 
 * Usage:
 *   1. Get a YouTube Data API v3 key from Google Cloud Console
 *   2. Set: YOUTUBE_API_KEY=your_key
 *   3. Run: npm run fetch-videos
 * 
 * The free tier allows ~100 searches/day (10,000 quota units).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error('\n❌ Please set YOUTUBE_API_KEY environment variable.');
  console.error('   Get one free at: https://console.cloud.google.com/apis/credentials\n');
  process.exit(1);
}

// AI/ML search queries to build a comprehensive library
const SEARCH_QUERIES = [
  // Core ML/DL
  'machine learning tutorial',
  'deep learning explained',
  'neural network from scratch',
  'transformer architecture explained',
  'attention mechanism deep learning',
  
  // LLMs
  'large language models explained',
  'GPT how it works',
  'LLM fine tuning tutorial',
  'prompt engineering guide',
  'RAG retrieval augmented generation',
  
  // AI Agents
  'AI agents tutorial',
  'LangChain agent tutorial',
  'autonomous AI agents',
  'multi agent systems AI',
  'function calling LLM',
  
  // Computer Vision
  'computer vision tutorial',
  'object detection YOLO',
  'image segmentation deep learning',
  'vision transformer ViT',
  
  // NLP
  'natural language processing course',
  'BERT explained',
  'text classification deep learning',
  'speech recognition AI',
  
  // Generative AI
  'stable diffusion explained',
  'diffusion models tutorial',
  'generative adversarial network',
  'image generation AI',
  
  // RL
  'reinforcement learning tutorial',
  'AlphaGo deep mind',
  'reward modeling RLHF',
  
  // Data Science
  'data science full course',
  'pandas python tutorial',
  'feature engineering machine learning',
  
  // MLOps
  'MLOps tutorial',
  'deploy machine learning model',
  'CUDA programming GPU',
  
  // Interviews/Talks
  'Andrej Karpathy talk',
  'Andrew Ng machine learning',
  'Lex Fridman AI interview',
  'AI research paper explained',
  
  // Robotics
  'robotics AI',
  'Boston Dynamics robot',
  'self driving car AI',
  
  // AI Startups
  'AI startup building',
  'Y Combinator AI companies'
];

const TOPICS_MAP = {
  'machine learning': 'machine-learning',
  'deep learning': 'deep-learning',
  'neural network': 'deep-learning',
  'transformer': 'llm',
  'attention': 'deep-learning',
  'large language': 'llm',
  'GPT': 'llm',
  'LLM': 'llm',
  'fine tun': 'llm',
  'prompt engineering': 'llm',
  'RAG': 'llm',
  'agent': 'agents',
  'LangChain': 'agents',
  'autonomous': 'agents',
  'multi agent': 'agents',
  'function call': 'agents',
  'computer vision': 'computer-vision',
  'object detection': 'computer-vision',
  'YOLO': 'computer-vision',
  'segmentation': 'computer-vision',
  'vision transformer': 'computer-vision',
  'NLP': 'nlp',
  'natural language': 'nlp',
  'BERT': 'nlp',
  'text classif': 'nlp',
  'speech': 'nlp',
  'diffusion': 'generative-ai',
  'GAN': 'generative-ai',
  'generative': 'generative-ai',
  'image generation': 'generative-ai',
  'reinforcement': 'reinforcement-learning',
  'AlphaGo': 'reinforcement-learning',
  'RLHF': 'reinforcement-learning',
  'data science': 'data-science',
  'pandas': 'data-science',
  'feature engineering': 'data-science',
  'MLOps': 'mlops',
  'deploy': 'mlops',
  'CUDA': 'mlops',
  'interview': 'interviews',
  'Lex Fridman': 'interviews',
  'talk': 'interviews',
  'paper explained': 'research',
  'research': 'research',
  'robotics': 'robotics',
  'robot': 'robotics',
  'self driving': 'robotics',
  'startup': 'startups',
  'Y Combinator': 'startups',
  'tutorial': 'tutorials',
  'course': 'tutorials',
  'from scratch': 'tutorials'
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { seconds: 0, formatted: '0:00' };
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  const total = h * 3600 + m * 60 + s;
  const formatted = h > 0 
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
  return { seconds: total, formatted };
}

function inferTopics(query, title, description) {
  const text = `${query} ${title} ${description}`.toLowerCase();
  const topics = new Set();
  
  for (const [keyword, topic] of Object.entries(TOPICS_MAP)) {
    if (text.includes(keyword.toLowerCase())) {
      topics.add(topic);
    }
  }
  
  return Array.from(topics).slice(0, 3);
}

async function searchVideos(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=relevance&videoDuration=medium&key=${API_KEY}`;
  
  try {
    const data = await fetchJSON(url);
    if (!data.items) return [];
    
    // Get video details for duration and stats
    const ids = data.items.map(v => v.id.videoId).join(',');
    const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}&key=${API_KEY}`;
    const details = await fetchJSON(detailUrl);
    
    const detailMap = {};
    (details.items || []).forEach(d => { detailMap[d.id] = d; });
    
    return data.items.map(item => {
      const detail = detailMap[item.id.videoId] || {};
      const dur = parseDuration(detail.contentDetails?.duration || 'PT0S');
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt?.split('T')[0],
        views: parseInt(detail.statistics?.viewCount || 0),
        likes: parseInt(detail.statistics?.likeCount || 0),
        durationSeconds: dur.seconds,
        duration: dur.formatted,
        topics: inferTopics(query, item.snippet.title, item.snippet.description),
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url
      };
    });
  } catch(err) {
    console.error(`  ❌ Error searching "${query}":`, err.message);
    return [];
  }
}

async function main() {
  console.log('\n🤖 AITube Video Fetcher\n');
  console.log(`Searching ${SEARCH_QUERIES.length} queries...\n`);
  
  const allVideos = new Map();
  
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const query = SEARCH_QUERIES[i];
    console.log(`[${i + 1}/${SEARCH_QUERIES.length}] Searching: ${query}`);
    
    const videos = await searchVideos(query);
    videos.forEach(v => {
      if (!allVideos.has(v.id)) {
        allVideos.set(v.id, v);
      } else {
        // Merge topics
        const existing = allVideos.get(v.id);
        const mergedTopics = [...new Set([...existing.topics, ...v.topics])].slice(0, 4);
        existing.topics = mergedTopics;
      }
    });
    
    console.log(`  Found ${videos.length} videos (${allVideos.size} unique total)`);
    
    // Rate limiting - wait 200ms between requests
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Load existing topics structure
  const existingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'videos.json'), 'utf8'));
  
  const output = {
    topics: existingData.topics,
    videos: Array.from(allVideos.values())
      .filter(v => v.views > 1000) // Filter low-quality
      .sort((a, b) => b.views - a.views) // Sort by popularity
  };
  
  const outPath = path.join(__dirname, '..', 'data', 'videos.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ Saved ${output.videos.length} videos to data/videos.json\n`);
}

main().catch(console.error);
