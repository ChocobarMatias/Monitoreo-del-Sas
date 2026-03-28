import axios from 'axios';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export const integrationService = {
  async notifyTelegram(message) {
    if (!env.telegramBotToken || !env.telegramChatId) return;
    await axios.post(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      chat_id: env.telegramChatId,
      text: message
    });
  },

  async dispatchWebhooks(event, payload, userId = null) {
    const hooks = await prisma.webhook.findMany({ where: { isActive: true } });

    await Promise.all(
      hooks.map(async (hook) => {
        let statusCode = null;
        try {
          const response = await axios.post(hook.url, payload, {
            headers: {
              'x-webhook-event': event,
              'x-webhook-secret': hook.secret
            },
            timeout: 5000
          });
          statusCode = response.status;
        } catch (error) {
          statusCode = error.response?.status ?? 500;
        }

        await prisma.webhookDelivery.create({
          data: {
            userId,
            webhookId: hook.id,
            event,
            payload,
            statusCode
          }
        });
      })
    );
  }
};
