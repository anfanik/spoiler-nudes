import {Context, NextFunction} from "grammy";
import {runAndLogPromise} from "@/helper/logger";

export default function logCommand(command: string, context: Context, next: NextFunction) {
    void runAndLogPromise(`Executing /${command} command by ${context.message.from.id}`, next)
}
