import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();


const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

export const encryptToken = (token) => {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
};


export const decryptToken = (encryptedToken) => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};


export const findOrCreateUser = async (email) => {
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: '' 
      }
    });
  }

  return user;
};


export const saveGoogleToken = async (userId, accessToken, refreshToken, expiresIn) => {
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = encryptToken(refreshToken);


  const expiresAt = new Date(Date.now() + expiresIn * 1000);


  const existingToken = await prisma.googleToken.findFirst({
    where: { userId }
  });

  if (existingToken) {

    return await prisma.googleToken.update({
      where: { id: existingToken.id },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt
      }
    });
  } else {
    return await prisma.googleToken.create({
      data: {
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt
      }
    });
  }
};


export const getGoogleToken = async (userId) => {
  const tokenData = await prisma.googleToken.findFirst({
    where: { userId }
  });

  if (!tokenData) {
    return null;
  }

  return {
    accessToken: decryptToken(tokenData.accessToken),
    refreshToken: decryptToken(tokenData.refreshToken),
    expiresAt: tokenData.expiresAt
  };
};


export const getUserBySessionId = async (sessionId) => {
  return null;
};

export default prisma;
