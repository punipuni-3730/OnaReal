// Service Worker全解除＆firebase-messaging-sw.jsのみ再登録
(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      const unregisterPromises = registrations.map(reg => reg.unregister());
      Promise.all(unregisterPromises).then(function() {
        // firebase-messaging-sw.jsのみ再登録
        navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(function(e){
          console.warn('Service Worker登録失敗:', e);
        });
      });
    });
  }
})();

// --- Service Worker全解除＆firebase-messaging-sw.jsのみ再登録 ---
(async function manageServiceWorker() {
  if ('serviceWorker' in navigator) {
    // 既存のService Workerを全て解除
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      try {
        await reg.unregister();
      } catch (e) {
        // エラーは無視
      }
    }
    // firebase-messaging-sw.jsのみ再登録
    try {
      await navigator.serviceWorker.register('firebase-messaging-sw.js');
    } catch (e) {
      // 登録失敗時も無視
    }
  }
})();

const GoogleAppScriptURL = 'https://proxy-onareal.s-salmon.net';

// キャッシュ用の変数
let cachedPosts = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30秒間キャッシュ

document.addEventListener('DOMContentLoaded', function() {
  const usr = localStorage.getItem('username');
  if(localStorage.getItem('state') !== '1'){
    window.location.href = 'setuser.html';
    return;
  }
  load();
});

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function load() {
  const now = Date.now();
  
  // キャッシュが有効な場合はキャッシュを使用
  if (cachedPosts && (now - lastFetchTime) < CACHE_DURATION) {
    displayPosts(cachedPosts);
    return;
  }
  
  fetch(GoogleAppScriptURL)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // 新しいレスポンス形式に対応: data.postsを参照
    const posts = data.posts || data;
    
    if (!Array.isArray(posts)) {
      throw new Error('Posts data is not an array');
    }
    
    // キャッシュを更新
    cachedPosts = posts;
    lastFetchTime = now;
    
    displayPosts(posts);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    let main = document.getElementById('main');
    
    // 投稿表示用のコンテナを作成または取得
    let postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
      postsContainer = document.createElement('div');
      postsContainer.id = 'posts-container';
      main.appendChild(postsContainer);
    }
    
    postsContainer.innerHTML = "<p>データの取得に失敗しました。</p>";
  });
}

function displayPosts(posts) {
  let main = document.getElementById('main');
  
  // Welcomeメッセージを保持
  const welcomeMessage = main.querySelector('p');
  
  // 投稿表示用のコンテナを作成または取得
  let postsContainer = document.getElementById('posts-container');
  if (!postsContainer) {
    postsContainer = document.createElement('div');
    postsContainer.id = 'posts-container';
    main.appendChild(postsContainer);
  }
  
  // 既存の投稿をクリア
  postsContainer.innerHTML = "";

  const sort = document.getElementById('sortselect').value;

  // データのコピーを作成してソート
  let sortedPosts = [...posts];

  switch (sort) {
    case 'newest':
      sortedPosts.reverse();
      break;
    case 'oldest':
      // そのまま（既に古い順）
      break;
    case 'popular':
      sortedPosts.sort((a, b) => parseInt(b.likes || 0) - parseInt(a.likes || 0));
      break;
    case 'random':
      for (let i = sortedPosts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedPosts[i], sortedPosts[j]] = [sortedPosts[j], sortedPosts[i]];
      }
      break;
  }
  
  // 一括でHTMLを構築
  const postsHTML = sortedPosts.map(post => `
    <div class="post" id="post">
      <div class="post_user">
        <div class="post_user_icon">
          <a href="#"><img src="${post.user_icon || './images/usericon.png'}" referrerpolicy="no-referrer" id="usericon"></a>
        </div>          
        <div class="post_user_name">
          <a>${escapeHtml(post.username || 'Anonymous')}</a>
        </div>
      </div>
      <div class="post_photo">
        <img src="${post.image || './images/dummy.png'}" referrerpolicy="no-referrer">
      </div>
      <div class="post_captions">
        <p>${escapeHtml(post.caption || '')}</p>
      </div>
    </div>
  `).join('');
  
  postsContainer.innerHTML = postsHTML;
}

// ソート変更時の処理を最適化
document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sortselect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      if (cachedPosts) {
        displayPosts(cachedPosts);
      } else {
        load();
      }
    });
  }
});
