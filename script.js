const GoogleAppScriptURL = 'https://script.google.com/macros/s/AKfycbwx1DuCms5x7T6ROrupWJYO7UvtvtirCYGGj-_yCvarJNG_9VXjVmcx1cQoXJ6WPYdsQw/exec';

document.addEventListener('DOMContentLoaded', function() {
  const usr = localStorage.getItem('username');
  if(localStorage.getItem('state') !== '1'){
    window.location.href = 'setuser.html';
  }
  document.getElementById("main").insertAdjacentHTML('afterbegin', `Welcome, ${usr}!`);
});

function load() {
  // GET リクエスト
  fetch(GoogleAppScriptURL)
  .then(response => response.json())
  .then(data => {
    let main = document.getElementById('main');
    main.innerHTML = ""; // 既存のコンテンツをクリア

    // ソート順を取得
    sort = document.getElementById('sortselect').value;

    switch (sort) {
      case 'newest':
        // 新しい順: 逆向きに
        data.reverse();
        break;
      case 'oldest':
        // 何もしない（元の順番）
        break;
      case 'popular':
        // 人気な方を上に
        data.sort((a, b) => parseInt(b.likes) - parseInt(a.likes));
        break;
      case 'random':
        // ランダム順に並べ替え
        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data[i], data[j]] = [data[j], data[i]]; // 要素を交換
        }
        break;
    }
    
    
    for (var i = 0; i < data.length; i++) {
      main.insertAdjacentHTML('beforeend', `
        <div class="post" id="post">
          <div class="post_user">
            <div class="post_user_icon">
              <a href="#"><img src="${data[i].user_icon}" referrerpolicy="no-referrer" id="usericon"></a>
            </div>          
            <div class="post_user_name">
              <a>${data[i].username}</a>
            </div>
          </div>
          <div class="post_photo">
            <img src="${data[i].image}" referrerpolicy="no-referrer">
          </div>
          <div class="post_captions">
            <p>${data[i].caption}</p> <!-- 'captions' から 'caption' へ変更 -->
          </div>
        </div>
      `);
    }
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    let main = document.getElementById('main');
    main.innerHTML = "<p>データの取得に失敗しました。</p>";
  });
}
