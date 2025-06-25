// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Firebase設定
firebase.initializeApp({
    apiKey: "AIzaSyAY6JbrW49cLXmzK3u3Xn4-slwyHE2nm9U",
    authDomain: "onareal-38cad.firebaseapp.com",
    projectId: "onareal-38cad",
    storageBucket: "onareal-38cad.firebasestorage.app",
    messagingSenderId: "602584094482",
    appId: "1:602584094482:web:807792afcd1302770d05cb",
    measurementId: "G-E4Q6DPEPBJ"
});

const messaging = firebase.messaging();

// 重複通知防止用
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 2000;

// バックグラウンド通知の処理
messaging.onBackgroundMessage((payload) => {
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        return;
    }
    lastNotificationTime = now;
    
    const notificationTitle = payload.notification?.title || 'OnaReal通知';
    const notificationOptions = {
        body: payload.notification?.body || '新しい通知があります',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        tag: 'onareal-background-notification',
        requireInteraction: false,
        silent: false
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/index.html')
    );
});


self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});