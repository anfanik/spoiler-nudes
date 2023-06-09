import {Context} from "grammy";
import bot from "@/helper/bot";
import fileUrl from "@/helper/fileUrl";
import * as download from 'download'
import {InputMediaPhoto, User} from "grammy/types";
import logger, {runAndLogPromise} from "@/helper/logger";
import {engine} from "@/engine/engine";

let mediaGroupCache: Map<String, Array<Context>> = new Map()
let runningMediaGroups: Set<String> = new Set()

export default async function handlePhoto(ctx: Context) {
  const message = ctx.msg

  const mediaGroupId = message.media_group_id
  if (mediaGroupId) {
    if (!mediaGroupCache.has(mediaGroupId)) {
      mediaGroupCache.set(mediaGroupId, [])
    }

    mediaGroupCache.get(mediaGroupId).push(ctx)

    if (!runningMediaGroups.has(mediaGroupId)) {
      runningMediaGroups.add(mediaGroupId)
      setTimeout(() => {
        const contexts = mediaGroupCache.get(mediaGroupId)
        runningMediaGroups.delete(mediaGroupId)
        mediaGroupCache.delete(mediaGroupId)

        runAndLogPromise(`Processing '${mediaGroupId}' media group`,
            () => processMediaGroup(mediaGroupId, contexts))
      }, 1000)
    }
    return
  } else {
    void processMedia(ctx)
  }
}


async function processMedia(context: Context) {
  const isNsfw = await runAndLogPromise(`Processing message ${context.message.message_id} from ${context.chat.id}`,
      () => processMessageWithRetries(context))
  sendResponse([context], isNsfw).then(() => postProcess([context], isNsfw))
}

async function processMediaGroup(mediaGroupId: String, contexts: Array<Context>) {
  let results = await Promise.all(contexts
      .map((context) =>
          runAndLogPromise(`Processing message ${context.message.message_id} from ${context.chat.id} (media group ${mediaGroupId})`,
              () => processMessageWithRetries(context))))

  const isNsfw = results.find((it) => it)
  sendResponse(contexts, isNsfw).then(() => postProcess(contexts, isNsfw))
}

async function processMessageWithRetries(context: Context, retries: number = 0) {
  let isNsfw = await processMessage(context)
  if (isNsfw == null && retries < 3) {
    return processMessageWithRetries(context, retries + 1)
  }
  if (retries > 0) {
    logger.info(`Message ${context.message.message_id} from ${context.chat.id} is processed with ${retries} retries. isNsfw: ${isNsfw}.`)
  }
  return Promise.resolve(isNsfw)
}

async function postProcess(contexts: Array<Context>, isNsfw: Boolean) {
  const firstContext = contexts[0]
  const message = firstContext.message
  const chat = message.chat

  if (isNsfw) {
    const deleteOriginal = chat.type != "private"

    if (deleteOriginal) {
      contexts.forEach((context) => context.deleteMessage())
    }
  }
}

async function processMessage(context: Context) {
  const message = context.message
  const chat = message.chat

  const messageLogId = `${message.message_id}@${chat.id}`

  if (!message.photo.length) {
    logger.info(`Message '${messageLogId}' doesn't have a photo.`)
    return false
  }

  if (message.has_media_spoiler) {
    logger.info(`Message '${messageLogId}' is already spoilered.`)
    return false
  }

  const photo = await context.getFile()
  const photoUrl = fileUrl(photo.file_path)

  const data = await runAndLogPromise(`Downloading '${messageLogId}' message data`,
      () => download(photoUrl))

  return await runAndLogPromise(`Scanning '${messageLogId}' message photo with '${engine.code}' engine`,
      () => engine.classify(data))
}

function sendResponse(contexts: Array<Context>, isNsfw: Boolean): Promise<any> {
  const context = contexts[0]
  const message = context.message
  const chat = message.chat

  if (isNsfw == undefined) {
    // return context.reply("😭 Что-то случилось и я пока не могу определить NSFW-контент в этом сообщении.\n\nОставляю это на вашей совести!", { reply_to_message_id: message.message_id })
    return Promise.resolve()
  }

  const sendNotNsfwResponse = chat.type == "private"

  if (isNsfw) {
    if (contexts.length == 1) {
      return sendMediaNsfwResponse(context)
    } else {
      return sendMediaGroupNsfwResponse(contexts)
    }
  } else if (sendNotNsfwResponse) {
    return context.reply("🌺 Это не похоже на NSFW-контент.", { reply_to_message_id: message.message_id })
  }

  return Promise.resolve()
}

async function sendMediaNsfwResponse(context: Context): Promise<any> {
  const message = context.message
  const photo = await context.getFile()

  return context.replyWithPhoto(photo.file_id, {
    caption: getNsfwResponseCaption(message.from, message.caption),
    has_spoiler: true,
    parse_mode: "HTML",
    reply_to_message_id: message.message_id
  })
}

async function sendMediaGroupNsfwResponse(contexts: Array<Context>): Promise<any> {
  const firstContext = contexts[0]
  const firstMessage = firstContext.message

  let spoileredPhotos = await Promise.all(contexts
      .map((context) => context.getFile())
      .map(async (file) => {
        return {
          type: "photo",
          media: (await file).file_id,
          has_spoiler: true
        } as InputMediaPhoto
      }))

  spoileredPhotos[0].caption = getNsfwResponseCaption(firstMessage.from, firstMessage.caption)
  spoileredPhotos[0].parse_mode = "HTML"

  return firstContext.replyWithMediaGroup(spoileredPhotos)
}

function getNsfwResponseCaption(sender: User, caption: String): string {
  const visibleName = [sender.first_name || '', sender.last_name || ''].join(' ')
  const link = sender.username
      ? `https://t.me/${sender.username}`
      : null

  return `
🍒 от ${link ? `<a href="${link}">${visibleName}</a>` : visibleName} ${caption ? `\n${caption}` : ''}

<tg-spoiler>
AI <a href="t.me/${bot.botInfo.username}">Spoiler Nudes 🍒</a>
посчитал это NSFW-контентом
</tg-spoiler>
`
}