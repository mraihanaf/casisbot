import { proto } from "@whiskeysockets/baileys"
import { ScheduledTask, cronExpression } from "node-cron"

export namespace FileData {
    export interface ScheduleAction {
        action: "open" | "close";
        group_id: string;
        cron_expression:  cronExpression;
    }
    export interface Schedules {
        [key: string]: ScheduleAction;
    }
}

export interface ISchedules {
    [key:string]: ScheduledTask;
}

export interface IWAMessageInfo {
    type: string;
    content: string;
    id: proto.IMessageKey.jid;
    isGroup: boolean | undefined;
    sender: string;
    message: proto.IWebMessageInfo;
    isMention: boolean;
    isQuoted: boolean;
    isRep: boolean|{ message: proto.IWebMessageInfo | null } |undefined;
    msg: string;
    args: string[];
}
