import { proto, isJidGroup } from "@whiskeysockets/baileys"
import { IWAMessageInfo } from "./types"

export class WAMessageInfo implements IWAMessageInfo {
    type
    content
    id
    isGroup
    sender
    message
    isMention
    isQuoted
    isRep
    msg
    args
    constructor(type: string, msg: proto.IWebMessageInfo) {
        this.type = type
        this.content = JSON.stringify(msg.message)
        this.id = msg.key.remoteJid!
        this.isGroup = isJidGroup(this.id)
        this.sender = isJidGroup(this.id) ? msg.key.participant ?? this.id : this.id
        this.message = msg
        this.isMention = this.content.includes('mentionedJid')
        this.isQuoted = this.content.includes("quotedMessage")
        this.isRep = (this.type === 'extendedTextMessage' && this.isQuoted)
            ? { message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage as proto.IWebMessageInfo | null }
            : false
        this.msg = (() => {
            switch (this.type) {
               
                case 'conversation':
                    return msg.message?.conversation || ''
                case 'extendedTextMessage':
                    return msg.message?.extendedTextMessage?.text || ''
                case 'imageMessage':
                    return msg.message?.imageMessage?.caption || ''
                case 'videoMessage':
                    return msg.message?.videoMessage?.caption || ''
                case 'reactionMessage':
                    return msg.message?.reactionMessage?.text || ''
                case 'listResponseMessage':
                    return msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ''
                case 'buttonsResponseMessage':
                    return msg.message?.buttonsResponseMessage?.selectedButtonId || ''
                default:
                    return ''
            }
        })()
        this.args = this.msg.split(/ /gi).slice(1)
    }

}
