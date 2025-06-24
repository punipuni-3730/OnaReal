// Google Apps Script for OnaReal PWA
// スプレッドシートのIDを設定してください
const SPREADSHEET_ID = '1elBDfCFt3Vn2Iyaj_GDFPT187JTJ6mqofJowJWnJges'; // ここに実際のスプレッドシートIDを入力
const SHEET_NAME = 'onareal-posts'; // シート名

// Firebase Admin SDK設定
const FIREBASE_PROJECT_ID = 'onareal-38cad'; // Firebase Consoleから取得
const FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCsTDH3/db0MCrS\nKuhg7QqyZ7Ta5SkrCU5dqTELnnAV//NYqlDjX35nuKS4oQUI6PopIVo9tFzxBpW1\n/RR4aKZNZsfYrclbT7CHTczfZfqIMl38p4DbLdOjcnK0uClv3cN7amYrDIUZkxfA\na0kwR55mTewbGmzgUqY/PUPF786/xjcoTcrdCNQjhqSZNyLckaQvfyme0cKLpT4K\nGC9pfQnglqG+QojGj51xkvLa4xr6AKXzj4wM9+5vOa0VOMUZs9KCN0yZp1ZYa+IA\n/wT819lxajjY+1uJHscYmBW6df+MPu3PKVlpM2uiA1RUijirf/1cXUmlkTZ3+onY\nhTdQO4tZAgMBAAECgf8dyA3bD8VX7/t22HPSTSbML6DTNUkoZzNkfRo9J+W358Xo\nTYgtxRPUWdYfE7YLFDopYdp3T/XAs6KtElG3fl9AgcOJcICdh+i7encvJjFn2Uzl\nnw5m1EUAu4eYNTz0WSCw9HM0fbWD9ijk2aaM8dQvWsi05pxrKd4SkERmskzKWO/X\nG+PnDu2w8S+VsnjARhD4MEA5wV7xuUGqeRPQ9Symc9akFzkXvIETckyuYQUjdE4c\nCjMu9aumWbU4eejQy416qIpDz/S3UOkn3+jJTt3ol0uXb/toBXHM4GaLuG+5BKnH\nJr+bNKwvgFKPgMKxzOMdQP0ta0UoX369MzQmRiECgYEA4+FPb4S4Grl/YlCjvUXX\nnX/XTZrpPJNSD2xHlglwIN6S5UI/CrORuh2EDywUQ7cEPIIkq/uHXqf1Juc68dlL\nGizNj50+bBSW+TUHR35hV0E/yH2F0zlCG2GF/Jn2zYNofH5lRM16FiUzUG+nadIs\nIkewGyxiMg3ijCAhtyxOUUkCgYEAwY8LfIs8AbvFcGkSWN8R3Mg3N6GFnWclL0Fe\nYL3bygK6CgucJMl20Zyo659P2JtcMhz7KfxEkgmte6T4u95SV0oRZqZ74t52Kgtm\nux2/Yo/eDPNsbbxRPWFTd5ZlQ7gbFHvIREr+lzN9hyb6+/0iNT9AHBGUkEOpL7F5\nhsvUeZECgYAURmyx6GYVAqIh1jjrUzZ+7evzHLBZ0mW/t4ua/tX6JrN9MGq5ggaa\nP5wLWYmoCLWYyJ+IqcV+l4UJZBNrh0DWYFwdxgjSxvYz0BMIumbgw45wQTLR+0s1\ncnTgZ7Z8zI9UXE6YU4vkQoURSA3mLWv91NEHaeiGuZOJkiZNzORe+QKBgQCdrvj+\nlzdleiEYuKB3whJ9OKazLWT6nCLQ4oIOcd1yLtJ8iITF+1JO5T8/5ONZZQew06dR\nxu/dwQCRsA3qju2pqu+OHqbiZbUB/5PLcCqQEwAksNJue3H7fSRQUjdg+cUl5Ml7\nyVSqvQnQZtMlIk0R79s8gp3zAQv9jKmiRL9t4QKBgHendaKrmo/6gD4WBVI5c9jn\naC7b5/K1x3kUu7KQ5zCGiZB3wZEyTrLaKRP5GklLrA9Zv8JtAqQfQ0ARvERftUE8\nAtr3TT4QbsS6faJiEXo0RnUFUOyEqFCWTrEzpjpTyktsyvANhMIBY6IMlI0jxNbs\nCMCMEybIPS6yEsXfbb7c\n-----END PRIVATE KEY-----\n'; // サービスアカウントキーから取得
const FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@onareal-38cad.iam.gserviceaccount.com'; // サービスアカウントキーから取得

function doGet(e) {
  try {
    // スプレッドシートにアクセス
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) {
      throw new Error('スプレッドシートが見つかりません。IDを確認してください。');
    }
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`シート "${SHEET_NAME}" が見つかりません。`);
    }
    
    // 投稿データを取得
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const posts = data.slice(1).map(row => {
      const post = {};
      headers.forEach((header, index) => {
        post[header] = row[index];
      });
      return post;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, posts: posts }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doGet error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'データ取得に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // リクエストデータを解析
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // スプレッドシートにアクセス
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) {
      throw new Error('スプレッドシートが見つかりません。IDを確認してください。');
    }
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`シート "${SHEET_NAME}" が見つかりません。`);
    }
    
    // アクションに応じて処理
    switch (action) {
      case 'upload':
        return handleUpload(sheet, data);
      case 'delete':
        return handleDelete(sheet, data);
      case 'saveFCMToken':
        return handleSaveFCMToken(sheet, data);
      case 'sendGlobalNotification':
        return handleSendGlobalNotification(data);
      case 'sendUserNotification':
        return handleSendUserNotification(data);
      default:
        throw new Error(`不明なアクション: ${action}`);
    }
    
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'リクエスト処理に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleUpload(sheet, data) {
  try {
    const { filename, file, username, caption, timestamp } = data;
    
    // 新しい投稿を追加
    const newRow = [timestamp, username, caption, filename, file];
    sheet.appendRow(newRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '投稿が正常に保存されました' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Upload error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: '投稿の保存に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleDelete(sheet, data) {
  try {
    const { rowNumber, password, username, caption } = data;
    
    // パスワード認証（簡易版）
    const correctPassword = 'admin123'; // 実際の運用では安全な方法を使用
    if (password !== correctPassword) {
      throw new Error('パスワードが正しくありません');
    }
    
    // 指定された行を削除
    if (rowNumber && rowNumber > 1) {
      sheet.deleteRow(rowNumber);
    } else {
      // ユーザー名とキャプションで検索して削除
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][1] === username && data[i][2] === caption) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '投稿が正常に削除されました' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Delete error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: '投稿の削除に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSaveFCMToken(sheet, data) {
  try {
    const { token, userId, timestamp } = data;
    
    // FCMトークンを保存（別シートまたは同じシートに追加）
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens') || 
                     SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('fcm_tokens');
    
    fcmSheet.appendRow([timestamp, userId, token]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'FCMトークンが正常に保存されました' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('FCM Token save error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'FCMトークンの保存に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSendGlobalNotification(data) {
  try {
    const { title, body, imageUrl, timestamp } = data;
    
    // FCMトークンを取得
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) {
      throw new Error('FCMトークンシートが見つかりません');
    }
    
    const tokens = fcmSheet.getDataRange().getValues().slice(1).map(row => row[2]);
    
    // 全ユーザーに通知を送信
    const results = sendFCMNotification(tokens, title, body, imageUrl);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'グローバル通知が送信されました',
        results: results
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Global notification error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'グローバル通知の送信に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSendUserNotification(data) {
  try {
    const { userId, title, body, imageUrl, timestamp } = data;
    
    // 特定ユーザーのFCMトークンを取得
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) {
      throw new Error('FCMトークンシートが見つかりません');
    }
    
    const data = fcmSheet.getDataRange().getValues();
    const userTokens = data.slice(1)
      .filter(row => row[1] === userId)
      .map(row => row[2]);
    
    if (userTokens.length === 0) {
      throw new Error('ユーザーのFCMトークンが見つかりません');
    }
    
    // ユーザーに通知を送信
    const results = sendFCMNotification(userTokens, title, body, imageUrl);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'ユーザー通知が送信されました',
        results: results
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('User notification error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'ユーザー通知の送信に失敗しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Firebase Admin SDKを使用したFCM通知送信
function sendFCMNotification(tokens, title, body, imageUrl) {
  const results = [];
  
  tokens.forEach(token => {
    try {
      // Firebase Admin SDKを使用して通知を送信
      const result = sendFirebaseNotification(token, title, body, imageUrl);
      results.push({
        token: token,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      
    } catch (error) {
      results.push({
        token: token,
        success: false,
        error: error.message
      });
    }
  });
  
  return results;
}

// Firebase Admin SDKを使用した単一通知送信
function sendFirebaseNotification(token, title, body, imageUrl) {
  try {
    // Firebase Admin SDKの認証トークンを取得
    const accessToken = getFirebaseAccessToken();
    
    // FCM v1 APIを使用
    const FCM_URL = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
    
    const message = {
      message: {
        token: token,
        notification: {
          title: title,
          body: body
        },
        webpush: {
          notification: {
            icon: imageUrl || '/images/icon-192x192.png',
            badge: '/images/icon-192x192.png',
            click_action: '/'
          }
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(message)
    };
    
    const response = UrlFetchApp.fetch(FCM_URL, options);
    const result = JSON.parse(response.getContentText());
    
    return {
      success: true,
      messageId: result.name
    };
    
  } catch (error) {
    console.error('Firebase notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Firebase Admin SDKのアクセストークンを取得
function getFirebaseAccessToken() {
  try {
    // JWTトークンを生成
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const payload = {
      iss: FIREBASE_CLIENT_EMAIL,
      sub: FIREBASE_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    };
    
    // JWTトークンを生成（Base64URLエンコード）
    const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
    const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // 署名を生成（RS256）
    const signature = Utilities.computeRsaSha256Signature(signatureInput, FIREBASE_PRIVATE_KEY);
    const encodedSignature = Utilities.base64EncodeWebSafe(signature);
    
    const jwt = `${signatureInput}.${encodedSignature}`;
    
    // Google OAuth2トークンエンドポイントからアクセストークンを取得
    const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      }
    });
    
    const tokenData = JSON.parse(tokenResponse.getContentText());
    return tokenData.access_token;
    
  } catch (error) {
    console.error('Firebase access token error:', error);
    throw new Error('Firebase認証トークンの取得に失敗しました');
  }
}