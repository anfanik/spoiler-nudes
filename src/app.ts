import 'reflect-metadata'

// Setup @/ aliases for modules
import 'module-alias/register'

// Config dotenv
import * as dotenv from 'dotenv'
// Dependencies
import {run} from '@grammyjs/runner'
import Cluster from '@/helpers/Cluster'
import bot from '@/helpers/bot'
import handlePhoto from "@/handlers/handlePhoto";
import logger, {runAndLog, runAndLogPromise} from "@/helpers/logger";
import {engine} from "@/engine/engine";

dotenv.config({ path: `${__dirname}/../.env` })

async function runApp() {
  runAndLog("Initializing events", initializeEvents)
  await runAndLogPromise(`Initializing '${engine.code}' engine`, engine.initialize)
  await runAndLog("Initializing Telegram bot", initializeTelegramBot)
}

function initializeEvents() {
  bot.on(':photo', handlePhoto)
}

async function initializeTelegramBot() {
  bot.catch(console.error)
  await bot.init()
  run(bot)
}

if (Cluster.isPrimary) {
  runAndLogPromise("Starting app", runApp)
      .then(() => logger.info(`Bot @${bot.botInfo.username} is up and running.`))
}
