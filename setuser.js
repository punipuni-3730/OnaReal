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
            var response = JSON.parse(xhr.responseText);
            if (response.result === 'Completed') {
              alert('Image has been uploaded!');
              const id = response.url.match(/[-\w]{25,}/)[0];
              document.getElementById('usericon').value = `https://lh3.googleusercontent.com/d/${id}`;
            } else {
              alert('Upload failed: response error.');
            }
          } else {
            alert('Upload failed: server returned status ' + xhr.status);
          }
        };
        
        xhr.onerror = function() {
          alert('Upload failed: network or CORS error.');
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


      

document.addEventListener('DOMContentLoaded', function() {
  if(localStorage.getItem('state') == '1'){
    window.location.href = 'index.html';
  }    
});

function setuser(event) {
  // Prevent the default form submission behavior
  event.preventDefault();
  if (document.getElementById('username').value.trim() == '') {
    alert('Please enter a username.');
    return;
  }
  if (document.getElementById('usericon').value.trim() == '') {
    alert('Please upload your icon or wait for it to finish.');
    return;
  }

  // Store the username and usericon in localStorage
  localStorage.setItem('username', document.getElementById('username').value);
  localStorage.setItem('usericon', document.getElementById('usericon').value);

  // Check if the username was successfully set
  if (localStorage.getItem('username')) {
      localStorage.setItem('state', '1');
      window.location.href = 'index.html'; // Redirect to the index page
  }
}

function deleteuser() {
  localStorage.clear(); // Clear all localStorage data
}

document.querySelector('button[type="submit"]').addEventListener('click', setuser);


