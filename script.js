function load() {// Get リクエスト
fetch('https://script.google.com/macros/s/AKfycbwZavp1hy4ZXcqDGd5Pqg_mJo-X8MIjzd3RAYE094t0tSgc1gWHl_w9pRC6WyXeiq2_Lg/exec')
.then(response => response.json())
.then(data => {
  let main = document.getElementById('main');
  for (var i = 0; i < data.length; i++){
  main.insertAdjacentHTML('beforeend',`
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
         	<p>${data[i].captions}</p>
         </div>
</div>
`)}})};