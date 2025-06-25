// Google Apps Script for OnaReal PWA
const SPREADSHEET_ID = '1elBDfCFt3Vn2Iyaj_GDFPT187JTJ6mqofJowJWnJges';
const SHEET_NAME = 'onareal-posts';
const CLOUDFLARE_WORKER_URL = 'https://proxy-onareal.s-salmon.net';

function testAddToken() {
  const fcmSheet = SpreadsheetApp.openById('1elBDfCFt3Vn2Iyaj_GDFPT187JTJ6mqofJowJWnJges').getSheetByName('fcm_tokens');
  fcmSheet.appendRow([new Date().toISOString(), '', 'TEST_TOKEN']);
}

function testGlobalNotification() {
  const data = { title: 'Test', body: 'Test notification', timestamp: new Date().toISOString() };
  handleSendGlobalNotification(data);
}

function testServiceAccount() {
  const json = PropertiesService.getScriptProperties().getProperty('SERVICE_ACCOUNT_JSON');
  console.log('Project ID:', JSON.parse(json).project_id);
}

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) throw new Error('スプレッドシートが見つかりません。IDを確認してください。');
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`シート "${SHEET_NAME}" が見つかりません。`);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const posts = data.slice(1).map(row => {
      const post = {};
      headers.forEach((header, index) => post[header] = row[index]);
      return post;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, posts }))
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
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) throw new Error('スプレッドシートが見つかりません。');
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`シート "${SHEET_NAME}"`);
    
    switch (action) {
      case 'upload':
        return handleUpload(sheet, data);
      case 'delete':
        return handleDelete(sheet, data);
      case 'saveFCMToken':
        return handleSaveFCMToken(sheet, data);
      case 'sendGlobalNotification':
      case 'sendNotification': // クライアントの旧エンドポイント対応
        return handleSendGlobalNotification(data);
      case 'sendUserNotification':
        return handleSendUserNotification(data);
      default:
        throw new Error(`Invalid action: ${action}`);
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
    const correctPassword = 'admin123'; // 本番では安全な認証を使用
    if (password !== correctPassword) throw new Error('パスワードが正しくありません');
    
    if (rowNumber && rowNumber > 1) {
      sheet.deleteRow(rowNumber);
    } else {
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
    if (!token) throw new Error('トークンが必要です');
    
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens') || 
                     SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('fcm_tokens');
    
    const dataRows = fcmSheet.getDataRange().getValues();
    for (let i = dataRows.length - 1; i >= 1; i--) {
      if (dataRows[i][2] === token || (userId && dataRows[i][1] === userId)) {
        fcmSheet.deleteRow(i + 1);
      }
    }
    
    fcmSheet.appendRow([timestamp || new Date().toISOString(), userId || '', token]);
    
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

function getServiceAccount() {
  const json = PropertiesService.getScriptProperties().getProperty('SERVICE_ACCOUNT_JSON');
  if (!json) {
    throw new Error('SERVICE_ACCOUNT_JSONがスクリプトプロパティに設定されていません。');
  }
  try {
    const serviceAccount = JSON.parse(json);
    if (!serviceAccount.project_id) {
      throw new Error('サービスアカウントJSONにproject_idが含まれていません。');
    }
    return serviceAccount;
  } catch (e) {
    throw new Error(`サービスアカウントJSONのパースに失敗: ${e.message}`);
  }
}

function createJWT_(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
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
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const accessToken = getAccessToken_();
  const message = {
    message: {
      token,
      notification: { title, body },
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
    headers: { Authorization: `Bearer ${accessToken}` },
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.error && result.error.status === 'NOT_FOUND') {
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (fcmSheet) {
      const data = fcmSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][2] === token) {
          fcmSheet.deleteRow(i + 1);
          break;
        }
      }
    }
  }
  
  return result;
}

function handleSendGlobalNotification(data) {
  try {
    const { title, body, imageUrl, tag, messageId, timestamp } = data;
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) throw new Error('FCMトークンシートが見つかりません');
    const tokens = fcmSheet.getDataRange().getValues().slice(1).map(row => row[2]);
    if (tokens.length === 0) throw new Error('FCMトークンが登録されていません');
    
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
        results
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

/**
 * ユーザー固有の通知を送信。不要な場合はこの関数とdoPostの'sendUserNotification'ケースを削除。
 * 削除前に、クライアント側（global-notification.js）でsendUserNotificationが使用されていないことを確認。
 */
function handleSendUserNotification(data) {
  try {
    const { userId, title, body, imageUrl, tag, messageId, timestamp } = data;
    if (!userId) throw new Error('userIdが必要です');
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) throw new Error('FCMトークンシートが見つかりません');
    const dataRows = fcmSheet.getDataRange().getValues();
    const userTokens = dataRows.slice(1).filter(row => row[1] === userId).map(row => row[2]);
    if (userTokens.length === 0) throw new Error('ユーザーのFCMトークンが見つかりません');
    
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
        results
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

function cleanOldTokens() {
  try {
    const fcmSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('fcm_tokens');
    if (!fcmSheet) return;
    const data = fcmSheet.getDataRange().getValues();
    const now = new Date();
    const threshold = 30 * 24 * 60 * 60 * 1000; // 30日
    for (let i = data.length - 1; i >= 1; i--) {
      const timestamp = new Date(data[i][0]);
      if (now - timestamp > threshold) {
        fcmSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    console.error('Clean old tokens error:', error);
  }
}