import makeWASocket, { DisconnectReason, BufferJSON, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { config } from "dotenv"
import { FileData, ISchedules } from "./types"
import { WAMessageInfo } from "./WAMessageInfo"
import { writeFileSync, readFileSync, existsSync } from "fs"
import { Schedules } from "./schedules"
import { validate as validateCron } from "node-cron"
import { v7 } from 'uuid'
config()

const logger = pino({
    name: "casisbot",
    level: "debug"
})

const schedules = new Schedules()

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

    schedules.on('open', async (group_id) => {
        try {
            await sock.groupSettingUpdate(group_id, 'not_announcement')
        } catch (err) {
            logger.error(err)
            await sock.sendMessage(group_id, {text: "I cant open the group."})
        }
    })

    schedules.on('close', async (group_id) => {
        try {
            await sock.groupSettingUpdate(group_id, 'announcement')
        } catch (err) {
            logger.error(err)
            await sock.sendMessage(group_id, { text: "I cant close the group."})
        }
})

    sock.ev.on("messages.upsert", async Messages => {
        const { messages } = Messages
        let msg = messages[0]
        if(!msg.message) return
        if(msg.key.fromMe) return
        const type = Object.keys(msg.message)[0]
    
        if(type === 'protocolMessage' && msg.message?.[type]?.type === 0) return logger.info("protocol")
        const data = new WAMessageInfo(type,msg)
        // logger.info(`[${data.isGroup ? "group" : "private"}][${data.id}](${data.sender}) ${data.msg}`)
        if(data.msg.startsWith(process.env.PREFIX!)){
            const command = data.msg.split(" ")[0].replace(process.env.PREFIX!,"")
            switch(command){
                case 'add':
                    if(!data.isGroup) return await sock.sendMessage(data.id, {text: "This is group-only command."}, { quoted: data.message })
                    const action:string = data.args.splice(0,1)[0]
                    if(data.args.length < 5 || data.args.length > 6) return await sock.sendMessage(data.id, {text: "Invalid Argument."}, {quoted:data.message})
                    if(action !== "open" && action !== "close") return await sock.sendMessage(data.id, {text: "Invalid Action."}, {quoted: data.message})
                    const cron_sytax: string = data.args.join(" ").trim()
                    if(!validateCron(cron_sytax)) return await sock.sendMessage(data.id, {text: "Invalid Cron Syntax."})
                    const uuid = v7().toString()
                    await schedules.add(uuid, {
                        action: action,
                        group_id: data.id,
                        cron_expression: cron_sytax
                    })
                    await writeFileSync("schedules_data.json",JSON.stringify(schedules.fileData))
                    await sock.sendMessage(data.id, {text: `Success, UUID: \`${uuid}\``})
                    break
                case 'remove':
                    
                    break
            }
        }
    })

}

if(!existsSync("schedules_data.json")) writeFileSync("schedules_data.json", JSON.stringify({}))
const fileData: FileData.Schedules = JSON.parse(readFileSync("schedules_data.json").toString())
logger.info("schedules_data file loaded.")
for(const uuid in fileData){
    schedules.add(uuid, fileData[uuid])
}
logger.info("shedules loaded.")



connectToWhatsapp().catch(err => {
    logger.fatal(err)
})