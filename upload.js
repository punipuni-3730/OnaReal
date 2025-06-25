const GoogleAppScriptURLPhoto = 'https://proxy-onareal.s-salmon.net/upload';
const GoogleAppScriptURL = 'https://proxy-onareal.s-salmon.net';

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
      // 画像をリサイズ・圧縮
      resizeAndCompressImage(e.target.result, 500, 0.7, (resizedDataUrl) => {
        previewImg.src = resizedDataUrl;
      });
    };
    reader.readAsDataURL(file);
  }
});

function resizeAndCompressImage(dataUrl, maxSize, quality, callback) {
  const img = new Image();
  img.onload = function() {
    let width = img.width;
    let height = img.height;
    if (width > height) {
      if (width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = dataUrl;
}

// 画像ファイルを選択するためのイベントリスナー
document.getElementById('image-upload').addEventListener('change', function(event) {
  var fileInput = document.getElementById('image-upload');
  var file = fileInput.files[0];
  var filename = file.name;
  var reader = new FileReader();

  reader.onloadend = function() {
    // ローディングGIF表示
    var previewContainer = document.getElementById('preview-container');
    var loadingGif = document.createElement('img');
    loadingGif.src = 'images/loading.gif';
    loadingGif.id = 'loading-gif';
    loadingGif.style.height = '60px';
    previewContainer.appendChild(loadingGif);

    // 画像リサイズ・圧縮
    resizeAndCompressImage(reader.result, 500, 0.7, function(resizedDataUrl) {
      var base64data = resizedDataUrl.split(',')[1];

      fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(ipData => {
          sendData(ipData.ip || '');
        })
        .catch(() => {
          sendData('');
        });

      function sendData(ip) {
        var formData = {
          filename: filename,
          file: base64data
        };

        var xhr = new XMLHttpRequest();
        xhr.open('POST', GoogleAppScriptURLPhoto, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
          // ローディングGIF消す
          var gif = document.getElementById('loading-gif');
          if (gif) gif.remove();
          if (xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.result === 'Completed') {
              const id = response.url.match(/[-\w]{25,}/)[0];
              document.getElementById('image').value = `https://lh3.googleusercontent.com/d/${id}`;
              alert('Upload successful!');
            } else {
              alert('Upload failed: Please try again.');
            }
          } else {
            alert('Upload failed: server returned status ' + xhr.status);
          }
        };

        xhr.onerror = function() {
          // ローディングGIF消す
          var gif = document.getElementById('loading-gif');
          if (gif) gif.remove();
          alert('Upload failed: network or CORS error. Please try again.');
        };

        var params = 'filename=' + encodeURIComponent(formData.filename) +
                     '&file=' + encodeURIComponent(formData.file);
        xhr.send(params);
      }
    });
  };

  reader.readAsDataURL(file);
});

// 入力データをサニタイズ（無害化）する関数
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // 危険なタグを完全に除去（iframe, script, object, embed, form等）
  let sanitized = input
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // iframeタグを完全除去
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // scriptタグを完全除去
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // objectタグを完全除去
    .replace(/<embed[^>]*>/gi, '') // embedタグを完全除去
    .replace(/<form[^>]*>.*?<\/form>/gi, '') // formタグを完全除去
    .replace(/<input[^>]*>/gi, '') // inputタグを完全除去
    .replace(/<textarea[^>]*>.*?<\/textarea>/gi, '') // textareaタグを完全除去
    .replace(/<select[^>]*>.*?<\/select>/gi, '') // selectタグを完全除去
    .replace(/<button[^>]*>.*?<\/button>/gi, '') // buttonタグを完全除去
    .replace(/<link[^>]*>/gi, '') // linkタグを完全除去
    .replace(/<meta[^>]*>/gi, '') // metaタグを完全除去
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // styleタグを完全除去
    .replace(/<title[^>]*>.*?<\/title>/gi, '') // titleタグを完全除去
    .replace(/<head[^>]*>.*?<\/head>/gi, '') // headタグを完全除去
    .replace(/<body[^>]*>.*?<\/body>/gi, '') // bodyタグを完全除去
    .replace(/<html[^>]*>.*?<\/html>/gi, '') // htmlタグを完全除去
    .replace(/<frame[^>]*>.*?<\/frame>/gi, '') // frameタグを完全除去
    .replace(/<frameset[^>]*>.*?<\/frameset>/gi, '') // framesetタグを完全除去
    .replace(/<noframes[^>]*>.*?<\/noframes>/gi, '') // noframesタグを完全除去
    .replace(/<applet[^>]*>.*?<\/applet>/gi, '') // appletタグを完全除去
    .replace(/<base[^>]*>/gi, '') // baseタグを完全除去
    .replace(/<bgsound[^>]*>/gi, '') // bgsoundタグを完全除去
    .replace(/<xmp[^>]*>.*?<\/xmp>/gi, '') // xmpタグを完全除去
    .replace(/<plaintext[^>]*>.*?<\/plaintext>/gi, '') // plaintextタグを完全除去
    .replace(/<listing[^>]*>.*?<\/listing>/gi, '');
  
  // 残りのHTMLタグをエスケープ
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

function upload(event) {
  event.preventDefault();

  // 投稿ボタンを無効化（二度押し防止）
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = '投稿中...';
  }

  // ローディングGIF表示
  const responseMessage = document.getElementById('responseMessage');
  const loadingGif = document.createElement('img');
  loadingGif.src = 'images/loading.gif';
  loadingGif.id = 'post-loading-gif';
  loadingGif.style.height = '40px';
  responseMessage.appendChild(loadingGif);

  fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(ipData => {
      sendData(ipData.ip || '');
    })
    .catch(() => {
      sendData('');
    });

  function sendData(ip) {
    const formData = {
      action: 'upload', // ←追加
      username: sanitizeInput(localStorage.getItem('username')),
      usericon: sanitizeInput(localStorage.getItem('usericon')),
      title: "none",
      caption: sanitizeInput(document.getElementById('caption').value),
      image: document.getElementById('image').value,
      ip: ip
    };

    fetch(GoogleAppScriptURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.text())
    .then(text => {
      // ローディングGIF消す
      const gif = document.getElementById('post-loading-gif');
      if (gif) gif.remove();

      try {
        const data = JSON.parse(text);
        console.log('GAS response:', data);
        
        if (data.message) {
          document.getElementById('responseMessage').innerText = '投稿が完了しました！';
          // 投稿完了通知を送信
          if (typeof notificationManager !== 'undefined') {
            notificationManager.sendPostCompleteNotification();
          }
          // 投稿成功時は1秒後にindex.htmlにリダイレクト
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        } else if (data.error) {
          document.getElementById('responseMessage').innerText = 'エラー: ' + data.error;
          // エラー時はボタンを再度有効化
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '投稿';
          }
        } else {
          document.getElementById('responseMessage').innerText = '投稿が完了しました！';
          // 投稿完了通知を送信
          if (typeof notificationManager !== 'undefined') {
            notificationManager.sendPostCompleteNotification();
          }
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        document.getElementById('responseMessage').innerText = '投稿が完了しました！';
        // エラー時はボタンを再度有効化
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = '投稿';
        }
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    })
    .catch(error => {
      // ローディングGIF消す
      const gif = document.getElementById('post-loading-gif');
      if (gif) gif.remove();

      console.error('Fetch error:', error);
      document.getElementById('responseMessage').innerText = 'ネットワークエラーが発生しました。';
      // エラー時はボタンを再度有効化
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '投稿';
      }
    });
  }
}

document.getElementById('postForm').addEventListener('submit', upload);
