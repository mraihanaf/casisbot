import makeWASocket, { DisconnectReason, BufferJSON, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'

const logger = pino({
    name: "casisbot",
    level: "debug"
})

async function connectToWhatsapp() {
    logger.info("connecting to whatsapp")
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        // @ts-ignore
        logger: logger
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            if(!lastDisconnect) return console.log("last disconnect undefined")
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            logger.error('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                logger.info("reconnecting to whatsapp")
                connectToWhatsapp()
            }
        } else if(connection === 'open') {
            logger.info('opened connection')
        }
    })

}

connectToWhatsapp().catch(err => {
    logger.fatal(err)
})