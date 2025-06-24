// 通知機能
class NotificationManager {
  constructor() {
    this.notificationPermission = false;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 3000; // 3秒間のクールダウン
    this.init();
  }

  // 初期化
  async init() {
    if ('Notification' in window) {
      // iOSデバイスの検出
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.navigator.standalone === true;
      
      // iOSの場合、PWAとしてインストールされているかチェック
      if (isIOS && !isStandalone) {
        console.log('iOS Safari: PWAとしてインストールする必要があります');
        this.notificationPermission = false;
        return;
      }
      
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission === 'granted';
    }
  }

  // 通知を送信（重複防止付き）
  sendNotification(title, options = {}) {
    if (!this.notificationPermission) {
      return;
    }

    // クールダウンチェック
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return;
    }
    this.lastNotificationTime = now;

    const defaultOptions = {
      body: '新しい投稿の時間です！',
      icon: 'images/icon-192x192.png',
      badge: 'images/icon-192x192.png',
      tag: 'onareal-notification',
      requireInteraction: false,
      silent: false
    };

    const notification = new Notification(title, { ...defaultOptions, ...options });

    // 通知クリック時の処理
    notification.onclick = function(event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };

    // 5秒後に自動で閉じる
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // BeReal風の通知
  sendBeRealNotification() {
    return this.sendNotification('BeRealの時間です！', {
      body: '今の瞬間を共有しましょう 📸',
      icon: 'images/icon-192x192.png'
    });
  }

  // カスタム通知
  sendCustomNotification(title, message) {
    return this.sendNotification(title, {
      body: message,
       icon: 'images/icon-192x192.png'
    });
  }

  // 管理者からの通知
  sendAdminNotification(message) {
    return this.sendNotification('OnaRealからのお知らせ', {
      body: message,
      icon: 'images/icon-192x192.png'
    });
  }

  // 投稿完了通知
  sendPostCompleteNotification() {
    return this.sendNotification('投稿完了！', {
      body: '投稿が正常に完了しました 🎉',
      icon: 'images/icon-192x192.png'
    });
  }

  // 定期的な通知を設定
  scheduleNotification(hour, minute) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // 今日の時間が過ぎている場合は明日に設定
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.sendBeRealNotification();
      // 24時間後に再度スケジュール
      this.scheduleNotification(hour, minute);
    }, timeUntilNotification);
  }

  // 指定時間後に通知を送信
  scheduleNotificationAfter(minutes) {
    setTimeout(() => {
      this.sendBeRealNotification();
    }, minutes * 60 * 1000);
  }

  // 通知許可状態を確認
  checkPermission() {
    return this.notificationPermission;
  }

  // 通知許可を再要求
  async requestPermission() {
    if ('Notification' in window) {
      // iOSデバイスの検出
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.navigator.standalone === true;
      
      // iOSの場合、PWAとしてインストールされているかチェック
      if (isIOS && !isStandalone) {
        alert('iOS Safariでは、ホーム画面に追加してから通知の許可を求めてください。');
        return false;
      }
      
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission === 'granted';
      return this.notificationPermission;
    }
    return false;
  }
}

// 通知マネージャーのインスタンスを作成
const notificationManager = new NotificationManager();

// ページ読み込み時に通知機能を初期化
document.addEventListener('DOMContentLoaded', function() {
  // 通知コントロールパネルを作成（開発時のみ）
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    createNotificationPanel();
  }
});

// 通知コントロールパネルを作成（開発用）
function createNotificationPanel() {
  const panel = document.createElement('div');
  panel.id = 'notification-panel';
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 15px;
    border-radius: 10px;
    font-size: 14px;
    z-index: 1000;
    display: none;
  `;

  panel.innerHTML = `
    <h3 style="margin:0 0 10px 0;">通知コントロール</h3>
    <button onclick="notificationManager.sendBeRealNotification()" style="margin:2px; padding:5px 10px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">BeReal通知</button>
    <button onclick="notificationManager.sendCustomNotification('テスト通知', 'これはテスト通知です')" style="margin:2px; padding:5px 10px; background:#28a745; color:white; border:none; border-radius:5px; cursor:pointer;">テスト通知</button>
    <button onclick="notificationManager.scheduleNotificationAfter(1)" style="margin:2px; padding:5px 10px; background:#ffc107; color:black; border:none; border-radius:5px; cursor:pointer;">1分後に通知</button>
    <button onclick="notificationManager.scheduleNotificationAfter(5)" style="margin:2px; padding:5px 10px; background:#fd7e14; color:white; border:none; border-radius:5px; cursor:pointer;">5分後に通知</button>
    <br><br>
    <button onclick="toggleNotificationPanel()" style="margin:2px; padding:5px 10px; background:#6c757d; color:white; border:none; border-radius:5px; cursor:pointer;">閉じる</button>
  `;

  document.body.appendChild(panel);
}

// 通知パネルの表示/非表示を切り替え
function toggleNotificationPanel() {
  const panel = document.getElementById('notification-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

// 開発者ツールから呼び出し可能にする
window.toggleNotificationPanel = toggleNotificationPanel;

// サービスワーカーでの通知処理（PWA対応）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data.type === 'NOTIFICATION') {
      notificationManager.sendBeRealNotification();
    }
  });
}

// グローバル関数として公開
window.sendBeRealNotification = () => notificationManager.sendBeRealNotification();
window.sendCustomNotification = (title, message) => notificationManager.sendCustomNotification(title, message);
window.scheduleNotificationAfter = (minutes) => notificationManager.scheduleNotificationAfter(minutes); 