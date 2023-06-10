import {Context} from "grammy";
import * as console from "console";
import bot from "@/helpers/bot";
import fileUrl from "@/helpers/fileUrl";
import * as download from 'download'
import nsfwSpy from "@/helpers/nsfwSpy";
import model from "@/helpers/model";
import getModel from "@/helpers/model";
import tensorflow from "@/helpers/tf";
import {NSFW_CLASSES} from "nsfwjs/dist/nsfw_classes";
import {pre} from "@typegoose/typegoose";

const isUseNsfwSpy = false

const isUseNsfwJS = true
const nsfwJsTriggerClasses: Array<'Drawing' | 'Hentai' | 'Neutral' | 'Porn' | 'Sexy'> = ['Porn', 'Sexy', 'Hentai']

export default async function handlePhoto(ctx: Context) {
  const start = new Date().getTime()
  const message = ctx.msg
  const chat = message.chat
  const messageLogId = `${message.message_id}@${chat.id}`

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

  let isNsfw: Boolean
  if (isUseNsfwSpy) {
    const result = await nsfwSpy.classifyImageFromByteArray(data)
    isNsfw = result.isNsfw

    logStateWithTime(start, `Message ${messageLogId} content is scanned by NsfwSpy. Predictions: ${JSON.stringify(result)}`)
  }

  if (isUseNsfwJS) {
    const image = await tensorflow.node.decodeImage(data)
    const predictions = await getModel().classify(image)
    image.dispose()

    let nsfwProbability = 0.0
    for (let prediction of predictions) {
      const className = prediction.className
      if (className == 'Porn' || className == 'Sexy' || className == 'Hentai') {
        nsfwProbability += prediction.probability
      }
    }
    isNsfw = nsfwProbability >= 0.5

    logStateWithTime(start, `Message ${messageLogId} content is scanned by NSFWJS. NSFW Probability: ${nsfwProbability}. Predictions: ${JSON.stringify(predictions)}`)
  }

  if (isNsfw == undefined) {
    ctx.reply("😭 Что-то случилось и я пока не могу определять NSFW-контент.", { reply_to_message_id: message.message_id })
  }

  const deleteOriginal = chat.type != "private"
  const sendNotNsfwResponse = chat.type == "private"

  if (isNsfw) {
    console.log(`Message ${messageLogId} has NSFW content.`)

    const sender: any = message.from

    const visibleName = (sender.title || [sender.first_name || '', sender.last_name || ''].join(' '))
    const link = sender.username
        ? `https://t.me/${sender.username}`
        : sender.invite_link

    ctx.replyWithPhoto(photo.file_id, {
      caption: `
🍒 от ${link ? `<a href="${link}">${visibleName}</a>` : visibleName} ${message.caption ? `\n${message.caption}` : ''}

<tg-spoiler>
AI <a href="t.me/${bot.botInfo.username}">Spoiler Nudes 🍒</a>
посчитал это NSFW-контентом
</tg-spoiler>
`,
      has_spoiler: true,
      parse_mode: "HTML",
      reply_to_message_id: message.message_id
    }).then(() => {
      if (deleteOriginal) {
        ctx.deleteMessage()
      }
    })
  } else if (sendNotNsfwResponse) {
    ctx.reply("🌺 Это не похоже на NSFW-контент.", { reply_to_message_id: message.message_id })
  }

  logStateWithTime(start, `Message ${messageLogId} is processed`)
}

function logStateWithTime(start, state) {
  const now = new Date().getTime()
  console.info(`${state} in ${(now - start) / 1000}s.`)
}