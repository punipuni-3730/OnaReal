const GoogleAppScriptURLPhoto = 'https://script.google.com/macros/s/AKfycbwYDmrRf3k9Pz10NUq8RXVfumARY-WmzbJ_9iXzPDVHJ7SZr4o4bK2VKrVFmI_J0F7g/exec';
const GoogleAppScriptURL = 'https://script.google.com/macros/s/AKfycbw8CNhv4GkdZ3MILCw6UHshiP558uRghU1Vs6Op8zb-zOSQbEZndESL_WUzGh5Z5gOQ9Q/exec';
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
        file: base64data
      };

      var xhr = new XMLHttpRequest();
      xhr.open('POST', GoogleAppScriptURLPhoto, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

      xhr.onload = function() {
        if (xhr.status == 200) {
          var response = JSON.parse(xhr.responseText);
          if (response.result === 'Completed') {
            const id = response.url.match(/[-\w]{25,}/)[0];
            document.getElementById('usericon').value = `https://lh3.googleusercontent.com/d/${id}`;
            alert('Upload successful!');
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
                   '&file=' + encodeURIComponent(formData.file);
      xhr.send(params);
    }
  };

  reader.readAsDataURL(file);
});




      

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


