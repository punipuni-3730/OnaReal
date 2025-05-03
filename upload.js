const GoogleAppScriptURLPhoto = 'https://script.google.com/macros/s/AKfycbzxXj-5u8XuuMvY_U8KPm5wH2gzcyyT46IYlxC3NAENmkj8FZ14SfNLWHkssPdaxJjF/exec';
const GoogleAppScriptURL = 'https://script.google.com/macros/s/AKfycbyQ1bvSxHljNJTDHeS_ENwSnphvOS8oQ-NwAEg8S5r5TUe5R1oA8BHREnF9yKhizIQavw/exec';

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
  var file = fileInput.files[0];
  var filename = file.name;
  var reader = new FileReader();

  reader.onloadend = function() {
    var base64data = reader.result.split(',')[1];

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
        file: base64data,
        ip: ip
      };

      var xhr = new XMLHttpRequest();
      xhr.open('POST', GoogleAppScriptURLPhoto, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

      xhr.onload = function() {
        if (xhr.status == 200) {
          var response = JSON.parse(xhr.responseText);
          if (response.result === 'Completed') {
            const id = response.url.match(/[-\w]{25,}/)[0];
            document.getElementById('image').value = `https://lh3.googleusercontent.com/d/${id}`;
          } else {
            alert('Upload failed: Please try again.');
          }
        } else {
          alert('Upload failed: server returned status ' + xhr.status);
        }
      };

      xhr.onerror = function() {
        alert('Upload failed: network or CORS error. Please try again.');
      };

      var params = 'filename=' + encodeURIComponent(formData.filename) +
                   '&file=' + encodeURIComponent(formData.file) +
                   '&ip=' + encodeURIComponent(formData.ip);
      xhr.send(params);
    }
  };

  reader.readAsDataURL(file);
});


function upload(event) {
  event.preventDefault();

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
      username: localStorage.getItem('username'),
      usericon: localStorage.getItem('usericon'),
      title: "none",
      caption: document.getElementById('caption').value,
      image: document.getElementById('image').value,
      ip: ip
    };

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
      document.getElementById('responseMessage').innerText = data.message;
    })
    .catch(error => {
      console.error('Error:', error);
      window.location.href = 'index.html';
    });
  }
}

document.getElementById('postForm').addEventListener('submit', upload);
