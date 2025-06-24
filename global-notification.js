// 全世界のOnaRealユーザーに通知を送る機能
class GlobalNotificationManager {
  constructor() {
    this.isInitialized = false;
    this.notificationToken = null;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 1000; // 1秒間のクールダウン
    this.sentMessageIds = new Set();
    this.maxStoredIds = 100; // 最大100個のIDを保存
  }

  // 初期化
  async initialize() {
    if (this.isInitialized) return;
    
    try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // サービスワーカー登録
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            
            // サービスワーカーがアクティブになるまで待機
            if (!registration.active) {
                console.log('Waiting for Service Worker to activate...');
                await new Promise((resolve) => {
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated') {
                                console.log('Service Worker activated');
                                resolve();
                            }
                        });
                    });
                });
            } else {
                console.log('Service Worker already active');
            }
            
            if (typeof firebase !== 'undefined' && firebase.messaging) {
                const messaging = firebase.messaging();
                
                // フォアグラウンド通知の処理
                messaging.onMessage((payload) => {
                    this.handleForegroundNotification(payload);
                });
                
                // トークンの取得と保存
                try {
                    const token = await messaging.getToken({
                        vapidKey: 'BOe0RKrpOJvi4kOcs0foUvKqzZQmPW3c9E8SZcMzYnQ3emZAR9PgPZceooIyZshLImnBPL0p58JhKmDJBKjnP3g',
                        serviceWorkerRegistration: registration
                    });
                    if (token) {
                        this.notificationToken = token;
                        await this.saveTokenToServer(token);
                        console.log('FCM Token obtained:', token);
                    }
                } catch (error) {
                    console.error('通知トークンの取得に失敗:', error);
                }
            } else {
                console.error('Firebase Messaging is not available');
            }
        } else {
            console.warn('Service Worker or PushManager not supported');
        }
        
        this.isInitialized = true;
    } catch (error) {
        console.error('グローバル通知の初期化に失敗:', error);
    }
}

  // フォアグラウンド通知の処理
  handleForegroundNotification(payload) {
    const messageId = payload.data?.messageId || payload.messageId || Date.now().toString();
    
    // 重複チェック
    if (this.sentMessageIds.has(messageId)) {
      return;
    }
    
    // クールダウンチェック
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return;
    }
    
    this.lastNotificationTime = now;
    this.sentMessageIds.add(messageId);
    
    // 古いIDを削除（メモリリーク防止）
    if (this.sentMessageIds.size > this.maxStoredIds) {
      const idsArray = Array.from(this.sentMessageIds);
      this.sentMessageIds.clear();
      idsArray.slice(-this.maxStoredIds).forEach(id => this.sentMessageIds.add(id));
    }
    
    // 通知の表示
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(payload.notification?.title || 'OnaReal', {
        body: payload.notification?.body || payload.data?.body || '新しい通知があります',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        tag: 'onareal-notification',
        requireInteraction: false,
        silent: false
      });
      
      // 通知クリック時の処理
      notification.onclick = function() {
        window.focus();
        notification.close();
      };
      
      // 5秒後に自動で閉じる
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // バックグラウンド通知の処理
  handleBackgroundNotification(payload) {
    // バックグラウンドでは自動的に通知が表示される
    // 追加の処理が必要な場合はここに記述
  }

  // トークンをサーバーに保存
  async saveTokenToServer(token) {
    try {
      const response = await fetch('https://proxy-onareal.s-salmon.net/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveNotificationToken',
          token: token,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.warn('通知トークンの保存に失敗:', error);
    }
  }

  // グローバル通知を送信
  async sendGlobalNotification(message, title = 'OnaReal') {
    try {
      const response = await fetch('https://proxy-onareal.s-salmon.net/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          body: message,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('グローバル通知の送信に失敗:', error);
      throw error;
    }
  }

  // テスト通知を送信
  async sendTestNotification() {
    try {
      const result = await this.sendGlobalNotification('これはテスト通知です。', 'テスト通知');
      return result;
    } catch (error) {
      console.error('テスト通知の送信に失敗:', error);
      throw error;
    }
  }

  // 管理者用：全ユーザーに通知を送信
  async sendGlobalNotificationToAll(title, body, imageUrl = null) {
    try {
      console.log('グローバル通知送信開始:', { title, body, imageUrl });
      
      // パラメータの検証
      if (!title || !body) {
        console.error('通知のタイトルまたは本文が空です');
        return false;
      }
      
      const requestBody = {
        title: title,
        body: body,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString()
      };
      
      console.log('送信するデータ:', requestBody);
      
      const response = await fetch('https://proxy-onareal.s-salmon.net/send-global-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('通知送信レスポンス:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('グローバル通知送信成功:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('グローバル通知送信エラー:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('グローバル通知送信エラー（詳細）:', error);
      console.error('エラースタック:', error.stack);
      return false;
    }
  }

  // 管理者用：特定のユーザーに通知を送信
  async sendUserNotification(userId, title, body, imageUrl = null) {
    try {
      const response = await fetch('https://proxy-onareal.s-salmon.net/send-user-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: title,
          body: body,
          imageUrl: imageUrl,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log(`ユーザー ${userId} に通知を送信しました`);
        return true;
      } else {
        console.error('ユーザー通知送信エラー');
        return false;
      }
    } catch (error) {
      console.error('ユーザー通知送信エラー:', error);
      return false;
    }
  }
}

// グローバルインスタンスを作成
const globalNotificationManager = new GlobalNotificationManager();

// windowオブジェクトに公開（PWAインストール後の通知許可要求で使用）
window.globalNotificationManager = globalNotificationManager;

// FCMトークン取得用のグローバル関数を追加
window.getFCMToken = async function() {
  if (window.globalNotificationManager && typeof window.globalNotificationManager.initialize === 'function') {
    // initialize()はトークン取得も行うので、再実行でOK
    await window.globalNotificationManager.initialize();
    if (window.globalNotificationManager.notificationToken) {
      console.log('FCMトークン:', window.globalNotificationManager.notificationToken);
      return window.globalNotificationManager.notificationToken;
    } else {
      alert('FCMトークンの取得に失敗しました。通知設定やネットワークをご確認ください。');
      return null;
    }
  } else {
    alert('通知機能が利用できません。');
    return null;
  }
};