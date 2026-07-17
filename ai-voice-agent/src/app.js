import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import voiceRoutes from './routes/voice.js';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use('/voice', voiceRoutes);
  app.use('/api', apiRoutes);

  app.use(express.static(path.join(__dirname, '../public')));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ai-voice-agent' });
  });

  return app;
}
