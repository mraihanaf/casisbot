import { EventEmitter } from "events"
import { ISchedules, FileData } from "./types"
import { schedule } from "node-cron"
import { writeFileSync } from "fs"

export declare interface Schedules {
    on(event: 'open', listener: (group_id: string) => void): this;
    on(event: 'close', listener: (groud_id: string) => void): this;
}

export class Schedules extends EventEmitter {
    public data: ISchedules;
    public fileData: FileData.Schedules;
    constructor(){
        super()
        this.data = {}
        this.fileData = {}
    }
    async add(uuid: string, param: FileData.ScheduleAction): Promise<void> {
        this.data[uuid] = schedule(param.cron_expression, () => this.emit(param.action,param.group_id))
        this.fileData[uuid] = {
            action: param.action,
            group_id: param.group_id,
            cron_expression: param.cron_expression
        }
        await writeFileSync("schedules_data.json",JSON.stringify(this.fileData))
    }
    async remove(uuid:string): Promise<void|Error> {
        try {
            this.data[uuid].stop()
            delete this.data[uuid]
            delete this.fileData[uuid]       
            await writeFileSync("schedules_data.json", JSON.stringify(this.fileData))
        } catch (err: unknown) {
            if(err instanceof Error) return err
        }
    }
}
