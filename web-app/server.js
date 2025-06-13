import path from 'node:path';
dotenv.config();
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import express from 'express';
import fallback from 'express-history-api-fallback';

import packageJson from './package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const { HOST = '127.0.0.1', PORT = 3000 } = process.env;

const app = express();
const root = path.resolve(__dirname, './dist');

app.get('/getAppVersion', (req, res) => {
  const version = packageJson.version;
  res.json({ version });
});

app.use(express.static(root));
// app.use(express.static(fonts));
app.use(fallback('index.html', { root: root }));

app.listen(+PORT, HOST, () => {
  console.log(`listening at http://${HOST}:${+PORT}`);
});
