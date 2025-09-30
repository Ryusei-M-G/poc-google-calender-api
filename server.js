import express from 'express'
import cors from 'cors'
import 'dotenv/config'

const server = express();
server.use(cors());

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`server start`);
});