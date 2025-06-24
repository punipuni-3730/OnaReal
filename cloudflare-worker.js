addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url)
    const path = url.pathname
  
    // デバッグログを追加
    console.log('Request path:', path)
    console.log('Request method:', request.method)
    console.log('Full URL:', request.url)
  
    // OPTIONSリクエスト（CORS preflight）の処理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      })
    }
  
    try {
      if (path === '/delete') {
        console.log('Routing to handleDelete')
        return await handleDelete(request)
      }
  
      if (path === '/upload') {
        console.log('Routing to handleUpload')
        return await handleUpload(request)
      }
  
      if (path === '/fcm-token') {
        console.log('Routing to handleFCMToken')
        return await handleFCMToken(request)
      }
  
      if (path === '/send-global-notification') {
        console.log('Routing to handleSendGlobalNotification')
        return await handleSendGlobalNotification(request)
      }
  
      if (path === '/send-user-notification') {
        console.log('Routing to handleSendUserNotification')
        return await handleSendUserNotification(request)
      }
  
      console.log('Routing to handleDefault')
      return await handleDefault(request)
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  }
  
  async function handleDelete(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  
    try {
      const body = await request.json()
      const { rowNumber, password, username, caption } = body
  
      console.log('Delete request:', { rowNumber, username, caption })
  
      const gasResponse = await fetch('https://script.google.com/macros/s/AKfycbxCYm8jBjgB9SWQ1eRLUxRBdBbr9vq2XO4K_6RusWZnpA4eKtAaRQ7-kyB9oaTkcsBHKg/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rowNumber: rowNumber,
          password: password,
          username: username,
          caption: caption
        })
      })
  
      if (!gasResponse.ok) {
        throw new Error(`GAS responded with status: ${gasResponse.status}`)
      }
  
      const gasData = await gasResponse.text()
      console.log('GAS delete response:', gasData)
  
      return new Response(gasData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } catch (error) {
      console.error('Delete error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Delete operation failed'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  }
  
  async function handleUpload(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  
    try {
      const formData = await request.formData()
      const filename = formData.get('filename')
      const file = formData.get('file')
  
      if (!filename || !file) {
        throw new Error('Missing filename or file data')
      }
  
      console.log('Upload request:', { filename, fileSize: file.length })
  
      const gasResponse = await fetch('https://script.google.com/macros/s/AKfycbxCnus7QAU6Usy0PhxT2-vT8hXAbHllTBNcn0v7av6BPZhBWnGEx4HY15y4W4vAa3aZ/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `filename=${encodeURIComponent(filename)}&file=${encodeURIComponent(file)}`
      })
  
      if (!gasResponse.ok) {
        throw new Error(`GAS responded with status: ${gasResponse.status}`)
      }
  
      const gasData = await gasResponse.text()
      console.log('GAS upload response:', gasData)
  
      return new Response(gasData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } catch (error) {
      console.error('Upload error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Upload operation failed'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  }
  
  async function handleDefault(request) {
    try {
      console.log('Default request:', { method: request.method, url: request.url })
  
      // GETリクエストの場合はContent-Typeヘッダーを送信しない
      const headers = request.method === 'GET' ? {} : { 'Content-Type': 'application/json' };
  
      const gasResponse = await fetch('https://script.google.com/macros/s/AKfycbxCYm8jBjgB9SWQ1eRLUxRBdBbr9vq2XO4K_6RusWZnpA4eKtAaRQ7-kyB9oaTkcsBHKg/exec', {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' ? await request.text() : undefined
      })
  
      if (!gasResponse.ok) {
        throw new Error(`GAS responded with status: ${gasResponse.status}`)
      }
  
      const gasData = await gasResponse.text()
      console.log('GAS default response length:', gasData.length)
  
      return new Response(gasData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } catch (error) {
      console.error('Default error:', error)
      return new Response(JSON.stringify({ 
        error: error.message,
        details: 'Default operation failed'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  }
  
  // FCMトークン保存
  async function handleFCMToken(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  
    try {
      const body = await request.json()
      const { token, userId, timestamp } = body
  
      console.log('FCM Token request:', { userId, timestamp })
  
      // GASにFCMトークンを保存
      const gasResponse = await fetch('https://script.google.com/macros/s/AKfycbxCYm8jBjgB9SWQ1eRLUxRBdBbr9vq2XO4K_6RusWZnpA4eKtAaRQ7-kyB9oaTkcsBHKg/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'saveFCMToken',
          token: token,
          userId: userId,
          timestamp: timestamp
        })
      })
  
      if (!gasResponse.ok) {
        throw new Error(`GAS responded with status: ${gasResponse.status}`)
      }
  
      const gasData = await gasResponse.text()
      console.log('GAS FCM token response:', gasData)
  
      return new Response(gasData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } catch (error) {
      console.error('FCM Token error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'FCM Token operation failed'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  }
  
  // グローバル通知送信
  async function handleSendGlobalNotification(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  
    try {
      const body = await request.json()
      const { title, body: messageBody, imageUrl, timestamp } = body
  
      console.log('Global notification request:', { title, messageBody, timestamp })
  
      // GASにグローバル通知送信リクエストを送信
      const gasResponse = await fetch('https://script.google.com/macros/s/AKfycbxCYm8jBjgB9SWQ1eRLUxRBdBbr9vq2XO4K_6RusWZnpA4eKtAaRQ7-kyB9oaTkcsBHKg/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sendGlobalNotification',
          title: title,
          body: messageBody,
          imageUrl: imageUrl,
          timestamp: timestamp
        })
      })
  
      if (!gasResponse.ok) {
        throw new Error(`GAS responded with status: ${gasResponse.status}`)
      }
  
      const gasData = await gasResponse.text()
      console.log('GAS global notification response:', gasData)
  
      return new Response(gasData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } catch (error) {
      console.error('Global notification error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Global notification operation failed'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  }
  
  // ユーザー通知送信
  async function handleSendUserNotification(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  
    try {
      const body = await request.json()
      const { userId, title, body: messageBody, imageUrl, timestamp } = body
  
      console.log('User notification request:', { userId, title, messageBody, timestamp })
  
      // GASにユーザー通知送信リクエストを送信
      const gasResponse = await fetch('https://script.google.com/macros/s/AKfycbxCYm8jBjgB9SWQ1eRLUxRBdBbr9vq2XO4K_6RusWZnpA4eKtAaRQ7-kyB9oaTkcsBHKg/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sendUserNotification',
          userId: userId,
          title: title,
          body: messageBody,
          imageUrl: imageUrl,
          timestamp: timestamp
        })
      })
  
      if (!gasResponse.ok) {
        throw new Error(`GAS responded with status: ${gasResponse.status}`)
      }
  
      const gasData = await gasResponse.text()
      console.log('GAS user notification response:', gasData)
  
      return new Response(gasData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } catch (error) {
      console.error('User notification error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'User notification operation failed'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
  } 