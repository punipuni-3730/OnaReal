// Firebase SDK のインポート（モジュール形式の場合、環境に応じて調整）
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, onTokenRefresh } from 'firebase/messaging';

// Firebase 設定（Firebase コンソールから取得）
const firebaseConfig = {
  apiKey: "AIzaSyAY6JbrW49cLXmzK3u3Xn4-slwyHE2nm9U",
  authDomain: "onareal-38cad.firebaseapp.com",
  projectId: "onareal-38cad",
  storageBucket: "onareal-38cad.firebasestorage.app",
  messagingSenderId: "602584094482",
  appId: "1:602584094482:web:807792afcd1302770d05cb",
  measurementId: "G-E4Q6DPEPBJ"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

class GlobalNotificationManager {
  constructor() {
    this.isInitialized = false;
    this.notificationToken = null;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 1000;
    this.sentMessageIds = new Set();
    this.maxStoredIds = 100;
  }

  async initialize() {
    if (this.isInitialized) return;
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // サービスワーカー登録
        const registration = await navigator.serviceWorker.register('/OnaReal/firebase-messaging-sw.js');
        
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

        // 通知許可をリクエスト
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('通知許可が拒否されました');
            return;
          }
        }

        // フォアグラウンド通知の処理
        onMessage(messaging, (payload) => {
          this.handleForegroundNotification(payload);
        });

        // トークン更新の検知
        onTokenRefresh(messaging, () => {
          getToken(messaging, {
            vapidKey: 'BOe0RKrpOJvi4kOcs0foUvKqzZQmPW3c9E8SZcMzYnQ3emZAR9PgPZceooIyZshLImnBPL0p58JhKmDJBKjnP3g',
            serviceWorkerRegistration: registration
          }).then((newToken) => {
            if (newToken) {
              this.notificationToken = newToken;
              this.saveTokenToServer(newToken);
              console.log('FCM Token refreshed:', newToken);
            }
          }).catch((error) => {
            console.error('トークン更新エラー:', error);
          });
        });

        // トークンの取得と保存
        try {
          const token = await getToken(messaging, {
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
        console.warn('Service Worker or PushManager not supported');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('グローバル通知の初期化に失敗:', error);
    }
  }

  handleForegroundNotification(payload) {
    const tag = payload.notification?.tag || payload.data?.tag || 'onareal-global';
    const messageId = payload.data?.messageId || payload.messageId || tag;

    if (this.sentMessageIds.has(messageId)) return;

    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) return;

    this.lastNotificationTime = now;
    this.sentMessageIds.add(messageId);

    if (this.sentMessageIds.size > this.maxStoredIds) {
      const idsArray = Array.from(this.sentMessageIds);
      this.sentMessageIds.clear();
      idsArray.slice(-this.maxStoredIds).forEach(id => this.sentMessageIds.add(id));
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(payload.notification?.title || 'OnaReal', {
        body: payload.notification?.body || payload.data?.body || '新しい通知があります',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        tag: tag,
        requireInteraction: false,
        silent: false
      });
      notification.onclick = function() {
        window.focus();
        notification.close();
      };
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  handleBackgroundNotification(payload) {
    // バックグラウンド通知の追加処理（必要に応じて）
  }

  async saveTokenToServer(token) {
    try {
      const userId = /* 認証システムから取得、例：firebase.auth().currentUser?.uid */ '';
      const response = await fetch('https://proxy-onareal.s-salmon.net/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveFCMToken', // サーバー側のアクション名と一致
          token,
          userId: userId || '',
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('トークン保存成功:', token);
    } catch (error) {
      console.warn('通知トークンの保存に失敗:', error);
    }
  }

  async sendGlobalNotification(message, title = 'OnaReal') {
    try {
      const response = await fetch('https://proxy-onareal.s-salmon.net/send-global-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: message,
          timestamp: new Date().toISOString()
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

  async sendTestNotification() {
    try {
      const result = await this.sendGlobalNotification('これはテスト通知です。', 'テスト通知');
      return result;
    } catch (error) {
      console.error('テスト通知の送信に失敗:', error);
      throw error;
    }
  }

  async sendGlobalNotificationToAll(title, body, imageUrl = null) {
    try {
      if (!title || !body) {
        console.error('通知のタイトルまたは本文が空です');
        return false;
      }
      const response = await fetch('https://proxy-onareal.s-salmon.net/send-global-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          imageUrl,
          timestamp: new Date().toISOString()
        })
      });
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
      console.error('グローバル通知送信エラー:', error);
      return false;
    }
  }

  async sendUserNotification(userId, title, body, imageUrl = null) {
    try {
      if (!userId) throw new Error('userIdが必要です');
      const response = await fetch('https://proxy-onareal.s-salmon.net/send-user-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          body,
          imageUrl,
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

const globalNotificationManager = new GlobalNotificationManager();
window.globalNotificationManager = globalNotificationManager;

window.getFCMToken = async function() {
  try {
    await globalNotificationManager.initialize();
    if (globalNotificationManager.notificationToken) {
      console.log('FCMトークン:', globalNotificationManager.notificationToken);
      return globalNotificationManager.notificationToken;
    } else {
      alert('FCMトークンの取得に失敗しました。通知設定やネットワークをご確認ください。');
      return null;
    }
  } catch (error) {
    alert('通知機能が利用できません。');
    return null;
  }
};