// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyAY6JbrW49cLXmzK3u3Xn4-slwyHE2nm9U",
    authDomain: "onareal-38cad.firebaseapp.com",
    projectId: "onareal-38cad",
    storageBucket: "onareal-38cad.firebasestorage.app",
    messagingSenderId: "602584094482",
    appId: "1:602584094482:web:807792afcd1302770d05cb",
    measurementId: "G-E4Q6DPEPBJ"
};

// Firebase初期化
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} 