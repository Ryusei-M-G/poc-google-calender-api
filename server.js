import express from 'express'
import cors from 'cors'
import session from 'express-session'
import pg from 'pg'
import { google } from 'googleapis';
import 'dotenv/config'

import { callback, getEvents, addContent } from './calendarController.js';

//クライアント初期化
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const server = express();

// CORS設定（credentials: trueでCookieを送受信可能に）
server.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

server.use(express.json());

// セッション設定
server.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 本番環境ではtrue（HTTPS必須）
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7日間
  }
}))

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

// フロントからセッションの有無を確認するためのエンドポイント
server.get('/auth/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ authenticated: true, userId: req.session.userId });
  }
  return res.status(401).json({ authenticated: false });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('server start');
}) 
