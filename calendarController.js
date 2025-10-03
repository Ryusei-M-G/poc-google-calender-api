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

    // Remove read-only birthday events to avoid modification errors on the client
    const items = (result.data.items || []).filter(ev => ev.eventType !== 'birthday');
    res.json(items);
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
  // セッション認証チェック
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
  }

  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
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

    // Guard: disallow deletion of read-only birthday events
    try {
      const { data: ev } = await calendar.events.get({ calendarId: 'primary', eventId });
      if (ev?.eventType === 'birthday') {
        return res.status(400).json({ error: "Birthday events can't be deleted" });
      }
    } catch (e) {
      // If not found on primary, surface a clear error
      if (e?.code === 404) {
        return res.status(404).json({ error: 'Event not found in primary calendar' });
      }
      // otherwise continue to attempt delete which will report a meaningful error
    }

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('[API] deleteContent error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const updateContent = async(req,res) => {
  // セッション認証チェック
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
  }

  const { eventId } = req.params;
  const { startDate, endDate, text } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
  }

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

    // Guard: disallow updating read-only birthday events
    try {
      const { data: ev } = await calendar.events.get({ calendarId: 'primary', eventId });
      if (ev?.eventType === 'birthday') {
        return res.status(400).json({ error: "Birthday events can't be updated" });
      }
    } catch (e) {
      if (e?.code === 404) {
        return res.status(404).json({ error: 'Event not found in primary calendar' });
      }
    }

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

    const result = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    res.json({ message: 'Event updated successfully', event: result.data });
  } catch (error) {
    console.error('[API] updateContent error:', error);
    res.status(500).json({ error: error.message });
  }
}
