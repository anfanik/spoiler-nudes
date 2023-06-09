import {Context} from "grammy";
import * as console from "console";
import bot from "@/helpers/bot";
import fileUrl from "@/helpers/fileUrl";
import * as download from 'download'
import nsfwSpy from "@/helpers/nsfwSpy";

export default async function handlePhoto(ctx: Context) {
  const start = new Date().getTime()
  const message = ctx.msg
  const messageLogId = `${message.message_id}@${message.chat.id}`

  console.log(`Processing message ${messageLogId}.`)

  if (!message.photo.length) {
    console.log(`Message ${messageLogId} doesn't have a photo.`)
    return
  }

  if (message.has_media_spoiler) {
    console.log(`Message ${messageLogId} is already spoilered.`)
    return
  }

  const photo = await ctx.getFile()
  const photoUrl = fileUrl(photo.file_path)

  const data = await download(photoUrl)
  logStateWithTime(start, `Message ${messageLogId} content is downloaded`)

  const result = await nsfwSpy.classifyImageFromByteArray(data)
  logStateWithTime(start, `Message ${messageLogId} content is scanned`)

  const sender: any = message.from

  const visibleName = (sender.title || [sender.first_name || '', sender.last_name || ''].join(' '))
  const link = sender.username
      ? `https://t.me/${sender.username}`
      : sender.invite_link

  if (result.isNsfw) {
    console.log(`Message ${messageLogId} has NSFW content. NsfwSpy result: ${JSON.stringify(result)}.`)
    ctx.deleteMessage()

    ctx.replyWithPhoto(photo.file_id, {
      caption: `
🍒 от ${link ? `<a href="${link}">${visibleName}</a>` : visibleName} ${message.caption ? `\n${message.caption}` : ''}

<tg-spoiler>
<a href="t.me/${bot.botInfo.username}">Spoiler Nudes 🍒</a>
посчитал это NSFW-контентом
</tg-spoiler>
        `,
      has_spoiler: true,
      parse_mode: "HTML"
    })
  }

  logStateWithTime(start, `Message ${message.message_id} is processed`)
}

function logStateWithTime(start, state) {
  const now = new Date().getTime()
  console.info(`${state} in ${(now - start) / 1000}s.`)
}