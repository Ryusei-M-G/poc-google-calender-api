import express from 'express'
import cors from 'cors'
import { google } from 'googleapis';
import 'dotenv/config'

import { callback, getEvents, addContent } from './calenderController.js';

//クライアント初期化
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const server = express();
server.use(cors());
server.use(express.json())

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
server.get('/auth/google/callback', callback);
//カレンダー情報を取得しクライアントへ返却する。
server.get('/events', getEvents);
//クライアントからきたjsonをカレンダーに追加する
server.post('/addContent', addContent);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('server start');
}) 