import { EventEmitter } from "events"
import { ISchedules, FileData } from "./types"
import { schedule } from "node-cron"

export declare interface Schedules {
    on(event: 'open', listener: (group_id: string) => void): this;
    on(event: 'close', listener: (groud_id: string) => void): this;
}

export class Schedules extends EventEmitter {
    data!: ISchedules
    fileData!: FileData.Schedules
    super() {
        this.data = {}
        this.fileData = {}
    }
    add(uuid: string, param: FileData.ScheduleAction): void {
        
        this.data[uuid] = schedule(param.cron_expression, () => this.emit(param.action,param.group_id))
        this.fileData[uuid] = {
            action: param.action,
            group_id: param.group_id,
            cron_expression: param.cron_expression
        }
    }
    remove(uuid:string): void {
        this.data[uuid].stop()
        delete this.data[uuid]
        delete this.fileData[uuid]       
    }
}