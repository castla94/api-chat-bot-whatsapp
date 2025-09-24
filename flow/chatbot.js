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
    .addAction(async (ctx, { state, endFlow, flowDynamic }) => {
        try {

            const payload = {
                userId: ctx.key.remoteJid,
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                messageBody: ctx.body
            }

            console.log("payload:",payload);

            const response = await axios.post(WEBHOOK_URL, { payload });
            console.log("response:",response.data);

        } catch (error) {
            defaultLogger.error('Error en primera acción chatbot flujo', {
                userId: ctx.key.remoteJid,
                numberPhone: ctx.from,
                name: ctx?.pushName,
                error: error.message,
                stack: error.stack,
                context: ctx,
                file: 'chatbot.js'
            })
        }
    })

module.exports = { chatbot }
