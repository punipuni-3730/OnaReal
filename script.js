function load() {
  // GET リクエスト
  fetch('https://script.google.com/macros/s/AKfycbxwng0qKwz4t34FqoygL5kP0LKcLy2fjlOFXWVQpNT8h23AEOFWxf7EQNtwFzJ3CnvZcA/exec')
  .then(response => response.json())
  .then(data => {
    let main = document.getElementById('main');
    main.innerHTML = ""; // 既存のコンテンツをクリア

    for (var i = 0; i < data.length; i++) {
      main.insertAdjacentHTML('beforeend', `
        <div class="post" id="post">
          <div class="post_user">
            <div class="post_user_icon">
              <a href="${data[i].username}"><img src="${data[i].user_icon}" referrerpolicy="no-referrer" id="usericon"></a>
            </div>
            <div class="post_user_name">
              <a href="/">${data[i].username}</a>
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

function upload() {
    event.preventDefault(); // フォームのデフォルト送信を防止

    // フォームデータを取得
    const formData = {
      username: document.getElementById('username').value,
      title: document.getElementById('title').value,
      caption: document.getElementById('caption').value,
      image: document.getElementById('image').value,
      likes: parseInt(document.getElementById('likes').value),
      post_id: document.getElementById('post_id').value,
      user_icon: document.getElementById('user_icon').value
    };

    // POST リクエストを作成
    fetch('YOUR_GOOGLE_APPS_SCRIPT_POST_URL', {
      method: 'POST',
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
  };
