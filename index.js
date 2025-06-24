// Service Worker登録（重複を避けるため削除）
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('service-worker.js');
//   });
// }

// ソート変更時の処理（script.jsで既に処理されているため削除）
// document.getElementById('sortselect').addEventListener('change', function() {
//     load();
// });

// HTMLエスケープ関数（script.jsで既に定義されているため削除）
// function escapeHtml(text) {
//   if (typeof text !== 'string') return text;
//   const div = document.createElement('div');
//   div.textContent = text;
//   return div.innerHTML;
// }

// 重複するload()呼び出しを削除
// window.onload = load();

// メイン処理
document.addEventListener('DOMContentLoaded', function() {
  if(localStorage.getItem('state') == '1'){
    var usr = localStorage.getItem('username');
    if (usr) {
      const main = document.getElementById("main");
      if (main) {
        // デバッグ情報の後にWelcomeメッセージを挿入
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
          debugInfo.insertAdjacentHTML('afterend', `<p>Welcome, ${usr}!</p>`);
        } else {
          main.insertAdjacentHTML('afterbegin', `<p>Welcome, ${usr}!</p>`);
        }
      }
    }
  } else {
    window.location.href = 'setuser.html';
  }    
});