import {Bot, Composer, Context, Context as BaseContext} from 'grammy'
import {CommandContext, MaybeArray, StringWithSuggestions} from "grammy/out/context";
import {CommandMiddleware} from "grammy/out/composer";
import logCommand from "@/middleware/logCommand";

const bot = new Bot<BaseContext>(process.env.TOKEN)

export function registerCommand<S extends string>(command: string | "start" | "help" | "settings", ...middleware: Array<CommandMiddleware<Context>>): Composer<CommandContext<Context>> {
    return bot.command(command, (context, next) => logCommand(command, context, next), ...middleware)
}

export default bot
