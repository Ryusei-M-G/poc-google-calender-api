import 'dotenv/config'
import { google } from 'googleapis';
import { findOrCreateUser, saveGoogleToken, getGoogleToken } from './dbContoller.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

//仮実装トークン保存（後方互換性のため残す）
const tokenStore = {
  accessToken: null,
  refreshToken: null
};

// トークン確認と設定を行うヘルパー関数
const setOAuthCredentials = (res) => {
  if (!tokenStore.accessToken) {
    res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
    return false;
  }

  oauth2Client.setCredentials({
    access_token: tokenStore.accessToken,
    refresh_token: tokenStore.refreshToken
  });

  return true;
};

export const callback = async (req, res) => {
  const { code } = req.query;

  try {
    // 1. トークン取得
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. ユーザー情報を取得（Google OAuth2 API）
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // 3. ユーザーをDBに保存または取得
    const user = await findOrCreateUser(userInfo.email);

    // 4. トークンを暗号化してDBに保存
    await saveGoogleToken(
      user.id,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    );

    // 5. セッションにユーザーIDを保存
    req.session.userId = user.id;
    req.session.email = user.email;

    //仮でメモリにも保存（既存機能の後方互換性のため）
    tokenStore.accessToken = tokens.access_token;
    tokenStore.refreshToken = tokens.refresh_token;

    // 6. フロントにリダイレクト（セッションIDはCookieで自動送信）
    res.redirect('http://localhost:5173/auth/success');
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const getEvents = async (req, res) => {
  if (!setOAuthCredentials(res)) return;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(result.data.items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const addContent = async(req, res) => {
  if (!setOAuthCredentials(res)) return;

  const { startDate, endDate, text } = req.body;

  if (!startDate || !endDate || !text) {
    return res.status(400).json({ error: 'startDate, endDate and text are required' });
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const event = {
      summary: text,
      start: {
        dateTime: new Date(startDate).toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: new Date(endDate).toISOString(),
        timeZone: 'Asia/Tokyo',
      },
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.json({ message: 'Event created successfully', event: result.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}