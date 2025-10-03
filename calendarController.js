import 'dotenv/config'
import { google } from 'googleapis';
import { findOrCreateUser, saveGoogleToken, getGoogleToken } from './dbController.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const callback = async (req, res) => {
  const { code } = req.query;

  try {
    console.log('[Auth] Callback started');

    // トークン取得
    const { tokens } = await oauth2Client.getToken(code);

    // セッションIDをemailとして使用してユーザーを作成/取得
    const sessionId = req.sessionID;
    const user = await findOrCreateUser(sessionId);
    console.log('[Auth] User created/found:', user.id);

    // トークンを暗号化してDBに保存
    await saveGoogleToken(
      user.id,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    );
    console.log('[Auth] Token saved to DB');

    // セッションにユーザーIDを保存
    req.session.userId = user.id;

    console.log('[Auth] Authentication completed successfully');

    // フロントにリダイレクト（セッションIDはCookieで自動送信）
    res.redirect('http://localhost:5173/auth/success');
  } catch (error) {
    console.error('[Auth] Callback error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const getEvents = async (req, res) => {
  // セッション認証チェック
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
  }

  try {
    // DBからトークンを取得
    const tokens = await getGoogleToken(req.session.userId);

    if (!tokens) {
      return res.status(401).json({ error: 'Token not found. Please re-authenticate.' });
    }

    // OAuth2クライアントに認証情報をセット
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(result.data.items);
  } catch (error) {
    console.error('[API] getEvents error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const addContent = async(req, res) => {
  // セッション認証チェック
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
  }

  const { startDate, endDate, text } = req.body;

  if (!startDate || !endDate || !text) {
    return res.status(400).json({ error: 'startDate, endDate and text are required' });
  }

  try {
    // DBからトークンを取得
    const tokens = await getGoogleToken(req.session.userId);

    if (!tokens) {
      return res.status(401).json({ error: 'Token not found. Please re-authenticate.' });
    }

    // OAuth2クライアントに認証情報をセット
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
    console.error('[API] addContent error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const deleteContent = async(req,res) => {

}

export const updateContent = asnyc(req,res) => {
  
}