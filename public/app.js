// ===================================
// TutorTube - Main Application
// ===================================

(function() {
  'use strict';

  // ===== State =====
  const state = {
    videos: [],
    topics: [],
    currentTopic: 'all',
    currentSort: 'relevance',
    searchQuery: '',
    currentPage: 1,
    totalPages: 1,
    totalVideos: 0,
    isLoading: false,
    sidebarCollapsed: false,
    sidebarOpen: false,
    currentVideo: null,
    // Persisted locally
    watchHistory: JSON.parse(localStorage.getItem('tutortube_history') || localStorage.getItem('aitube_history') || '[]'),
    watchLater: JSON.parse(localStorage.getItem('tutortube_watchlater') || localStorage.getItem('aitube_watchlater') || '[]'),
    likedVideos: JSON.parse(localStorage.getItem('tutortube_liked') || localStorage.getItem('aitube_liked') || '[]'),
    theme: localStorage.getItem('tutortube_theme') || localStorage.getItem('aitube_theme') || 'dark'
  };

  // ===== DOM Elements =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    header: $('#header'),
    sidebar: $('#sidebar'),
    main: $('#main'),
    videoGrid: $('#videoGrid'),
    topicBar: $('#topicBar'),
    topicsList: $('#topicsList'),
    searchInput: $('#searchInput'),
    searchBtn: $('#searchBtn'),
    menuBtn: $('#menuBtn'),
    themeToggle: $('#themeToggle'),
    historyBtn: $('#historyBtn'),
    watchLaterBtn: $('#watchLaterBtn'),
    logoutBtn: $('#logoutBtn'),
    loading: $('#loading'),
    emptyState: $('#emptyState'),
    loadMore: $('#loadMore'),
    loadMoreBtn: $('#loadMoreBtn'),
    resultCount: $('#resultCount'),
    sortBar: $('#sortBar'),
    // Player
    playerSection: $('#playerSection'),
    videoPlayer: $('#videoPlayer'),
    closePlayer: $('#closePlayer'),
    playerTitle: $('#playerTitle'),
    playerChannel: $('#playerChannel'),
    playerViews: $('#playerViews'),
    playerDate: $('#playerDate'),
    playerDescription: $('#playerDescription'),
    playerTopics: $('#playerTopics'),
    playerLikeBtn: $('#playerLikeBtn'),
    playerSaveBtn: $('#playerSaveBtn'),
    playerYTLink: $('#playerYTLink'),
    summaryBullets: $('#summaryBullets'),
    takeawaysList: $('#takeawaysList'),
    resourceLinks: $('#resourceLinks'),
    logoLink: $('#logoLink')
  };

  // ===== Initialize =====
  async function init() {
    const { data } = await window.tutorSupabase.auth.getSession();
    if (!data.session) {
      window.location.replace('/login.html');
      return;
    }
    applyTheme(state.theme);
    bindEvents();
    fetchVideos();
  }

  // ===== Theme =====
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('tutortube_theme', theme);
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  // ===== Data Fetching =====
  async function fetchVideos(append = false) {
    if (state.isLoading) return;
    state.isLoading = true;

    if (!append) {
      els.videoGrid.innerHTML = '';
      els.loading.style.display = 'flex';
      els.emptyState.style.display = 'none';
    }

    try {
      const params = new URLSearchParams({
        topic: state.currentTopic,
        sort: state.currentSort,
        search: state.searchQuery,
        page: state.currentPage,
        limit: 30
      });

      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();

      state.videos = append ? [...state.videos, ...data.videos] : data.videos;
      state.totalPages = data.totalPages;
      state.totalVideos = data.total;

      if (state.topics.length === 0 && data.topics) {
        state.topics = data.topics;
        renderTopics();
      }

      renderVideos(data.videos, append);
      updateResultCount();
      updateLoadMore();
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      showToast('Failed to load videos');
    } finally {
      state.isLoading = false;
      els.loading.style.display = 'none';
    }
  }

  // ===== Rendering =====
  function renderTopics() {
    // Topic bar: flat index tags instead of colorful pills.
    els.topicBar.innerHTML = state.topics.map(t => `
      <button class="topic-pill ${t.id === state.currentTopic ? 'active' : ''}" 
              data-topic="${t.id}">
        <span class="pill-icon">//</span>${t.name}
      </button>
    `).join('');

    // Sidebar topics
    els.topicsList.innerHTML = `
      <h3 class="sidebar-title">Explore</h3>
      ${state.topics.filter(t => t.id !== 'all').map((t, i) => `
        <a href="#" class="sidebar-link ${t.id === state.currentTopic ? 'active' : ''}" 
           data-topic="${t.id}">
          <span class="sidebar-icon">${String(i + 1).padStart(2, '0')}</span>
          <span>${t.name}</span>
        </a>
      `).join('')}
    `;
  }

  function renderVideos(videos, append = false) {
    if (!append) {
      els.videoGrid.innerHTML = '';
    }

    if (videos.length === 0 && !append) {
      els.emptyState.style.display = 'flex';
      return;
    }

    els.emptyState.style.display = 'none';

    const fragment = document.createDocumentFragment();

    videos.forEach((video, i) => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.setAttribute('data-id', video.id);
      card.style.animationDelay = `${i * 40}ms`;

      const isSaved = state.watchLater.includes(video.id);
      const isWatched = state.watchHistory.includes(video.id);
      const progress = isWatched ? 64 : 0; // Stable visual marker for locally watched items.

      card.innerHTML = `
        <div class="card-thumbnail">
          ${video.isLive ? '<span class="card-live-badge">LIVE EVENT</span>' : ''}
          <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy" 
               onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'320\\' height=\\'180\\' viewBox=\\'0 0 320 180\\'><rect fill=\\'%23272727\\' width=\\'320\\' height=\\'180\\'/><text fill=\\'%23666\\' font-family=\\'sans-serif\\' font-size=\\'14\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>TutorTube</text></svg>'">
          <span class="card-duration">${video.duration}</span>
          ${isWatched ? `<div class="card-progress" style="width:${progress}%"></div>` : ''}
          <button class="card-save-btn ${isSaved ? 'saved' : ''}" data-save="${video.id}" title="${isSaved ? 'Remove from Watch Later' : 'Add to Watch Later'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(video.title)}</h3>
          <div class="card-channel">${escapeHtml(video.channel)}</div>
          <div class="card-meta">
            <span>${formatViews(video.views)} views</span>
            <span class="meta-dot"></span>
            <span>${formatDate(video.publishedAt)}</span>
          </div>
          ${video.topics ? `
            <div class="card-topics">
              ${video.topics.slice(0, 3).map(t => {
                const topic = state.topics.find(tp => tp.id === t);
                return `<span class="card-topic-tag">${topic ? topic.name : t}</span>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;

      fragment.appendChild(card);
    });

    els.videoGrid.appendChild(fragment);
  }

  function updateResultCount() {
    const topicName = state.topics.find(t => t.id === state.currentTopic)?.name || 'All';
    if (state.searchQuery) {
      els.resultCount.textContent = `${state.totalVideos} results for "${state.searchQuery}"`;
    } else {
      els.resultCount.textContent = `${state.totalVideos} videos · ${topicName}`;
    }
  }

  function updateLoadMore() {
    els.loadMore.style.display = state.currentPage < state.totalPages ? 'flex' : 'none';
  }

  // ===== Video Player =====
  function playVideo(videoId) {
    const video = state.videos.find(v => v.id === videoId);
    if (!video) return;

    state.currentVideo = video;

    // Add to watch history
    addToHistory(videoId);

    // Set player
    hidePlayerFallback();
    const origin = encodeURIComponent(window.location.origin);
    els.videoPlayer.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${origin}`;
    els.playerTitle.textContent = video.title;
    els.playerChannel.textContent = video.channel;
    els.playerViews.textContent = formatViews(video.views) + ' views';
    els.playerDate.textContent = formatDate(video.publishedAt);
    els.playerDescription.textContent = video.description || '';
    els.playerYTLink.href = `https://www.youtube.com/watch?v=${videoId}`;

    // Topics
    els.playerTopics.innerHTML = (video.topics || []).map(t => {
      const topic = state.topics.find(tp => tp.id === t);
      return `<span class="card-topic-tag">${topic ? topic.name : t}</span>`;
    }).join('');

    renderVideoInsights(video);

    // Like/Save state
    updatePlayerButtons(videoId);

    // Show player
    els.playerSection.style.display = 'block';
    els.playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update document title
    document.title = `${video.title} — TutorTube`;
  }

  // ===== No-noise video context =====
  // Local and deterministic for now: useful context without pretending a remote
  // LLM or transcript is available.
  function renderVideoInsights(video) {
    const topicNames = (video.topics || []).map(id => {
      const topic = state.topics.find(item => item.id === id);
      return topic ? topic.name : id.replace(/-/g, ' ');
    });
    const topicText = topicNames.length ? topicNames.slice(0, 2).join(' + ') : 'AI/ML';
    const description = video.description || `A curated ${topicText} reference from ${video.channel}.`;
    const summary = [
      `${video.channel} explores ${video.title} through a ${topicText} lens.`,
      description,
      `Runtime ${video.duration || 'unknown'} · ${formatViews(video.views)} views · published ${formatDate(video.publishedAt)}.`
    ];
    setInsightList(els.summaryBullets, summary);
    setInsightList(els.takeawaysList, buildTakeaways(video, topicNames));
    els.resourceLinks.innerHTML = buildResources(video).map(resource => `
      <a class="resource-link" href="${resource.url}" target="_blank" rel="noopener noreferrer">
        <span>${escapeHtml(resource.label)}</span><span>${resource.kind}</span>
      </a>
    `).join('');
  }

  function setInsightList(element, items) {
    element.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      element.appendChild(li);
    });
  }

  function buildTakeaways(video, topicNames) {
    const takeaways = [];
    const topics = video.topics || [];
    const topicText = topicNames[0] || 'the subject';
    if (topics.includes('llm') || /transformer|gpt|language model|rag/i.test(video.title)) {
      takeaways.push('Connects model behavior to the data, context, or attention mechanism underneath it.');
    }
    if (topics.includes('tutorials') || /course|tutorial|guide|build|coding/i.test(video.title)) {
      takeaways.push('Structured as a practical reference: pause at implementation steps and adapt the examples locally.');
    }
    if (topics.includes('research')) {
      takeaways.push('Separates the core research idea from the benchmark or production implications.');
    }
    if (topics.includes('mlops')) {
      takeaways.push('Keeps the model in a real system: reproducibility, deployment, and monitoring are part of the work.');
    }
    if (topics.includes('computer-vision') || topics.includes('robotics')) {
      takeaways.push('Treats perception as a pipeline, where data and runtime constraints shape the final result.');
    }
    if (!takeaways.length) {
      takeaways.push(`Use this as a focused orientation to ${topicText.toLowerCase()}, then follow the linked primary resources.`);
      takeaways.push('The most useful signal is the implementation trade-off, not the headline claim.');
    }
    return takeaways.slice(0, 3);
  }

  function buildResources(video) {
    const topicResources = {
      llm: ['Hugging Face NLP Course', 'https://huggingface.co/learn/nlp-course/chapter1/1'],
      agents: ['LangChain docs', 'https://python.langchain.com/docs/introduction/'],
      'deep-learning': ['PyTorch docs', 'https://pytorch.org/docs/stable/'],
      'machine-learning': ['scikit-learn user guide', 'https://scikit-learn.org/stable/user_guide.html'],
      'computer-vision': ['OpenCV docs', 'https://docs.opencv.org/4.x/'],
      nlp: ['spaCy documentation', 'https://spacy.io/usage'],
      'reinforcement-learning': ['Gymnasium docs', 'https://gymnasium.farama.org/'],
      'data-science': ['pandas documentation', 'https://pandas.pydata.org/docs/'],
      'generative-ai': ['Hugging Face Diffusers', 'https://huggingface.co/docs/diffusers/index'],
      robotics: ['ROS 2 docs', 'https://docs.ros.org/en/jazzy/'],
      mlops: ['MLflow docs', 'https://mlflow.org/docs/latest/ml/'],
      research: ['arXiv research index', 'https://arxiv.org/']
    };
    const resources = [{ label: 'Original YouTube source', url: `https://www.youtube.com/watch?v=${video.id}`, kind: 'SOURCE' }];
    const add = (label, url, kind = 'DOCS') => {
      if (!resources.some(resource => resource.url === url)) resources.push({ label, url, kind });
    };
    (video.topics || []).some(topic => {
      const resource = topicResources[topic];
      if (resource) add(resource[0], resource[1]);
      return resources.length >= 3;
    });
    if (/lora|qlora/i.test(video.title)) add('Hugging Face PEFT', 'https://github.com/huggingface/peft', 'CODE');
    if (/rag|retrieval/i.test(video.title)) add('LangChain RAG guide', 'https://python.langchain.com/docs/tutorials/rag/', 'CODE');
    if (/cuda/i.test(video.title)) add('NVIDIA CUDA toolkit', 'https://docs.nvidia.com/cuda/', 'DOCS');
    if (/pandas/i.test(video.title)) add('pandas examples', 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', 'CODE');
    return resources.slice(0, 4);
  }

  function handleYouTubeMessage(event) {
    if (!event.origin.includes('youtube.com')) return;
    let message;
    try { message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch (_) { return; }
    const errorCodes = [2, 5, 100, 101, 150, 153];
    if (message && (message.event === 'onError' || errorCodes.includes(Number(message.info)))) {
      showPlayerFallback(state.currentVideo?.id);
    }
  }

  function showPlayerFallback(videoId) {
    if (!videoId || !state.currentVideo) return;
    let fallback = document.querySelector('.player-fallback');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.className = 'player-fallback';
      fallback.innerHTML = '<strong>EMBED UNAVAILABLE</strong><span>This video is restricted or unavailable in the embedded player.</span><a target="_blank" rel="noopener">Open on YouTube ↗</a>';
      els.videoPlayer.parentElement.appendChild(fallback);
    }
    fallback.querySelector('a').href = `https://www.youtube.com/watch?v=${videoId}`;
    fallback.hidden = false;
  }

  function hidePlayerFallback() {
    const fallback = document.querySelector('.player-fallback');
    if (fallback) fallback.hidden = true;
  }

  function closePlayer() {
    els.videoPlayer.src = '';
    els.playerSection.style.display = 'none';
    state.currentVideo = null;
    document.title = 'TutorTube — Learn AI & ML';
  }

  function updatePlayerButtons(videoId) {
    const isLiked = state.likedVideos.includes(videoId);
    const isSaved = state.watchLater.includes(videoId);

    els.playerLikeBtn.classList.toggle('active', isLiked);
    els.playerSaveBtn.classList.toggle('active', isSaved);
  }

  // ===== Local Storage Helpers =====
  function addToHistory(videoId) {
    state.watchHistory = state.watchHistory.filter(id => id !== videoId);
    state.watchHistory.unshift(videoId);
    state.watchHistory = state.watchHistory.slice(0, 100); // Keep last 100
    localStorage.setItem('tutortube_history', JSON.stringify(state.watchHistory));
  }

  function toggleWatchLater(videoId) {
    const idx = state.watchLater.indexOf(videoId);
    if (idx >= 0) {
      state.watchLater.splice(idx, 1);
      showToast('Removed from Watch Later');
    } else {
      state.watchLater.push(videoId);
      showToast('Added to Watch Later');
    }
    localStorage.setItem('tutortube_watchlater', JSON.stringify(state.watchLater));
  }

  function toggleLike(videoId) {
    const idx = state.likedVideos.indexOf(videoId);
    if (idx >= 0) {
      state.likedVideos.splice(idx, 1);
      showToast('Removed from Liked');
    } else {
      state.likedVideos.push(videoId);
      showToast('Added to Liked Videos');
    }
    localStorage.setItem('tutortube_liked', JSON.stringify(state.likedVideos));
  }

  // ===== Special Views =====
  function showLibraryView(type) {
    let ids;
    let title;
    switch(type) {
      case 'history':
        ids = state.watchHistory;
        title = 'Watch History';
        break;
      case 'watchlater':
        ids = state.watchLater;
        title = 'Watch Later';
        break;
      case 'liked':
        ids = state.likedVideos;
        title = 'Liked Videos';
        break;
      default: return;
    }

    // We need to show videos from these IDs
    // Since we have all data, filter locally
    updateActiveNavigation(type);
    state.currentTopic = 'all';
    state.searchQuery = '';
    state.currentSort = 'relevance';
    els.searchInput.value = '';

    // Fetch all then filter
    fetch('/api/videos?limit=1000')
      .then(r => r.json())
      .then(data => {
        const filtered = ids.map(id => data.videos.find(v => v.id === id)).filter(Boolean);
        state.videos = filtered;
        state.totalVideos = filtered.length;
        state.totalPages = 1;
        state.currentPage = 1;
        
        els.resultCount.textContent = `${filtered.length} videos · ${title}`;
        els.videoGrid.innerHTML = '';
        renderVideos(filtered);
        updateLoadMore();
        updateActiveTopic();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  }

  function showCollectionView(type) {
    const subscriptionChannels = new Set([
      'Andrej Karpathy', '3Blue1Brown', 'DeepLearning.AI', 'NVIDIA', 'Google',
      'Google DeepMind', 'Stanford Online', 'freeCodeCamp.org', 'DeepMind'
    ]);
    const config = type === 'live'
      ? { title: 'Live', filter: video => video.isLive }
      : { title: 'Subscriptions', filter: video => subscriptionChannels.has(video.channel) };

    state.currentTopic = 'all';
    state.searchQuery = '';
    state.currentSort = 'date';
    state.currentPage = 1;
    els.searchInput.value = '';
    closePlayer();
    updateActiveNavigation(type);

    fetch('/api/videos?limit=1000&sort=date')
      .then(response => response.json())
      .then(data => {
        const filtered = data.videos.filter(config.filter);
        state.videos = filtered;
        state.totalVideos = filtered.length;
        state.totalPages = 1;
        els.resultCount.textContent = `${filtered.length} videos · ${config.title}`;
        renderVideos(filtered);
        updateLoadMore();
        updateSortButtons();
        updateActiveTopic();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(() => showToast(`Could not load ${config.title.toLowerCase()}`));
  }

  // ===== Event Binding =====
  function bindEvents() {
    // Menu toggle
    els.menuBtn.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        state.sidebarOpen = !state.sidebarOpen;
        els.sidebar.classList.toggle('open', state.sidebarOpen);
        toggleOverlay(state.sidebarOpen);
      } else {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        els.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
        els.main.classList.toggle('expanded', state.sidebarCollapsed);
      }
    });

    // Theme toggle
    els.themeToggle.addEventListener('click', toggleTheme);

    // Logo click - go home
    els.logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      state.currentTopic = 'all';
      state.currentSort = 'relevance';
      state.searchQuery = '';
      updateActiveNavigation('home');
      state.currentPage = 1;
      els.searchInput.value = '';
      closePlayer();
      fetchVideos();
      updateActiveTopic();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Search
    els.searchBtn.addEventListener('click', performSearch);
    els.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // Keyboard shortcut
    window.addEventListener('message', handleYouTubeMessage);
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement !== els.searchInput) {
        e.preventDefault();
        els.searchInput.focus();
      }
      if (e.key === 'Escape') {
        if (state.currentVideo) closePlayer();
        els.searchInput.blur();
      }
    });

    // Topic bar clicks
    els.topicBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.topic-pill');
      if (!pill) return;
      const topic = pill.dataset.topic;
      setTopic(topic);
    });

    // Sidebar topic clicks
    els.sidebar.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar-link');
      if (!link) return;
      e.preventDefault();

      if (link.dataset.topic) {
        setTopic(link.dataset.topic);
        closeMobileSidebar();
      } else if (link.dataset.action) {
        const action = link.dataset.action;
        if (action === 'home') {
          state.currentSort = 'relevance';
          setTopic('all');
        } else if (action === 'subscriptions' || action === 'live') {
          showCollectionView(action);
        } else if (action === 'trending') {
          updateActiveNavigation('trending');
          state.currentSort = 'views';
          state.currentTopic = 'all';
          state.searchQuery = '';
          state.currentPage = 1;
          fetchVideos();
          updateSortButtons();
        } else if (action === 'latest') {
          updateActiveNavigation('latest');
          state.currentSort = 'date';
          state.currentTopic = 'all';
          state.searchQuery = '';
          state.currentPage = 1;
          fetchVideos();
          updateSortButtons();
        } else if (['history', 'watchlater', 'liked'].includes(action)) {
          showLibraryView(action);
        }
        closeMobileSidebar();
      }
    });

    // Sort buttons
    els.sortBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.sort-btn');
      if (!btn) return;
      state.currentSort = btn.dataset.sort;
      state.currentPage = 1;
      updateSortButtons();
      fetchVideos();
    });

    // Video card clicks
    els.videoGrid.addEventListener('click', (e) => {
      // Save button
      const saveBtn = e.target.closest('.card-save-btn');
      if (saveBtn) {
        e.stopPropagation();
        const videoId = saveBtn.dataset.save;
        toggleWatchLater(videoId);
        saveBtn.classList.toggle('saved');
        return;
      }

      // Card click → play
      const card = e.target.closest('.video-card');
      if (card) {
        playVideo(card.dataset.id);
      }
    });

    // Player buttons
    els.closePlayer.addEventListener('click', closePlayer);

    els.playerLikeBtn.addEventListener('click', () => {
      if (!state.currentVideo) return;
      toggleLike(state.currentVideo.id);
      updatePlayerButtons(state.currentVideo.id);
    });

    els.playerSaveBtn.addEventListener('click', () => {
      if (!state.currentVideo) return;
      toggleWatchLater(state.currentVideo.id);
      updatePlayerButtons(state.currentVideo.id);
    });

    // Header buttons
    els.historyBtn.addEventListener('click', () => showLibraryView('history'));
    els.watchLaterBtn.addEventListener('click', () => showLibraryView('watchlater'));
    els.logoutBtn.addEventListener('click', async () => {
      await window.tutorSupabase.auth.signOut();
      window.location.replace('/login.html');
    });

    // Load more
    els.loadMoreBtn.addEventListener('click', () => {
      state.currentPage++;
      fetchVideos(true);
    });
  }

  function performSearch() {
    const query = els.searchInput.value.trim();
    state.searchQuery = query;
    state.currentPage = 1;
    state.currentTopic = 'all';
    updateActiveNavigation('home');
    fetchVideos();
    updateActiveTopic();
  }

  function setTopic(topic) {
    state.currentTopic = topic;
    state.currentPage = 1;
    state.searchQuery = '';
    els.searchInput.value = '';
    closePlayer();
    updateActiveNavigation(topic === 'all' ? 'home' : null);
    updateSortButtons();
    fetchVideos();
    updateActiveTopic();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateActiveTopic() {
    // Pills
    $$('.topic-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.topic === state.currentTopic);
    });
    // Sidebar
    $$('.sidebar-link[data-topic]').forEach(link => {
      link.classList.toggle('active', link.dataset.topic === state.currentTopic);
    });
  }

  function updateActiveNavigation(action) {
    $$('.sidebar-link[data-action]').forEach(link => {
      link.classList.toggle('active', link.dataset.action === action);
    });
  }

  function updateSortButtons() {
    $$('.sort-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === state.currentSort);
    });
  }

  // ===== Mobile Sidebar =====
  function closeMobileSidebar() {
    if (window.innerWidth <= 1024) {
      state.sidebarOpen = false;
      els.sidebar.classList.remove('open');
      toggleOverlay(false);
    }
  }

  function toggleOverlay(show) {
    let overlay = document.querySelector('.sidebar-overlay');
    if (show && !overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay visible';
      overlay.addEventListener('click', closeMobileSidebar);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));
    } else if (!show && overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ===== Toast =====
  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ===== Utilities =====
  function formatViews(views) {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
    return views.toString();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return 'Today';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ===== Start =====
  document.addEventListener('DOMContentLoaded', init);
})();
