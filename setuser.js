const GoogleAppScriptURLPhoto = 'https://proxy-onareal.s-salmon.net/upload';
const GoogleAppScriptURL = 'https://proxy-onareal.s-salmon.net';

const uploadInput = document.getElementById('image-upload');
const previewImg = document.getElementById('preview');
const uploadButton = document.getElementById('upload-button');

uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
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

document.getElementById('image-upload').addEventListener('change', function(event) {
  var fileInput = document.getElementById('image-upload');
  var file = fileInput.files[0];
  var filename = file.name;
  var reader = new FileReader();

  reader.onloadend = function() {
    var previewContainer = document.getElementById('preview-container');
    var loadingGif = document.createElement('img');
    loadingGif.src = 'images/loading.gif';
    loadingGif.id = 'loading-gif';
    loadingGif.style.height = '60px';
    previewContainer.appendChild(loadingGif);

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
          var gif = document.getElementById('loading-gif');
          if (gif) gif.remove();
          if (xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.result === 'Completed') {
              const id = response.url.match(/[-\w]{25,}/)[0];
              document.getElementById('usericon').value = `https://lh3.googleusercontent.com/d/${id}`;
              alert('Upload successful!');
              // 画像アップロード成功時に自動で登録ボタンを押す
              document.getElementById('register-btn').click();
            } else {
              alert('Upload failed: Please try again.');
            }
          } else {
            alert('Upload failed: server returned status ' + xhr.status);
          }
        };

        xhr.onerror = function() {
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

document.addEventListener('DOMContentLoaded', function() {
  if(localStorage.getItem('state') == '1'){
    window.location.href = 'index.html';
  }    
});

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  let sanitized = input
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<form[^>]*>.*?<\/form>/gi, '')
    .replace(/<input[^>]*>/gi, '')
    .replace(/<textarea[^>]*>.*?<\/textarea>/gi, '')
    .replace(/<select[^>]*>.*?<\/select>/gi, '')
    .replace(/<button[^>]*>.*?<\/button>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<title[^>]*>.*?<\/title>/gi, '')
    .replace(/<head[^>]*>.*?<\/head>/gi, '')
    .replace(/<body[^>]*>.*?<\/body>/gi, '')
    .replace(/<html[^>]*>.*?<\/html>/gi, '')
    .replace(/<frame[^>]*>.*?<\/frame>/gi, '')
    .replace(/<frameset[^>]*>.*?<\/frameset>/gi, '')
    .replace(/<noframes[^>]*>.*?<\/noframes>/gi, '')
    .replace(/<applet[^>]*>.*?<\/applet>/gi, '')
    .replace(/<base[^>]*>/gi, '')
    .replace(/<bgsound[^>]*>/gi, '')
    .replace(/<xmp[^>]*>.*?<\/xmp>/gi, '')
    .replace(/<plaintext[^>]*>.*?<\/plaintext>/gi, '')
    .replace(/<listing[^>]*>.*?<\/listing>/gi, '');
  
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

// Registerボタンで登録・通知許可・FCMトークン取得後にindex.htmlへ遷移
const registerBtn = document.getElementById('register-btn');
if (registerBtn) {
  registerBtn.addEventListener('click', async function() {
    const username = document.getElementById('username').value.trim();
    const usericon = document.getElementById('usericon').value.trim();
    if (!username) {
      alert('Please enter a username.');
      return;
    }
    if (!usericon) {
      alert('Please upload your icon or wait for it to finish.');
      return;
    }
    // 通知許可
    if ('Notification' in window) {
      try {
        await Notification.requestPermission();
        if (window.getFCMToken) {
          await window.getFCMToken();
        }
      } catch (e) {}
    }
    // ユーザー情報保存
    localStorage.setItem('username', sanitizeInput(username));
    localStorage.setItem('usericon', usericon);
    localStorage.setItem('state', '1');
    window.location.href = 'index.html';
  });
}


