import { adminService } from '../services/adminService.js';
import { apiKeyCreateSchema, eventCreateSchema, scaleCreateSchema, webhookCreateSchema } from '../validators/schemas.js';

export const adminController = {
  async createEvent(req, res) {
    const payload = eventCreateSchema.parse(req.body);
    const event = await adminService.createEvent(payload);
    res.status(201).json(event);
  },

  async createScale(req, res) {
    const payload = scaleCreateSchema.parse(req.body);
    const scale = await adminService.createSalaryScale(payload);
    res.status(201).json(scale);
  },

  async createApiKey(req, res) {
    const payload = apiKeyCreateSchema.parse(req.body);
    const result = await adminService.createApiKey(payload.name);
    res.status(201).json(result);
  },

  async createWebhook(req, res) {
    const payload = webhookCreateSchema.parse(req.body);
    const webhook = await adminService.createWebhook(payload);
    res.status(201).json(webhook);
  },

  async listWebhooks(_req, res) {
    const hooks = await adminService.listWebhooks();
    res.json(hooks);
  },

  async listUsers(_req, res) {
    const users = await adminService.listUsers();
    res.json(users);
  }
};
