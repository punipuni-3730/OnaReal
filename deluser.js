function deleteuser() {
    localStorage.clear();
    window.location.href = 'index.html'; 
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

