import express, { Request, Response } from 'express';

const app = express();

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

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;