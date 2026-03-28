import { securityService } from '../services/securityService.js';

export const requireApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ message: 'Missing API key' });

  const valid = await securityService.validateApiKey(apiKey);
  if (!valid) return res.status(401).json({ message: 'Invalid API key' });

  return next();
};
