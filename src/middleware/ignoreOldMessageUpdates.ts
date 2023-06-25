import {NextFunction} from 'grammy'
import Context from "@/model/context";

const thresholdSeconds = 30

export default function ignoreOldMessageUpdates(
  ctx: Context,
  next: NextFunction
) {
  if (ctx.message) {
    if (new Date().getTime() / 1000 - ctx.message.date < thresholdSeconds) {
      return next()
    } else {
      console.log(
        `Ignoring message from ${ctx.from.id} at ${ctx.chat.id} (${
          new Date().getTime() / 1000
        }:${ctx.message.date})`
      )
    }
  } else {
    return next()
  }
}
