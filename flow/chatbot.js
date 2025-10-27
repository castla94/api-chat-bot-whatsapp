const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { defaultLogger } = require('../helpers/cloudWatchLogger');
require('dotenv').config();
const axios = require('axios');
const WEBHOOK_URL = process.env.WEBHOOK;

/**
 * Flujo principal del chatbot que maneja la conversación por defecto
 * cuando no hay coincidencias con palabras clave
 */
const chatbot = addKeyword(EVENTS.WELCOME)
    // Primera acción: Validación inicial y procesamiento de mensajes
    .addAction(async (ctx, { state, endFlow, flowDynamic, provider }) => {
        try {
            const payload = {
                userId: ctx.key.remoteJid,
                phone: ctx.from,
                name: ctx?.pushName ?? '',
                message: ctx.body
            }

            defaultLogger.info('[API-BOT][TEXT] Mensaje recibido', {
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                message: ctx.body,
                payload: payload,
                action: 'message_received',
                file: 'chatbot.js'
            });

            const response = await axios.post(WEBHOOK_URL, { payload });

            defaultLogger.info('[API-BOT][TEXT] Respuesta del webhook recibida', {
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                message: ctx.body,
                webhookResponse: response.data,
                action: 'webhook_processing',
                file: 'chatbot.js'
            });

        } catch (error) {
            defaultLogger.error('[API-BOT][TEXT] Error al enviar mensaje al webhook', {
                userId: ctx.key.remoteJid,
                numberPhone: ctx.from,
                name: ctx?.pushName,
                error: error.message,
                stack: error.stack,
                context: ctx,
                file: 'chatbot.js'
            })
        }finally{
            // Sleep de 500 ms para dar tiempo a procesos internos antes de marcar como leído
            await new Promise(resolve => setTimeout(resolve, 500));
            // Aquí puedes marcar el mensaje como leído
            await provider.vendor.readMessages([ctx.key])
        }
    })

module.exports = { chatbot }
