const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { downloadMediaMessage } = require("@adiwajshing/baileys")
const fs = require("fs");
const { defaultLogger } = require('../helpers/cloudWatchLogger');
require('dotenv').config();
const axios = require('axios');
const WEBHOOK_URL = process.env.WEBHOOK;

/**
 * Flow para manejar eventos de medios (imágenes) enviados por el usuario
 * Procesa comprobantes de pago y notifica al vendedor
 */
const media = addKeyword(EVENTS.MEDIA)
    .addAction(async (ctx, { flowDynamic, endFlow, state, provider }) => {
        const userId = ctx.key.remoteJid
        const numberPhone = ctx.from
        const name = ctx?.pushName ?? ''

        try {

            // Procesar y guardar la imagen recibida
            const buffer = await downloadMediaMessage(ctx, "buffer")
            const fileName = `API-BOT-imagen-${numberPhone}-${Date.now()}.jpg`
            const pathImg = `${process.cwd()}/media/${fileName}`
            await fs.promises.writeFile(pathImg, buffer)
            defaultLogger.info('[API-BOT][MEDIA] Imagen recibida y almacenada con éxito', {
                userId,
                numberPhone,
                name,
                fileName,
                action: 'image_saved',
                file: 'media.js'
            })
            const imageBuffer = fs.readFileSync(pathImg);
            const base64Image = imageBuffer.toString('base64');


            const payload = {
                userId: ctx.key.remoteJid,
                phone: ctx.from,
                name: ctx?.pushName ?? '',
                message: "imagen",
                image: base64Image
            }

            defaultLogger.info('[API-BOT][MEDIA] Preparando envío de imagen al webhook', {
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                message: "imagen",
                action: 'message_received',
                file: 'media.js'
            });

            const response = await axios.post(WEBHOOK_URL, { payload });

            defaultLogger.info('[API-BOT][MEDIA] Webhook procesó imagen correctamente', {
                numberPhone: ctx.from,
                name: ctx?.pushName ?? '',
                message: ctx.body,
                webhookResponse: response.data,
                action: 'webhook_processing',
                file: 'media.js'
            });

            fs.unlink(pathImg, (error) => {
                if (error) {
                    defaultLogger.error('[API-BOT][MEDIA] No se pudo eliminar imagen temporal', {
                        userId,
                        numberPhone,
                        name,
                        error: error.message,
                        action: 'delete_image',
                        file: 'media.js'
                    });
                }
            });

            return endFlow()

        } catch (error) {
            defaultLogger.error('[API-BOT][MEDIA] Fallo al procesar imagen y enviar al webhook', {
                userId,
                numberPhone,
                name,
                error: error.message,
                stack: error.stack,
                context: ctx,
                file: 'media.js'
            })
            return endFlow()
        }finally{
            // Sleep de 500 ms para dar tiempo a procesos internos antes de marcar como leído
            await new Promise(resolve => setTimeout(resolve, 500));
            // Aquí puedes marcar el mensaje como leído
            await provider.vendor.readMessages([ctx.key])
        }
    })

module.exports = { media }
