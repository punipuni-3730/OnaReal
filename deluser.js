function deleteuser() {
    // FCMトークンもサーバーから削除
    const token = localStorage.getItem('fcm_token');
    if (token) {
        fetch('https://proxy-onareal.s-salmon.net/fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteNotificationToken', token })
        }).catch(() => {}); // 通信失敗時も無視して続行
    }
    localStorage.clear();
    // 通知ブロック状態でも確実に遷移させるため、location.replaceを使用
    window.location.replace('index.html');
}

const GoogleAppScriptURL = 'https://proxy-onareal.s-salmon.net';

// HTMLエスケープ関数
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
  if(localStorage.getItem('state') != '1'){
    window.location.href = 'setuser.html';
  }
});

