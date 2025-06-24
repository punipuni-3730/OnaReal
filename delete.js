const GoogleAppScriptURL = 'https://proxy-onareal.s-salmon.net';
const DeleteURL = 'https://proxy-onareal.s-salmon.net/delete';

let postsData = [];
let currentDeleteIndex = -1;

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadPosts() {
  fetch(GoogleAppScriptURL)
  .then(response => response.json())
  .then(data => {
    postsData = data;
    displayPosts(data);
  })
  .catch(error => {
    console.error('Error fetching posts:', error);
    document.getElementById('posts-container').innerHTML = "<p>投稿の読み込みに失敗しました。</p>";
  });
}

function displayPosts(data) {
  const container = document.getElementById('posts-container');
  if (data.length === 0) {
    container.innerHTML = "<p>投稿がありません。</p>";
    return;
  }

  let html = '';
  for (let i = 0; i < data.length; i++) {
    const post = data[i];
    html += `
      <div class="post" id="post-${i}">
        <div class="post_user">
          <div class="post_user_icon">
            <a href="#"><img src="${escapeHtml(post.user_icon)}" referrerpolicy="no-referrer" id="usericon"></a>
          </div>          
          <div class="post_user_name">
            <a>${escapeHtml(post.username)}</a>
          </div>
        </div>
        <div class="post_photo">
          <img src="${escapeHtml(post.image)}" referrerpolicy="no-referrer">
        </div>
        <div class="post_captions">
          <p>${escapeHtml(post.caption)}</p>
        </div>
        <div style="text-align: center; margin-top: 10px;">
          <button onclick="showDeleteModal(${i})" style="background: #ff4444; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">削除</button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function showDeleteModal(index) {
  currentDeleteIndex = index;
  const post = postsData[index];
  const confirmText = `投稿者: ${escapeHtml(post.username)}\nキャプション: ${escapeHtml(post.caption.substring(0, 50))}...\n\nこの投稿を削除しますか？`;
  document.getElementById('delete-confirm-text').innerText = confirmText;
  document.getElementById('delete-password').value = '';
  document.getElementById('delete-modal').style.display = 'block';
}

function cancelDelete() {
  document.getElementById('delete-modal').style.display = 'none';
  currentDeleteIndex = -1;
}

function confirmDelete() {
  const password = document.getElementById('delete-password').value;
  if (!password) {
    alert('パスワードを入力してください。');
    return;
  }

  if (currentDeleteIndex === -1) {
    alert('削除する投稿が選択されていません。');
    return;
  }

  const post = postsData[currentDeleteIndex];
  const deleteData = {
    rowNumber: currentDeleteIndex + 2,
    password: password,
    username: post.username,
    caption: post.caption
  };

  fetch(DeleteURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(deleteData)
  })
  .then(response => response.text())
  .then(text => {
    try {
      const data = JSON.parse(text);
      if (data.success) {
        alert('投稿が削除されました。');
        document.getElementById('delete-modal').style.display = 'none';
        loadPosts();
      } else {
        alert('削除に失敗しました: ' + (data.error || 'パスワードが間違っています。'));
      }
    } catch (e) {
      console.error('JSON parse error:', e);
      alert('削除に失敗しました。');
    }
  })
  .catch(error => {
    console.error('Delete error:', error);
    alert('ネットワークエラーが発生しました。');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  if(localStorage.getItem('state') !== '1'){
    window.location.href = 'setuser.html';
  }
  loadPosts();
}); 