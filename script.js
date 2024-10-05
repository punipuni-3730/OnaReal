const GoogleAppScriptURL = 'https://script.google.com/macros/s/AKfycbzz_B9syhbtkzrSlbXMCMC3q3DUjr4anEXt2-_FlpNXyp6Mc2bPXIG05Jn8uhaoECUVfw/exec';

document.addEventListener('DOMContentLoaded', function() {
  const usr = localStorage.getItem('username');
  if(localStorage.getItem('state') !== '1'){
    window.location.href = 'setuser.html';
  }
  main.insertAdjacentHTML('afterbegin', `Welcome, ${usr}!`);
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
        break;
      case 'popular':
        // 人気な方を上に
      data.sort((a, b) => parseInt(b).likes - parseInt(a).likes);
        break;
    }
    
    for (var i = 0; i < data.length; i++) {
      main.insertAdjacentHTML('beforeend', `
        <div class="post" id="post">
          <div class="post_user">
            <div class="post_user_icon">
              <a href="${data[i].username}"><img src="${data[i].user_icon}" referrerpolicy="no-referrer" id="usericon"></a>
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

function upload(event) {
  event.preventDefault(); // フォームのデフォルト送信を防止

  // フォームデータを取得
  const formData = {
    username: localStorage.getItem('username'),
    usericon: localStorage.getItem('usericon'),
    title: document.getElementById('title').value,
    caption: document.getElementById('caption').value,
    image: document.getElementById('image').value
  };

  // POST リクエストを作成
  fetch(GoogleAppScriptURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    // サーバーからのレスポンスメッセージを表示
    document.getElementById('responseMessage').innerText = data.message;
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('responseMessage').innerText = 'Error: Failed to post data.';
  });
}

// フォームの送信イベントを監視
document.getElementById('postForm').addEventListener('submit', upload);

