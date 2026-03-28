import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.use((error, _req, res, _next) => {
  const status = error.name === 'ZodError' ? 400 : 500;
  res.status(status).json({ message: error.message, issues: error.issues });
});
