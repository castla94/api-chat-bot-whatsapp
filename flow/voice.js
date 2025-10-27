const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { handlerAI } = require("../services/audio")
const { defaultLogger } = require('../helpers/cloudWatchLogger')
require('dotenv').config();
const axios = require('axios');
const WEBHOOK_URL = process.env.WEBHOOK;

/**
 * Flujo para manejar notas de voz
 * Procesa el audio, lo convierte a texto y genera respuestas
 */
const voice = addKeyword(EVENTS.VOICE_NOTE)
    // Segunda acción: Procesamiento de audio y generación de respuesta
    .addAction(async (ctx, { flowDynamic, endFlow, state, provider }) => {
        const userId = ctx.key.remoteJid
        const name = ctx?.pushName ?? ''
        const numberPhone = ctx.from

        try {
        
            // Convertir audio a texto
            const base64Audio = await handlerAI(ctx, numberPhone)
            defaultLogger.info('[API-BOT][AUDIO] Audio transcrito a base64', {
                userId,
                numberPhone,
                name,
                action: 'audio_transcription',
                file: 'voice.js'
            })

              const payload = {
                userId: ctx.key.remoteJid,
                phone: ctx.from,
                name: ctx?.pushName ?? '',
                message: "audio",
                audio: base64Audio
            }

            defaultLogger.info('[API-BOT][AUDIO] Preparando audio para webhook', {
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                message: "audio",
                action: 'message_received',
                file: 'voice.js'
            });

            const response = await axios.post(WEBHOOK_URL, { payload });

            defaultLogger.info('[API-BOT][AUDIO] Respuesta del webhook recibida', {
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                message: ctx.body,
                webhookResponse: response.data,
                action: 'webhook_processing',
                file: 'voice.js'
            });


        } catch (error) {
            defaultLogger.error('[API-BOT][AUDIO] Error al procesar y enviar audio al webhook', {
                userId,
                numberPhone,
                name,
                error: error.message,
                stack: error.stack,
                context: ctx,
                file: 'voice.js'
            })
            return endFlow()
        }finally{
            // Sleep de 500 ms para dar tiempo a procesos internos antes de marcar como leído
            await new Promise(resolve => setTimeout(resolve, 500));
            // Aquí puedes marcar el mensaje como leído
            await provider.vendor.readMessages([ctx.key])
        }
    })


module.exports = { voice }
