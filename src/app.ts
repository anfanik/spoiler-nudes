import 'reflect-metadata'

// Setup @/ aliases for modules
import 'module-alias/register'

// Config dotenv
import * as dotenv from 'dotenv'
// Dependencies
import {run} from '@grammyjs/runner'
import Cluster from '@/helper/Cluster'
import handlePhoto from "@/handler/handlePhoto";
import logger, {runAndLog, runAndLogPromise} from "@/helper/logger";
import {engine} from "@/engine/engine";
import handleDebugItCommand from "@/command/handleDebugItCommand";
import bot, {registerCommand} from "@/helper/bot";
import checkSuperAdmin from "@/middleware/checkSuperAdmin";

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
  bot.use(ignoreOldMessageUpdates)
  registerCommand("debugit", checkSuperAdmin, handleDebugItCommand)
  bot.catch(console.error)

  await bot.init()
  run(bot)
}

if (Cluster.isPrimary) {
  runAndLogPromise("Starting app", runApp)
      .then(() => logger.info(`Bot @${bot.botInfo.username} is up and running.`))
}
