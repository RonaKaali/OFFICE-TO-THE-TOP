const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'kantor-ai';
const API_KEY = process.env.EVOLUTION_API_KEY || 'office-to-the-top-secret-key-change-me';

const headers = {
  'apikey': API_KEY,
  'Content-Type': 'application/json'
};

async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

export const wa = {
  // Send text message
  sendText: async (chatId, text) => {
    const payload = { number: chatId.replace('@s.whatsapp.net', '').replace('@g.us', ''), text };
    return fetchWithRetry(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  },

  // Send media (image, document, video, audio)
  sendMedia: async (chatId, mediaBase64, mimeType, caption = '', fileName = 'file') => {
    const payload = {
      number: chatId.replace('@s.whatsapp.net', '').replace('@g.us', ''),
      mediatype: mimeType.startsWith('image') ? 'image' : 
                 mimeType.startsWith('video') ? 'video' :
                 mimeType.startsWith('audio') ? 'audio' : 'document',
      media: mediaBase64,
      caption,
      fileName
    };
    return fetchWithRetry(`${EVOLUTION_URL}/message/sendMedia/${INSTANCE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  },

  // Send interactive buttons
  sendButtons: async (chatId, text, buttons) => {
    const payload = {
      number: chatId.replace('@s.whatsapp.net', '').replace('@g.us', ''),
      textMessage: { text },
      buttons: buttons.map(b => ({
        buttonId: b.buttonId,
        buttonText: { displayText: b.buttonText?.displayText || b.buttonId },
        type: b.type || 1
      }))
    };
    return fetchWithRetry(`${EVOLUTION_URL}/message/sendButtons/${INSTANCE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  },

  // Mark message as read
  markRead: async (messageId) => {
    return fetchWithRetry(`${EVOLUTION_URL}/chat/markAsRead/${INSTANCE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messageId })
    });
  },

  // Get instance connection state
  getInstanceState: async () => {
    return fetchWithRetry(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, {
      method: 'GET',
      headers
    });
  },

  // Get all groups
  getGroups: async () => {
    return fetchWithRetry(`${EVOLUTION_URL}/group/fetchAllGroups/${INSTANCE}`, {
      method: 'GET',
      headers
    });
  },

  // Set webhook URL
  setWebhook: async (url, events = ['messages.upsert', 'messages.update', 'connection.update']) => {
    const payload = {
      url,
      webhookByEvents: false,
      webhookBase64: false,
      events
    };
    return fetchWithRetry(`${EVOLUTION_URL}/webhook/set/${INSTANCE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  },

  // Get QR code (for manual scan)
  getQR: async () => {
    return fetchWithRetry(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
      method: 'GET',
      headers
    });
  },

  // Restart instance
  restart: async () => {
    return fetchWithRetry(`${EVOLUTION_URL}/instance/restart/${INSTANCE}`, {
      method: 'POST',
      headers
    });
  },

  // Logout instance
  logout: async () => {
    return fetchWithRetry(`${EVOLUTION_URL}/instance/logout/${INSTANCE}`, {
      method: 'DELETE',
      headers
    });
  }
};

export default wa;