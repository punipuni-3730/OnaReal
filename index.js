// ソート設定が変更されたら、投稿を再読み込みする
document.getElementById('sortselect').addEventListener('change', function() {
    load();
});

// 投稿を読み込む
window.onload = load();
