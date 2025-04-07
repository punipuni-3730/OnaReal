const GoogleAppScriptURLPhoto = 'https://script.google.com/macros/s/AKfycbyU0l0NTQE2DuBIN674N86RrYk75LsZr_UCS-HiSBL5qcufOIqhvUYs9h0ltcKTFXRS/exec';
const GoogleAppScriptURL = 'https://script.google.com/macros/s/AKfycbzz_B9syhbtkzrSlbXMCMC3q3DUjr4anEXt2-_FlpNXyp6Mc2bPXIG05Jn8uhaoECUVfw/exec';

// 画像のプレビュー表示
const uploadInput = document.getElementById('image-upload');
const previewImg = document.getElementById('preview');
const uploadButton = document.getElementById('upload-button');

// 画像選択後にプレビューを表示するイベントリスナー
uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// 画像ファイルを選択するためのイベントリスナー
document.getElementById('image-upload').addEventListener('change', function(event) {
var fileInput = document.getElementById('image-upload');
      var file = fileInput.files[0];  // ユーザーが選択したファイル
      var filename = file.name;  // ファイル名を取得
      var reader = new FileReader();

      reader.onloadend = function() {
        // ファイルをBase64エンコードする
        var base64data = reader.result.split(',')[1];  // Base64部分を抽出

        // サーバーにPOSTリクエストを送信
        var formData = {
          filename: filename,
          file: base64data
        };

        // AJAXリクエスト
        var xhr = new XMLHttpRequest();
        xhr.open('POST', GoogleAppScriptURLPhoto, true);  // GASのWebアプリURLを指定
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
          if (xhr.status == 200) {
            // レスポンスを解析
            var response = JSON.parse(xhr.responseText);
            if (response.result === 'Completed') {
              // 成功した場合に画像のURLを表示
              alert('Image has been uploaded!');
              document.getElementById('image').value = response.url.slice(32);
              document.getElementById('image').value = document.getElementById('image').value.slice(0,-18);
              document.getElementById('image').value = 'https://lh3.googleusercontent.com/d/'+document.getElementById('image').value;
            } else {
              alert('ERROR');
            }
          }
        };
        
        // データをURLエンコードして送信
        var params = 'filename=' + encodeURIComponent(formData.filename) +
                     '&file=' + encodeURIComponent(formData.file);
        xhr.send(params);
      };

      // ファイルをBase64に変換
      reader.readAsDataURL(file);
    }
);


      

function upload(event) {
  event.preventDefault(); // フォームのデフォルト送信を防止

  // フォームデータを取得
  const formData = {
    username: localStorage.getItem('username'),
    usericon: localStorage.getItem('usericon'),
    title: "none",
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
    window.location.href = 'index.html';
  });
}

// フォームの送信イベントを監視
document.getElementById('postForm').addEventListener('submit', upload);
