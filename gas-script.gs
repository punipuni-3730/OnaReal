// Google Apps Script for OnaReal PWA
// スプレッドシートのIDを設定してください
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ここに実際のスプレッドシートIDを入力
const SHEET_NAME = 'posts'; // シート名

// Cloudflare Worker URL
const CLOUDFLARE_WORKER_URL = 'https://proxy-onareal.s-salmon.net';

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

// ================= FCM HTTP v1 API 直接送信ユーティリティ =================
// サービスアカウントJSONはGASのプロパティストア（ScriptProperties）に保存しておくこと
// 例: PropertiesService.getScriptProperties().setProperty('SERVICE_ACCOUNT_JSON', '{...}')

function getServiceAccount() {
  return JSON.parse(PropertiesService.getScriptProperties().getProperty('SERVICE_ACCOUNT_JSON'));
}

function createJWT_(serviceAccount) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const encode = obj => Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, '');
  const toSign = encode(header) + '.' + encode(payload);
  const signature = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(toSign, serviceAccount.private_key)).replace(/=+$/, '');
  return toSign + '.' + signature;
}

function getAccessToken_() {
  const serviceAccount = getServiceAccount();
  const jwt = createJWT_(serviceAccount);
  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }
  };
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', options);
  const result = JSON.parse(response.getContentText());
  return result.access_token;
}

function sendFCMNotificationV1(token, title, body, imageUrl, tag, messageId) {
  const serviceAccount = getServiceAccount();
  const projectId = serviceAccount.project_id;
  const url = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';
  const accessToken = getAccessToken_();
  const message = {
    message: {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: {
        imageUrl: imageUrl || '',
        tag: tag || '',
        messageId: messageId || ''
      }
    }
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function handleSendGlobalNotification(data) {
  try {
    const { title, body, imageUrl, tag, messageId, timestamp } = data;
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) {
      throw new Error('FCMトークンシートが見つかりません');
    }
    const tokens = fcmSheet.getDataRange().getValues().slice(1).map(row => row[2]);
    if (tokens.length === 0) {
      throw new Error('FCMトークンが登録されていません');
    }
    // v1 APIで直接送信
    const results = tokens.map(token => {
      try {
        const res = sendFCMNotificationV1(token, title, body, imageUrl, tag, messageId);
        return { token, success: !res.error, messageId: res.name || messageId, error: res.error };
      } catch (e) {
        return { token, success: false, error: e.message };
      }
    });
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
    const { userId, title, body, imageUrl, tag, messageId, timestamp } = data;
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) {
      throw new Error('FCMトークンシートが見つかりません');
    }
    const dataRows = fcmSheet.getDataRange().getValues();
    const userTokens = dataRows.slice(1).filter(row => row[1] === userId).map(row => row[2]);
    if (userTokens.length === 0) {
      throw new Error('ユーザーのFCMトークンが見つかりません');
    }
    const results = userTokens.map(token => {
      try {
        const res = sendFCMNotificationV1(token, title, body, imageUrl, tag, messageId);
        return { token, success: !res.error, messageId: res.name || messageId, error: res.error };
      } catch (e) {
        return { token, success: false, error: e.message };
      }
    });
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