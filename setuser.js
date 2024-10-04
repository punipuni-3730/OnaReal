document.addEventListener('DOMContentLoaded', function() {
    if(localStorage.getItem('state') == '1'){
      window.location.href = 'index.html';
    }    
  });

function setuser(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

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

// Attach the event listener to the form
document.getElementById('setuser').addEventListener('submit', setuser);
