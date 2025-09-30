import express from 'express'
import cors from 'cors'
import { google } from 'googleapis';
import 'dotenv/config'

//クライアント初期化
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

//仮実装トークン保存
const tokenStore = {
  accessToken: null,
  refreshToken: null
};
//---
const server = express();
server.use(cors());

//認証
server.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

//google認証後のコールバック処理
server.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    //仮でメモリに保存
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);
    tokenStore.accessToken = tokens.access_token;
    tokenStore.refreshToken = tokens.refresh_token;

    // res.json({ message: 'OK', tokens });
    res.redirect('http://localhost:5173/auth/success');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.get('/events', async (req, res) => {
  // トークン存在チェック
  if (!tokenStore.accessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
  }

  // 保存されたトークンを使用
  oauth2Client.setCredentials({
    access_token: tokenStore.accessToken,
    refresh_token: tokenStore.refreshToken
  });

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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('server start');
}) 