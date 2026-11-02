import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Test endpoint works!' });
});

export default serverless(app);