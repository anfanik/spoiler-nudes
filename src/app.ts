import 'reflect-metadata'

// Setup @/ aliases for modules
import 'module-alias/register'

// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })
// Dependencies
import { run } from '@grammyjs/runner'
import Cluster from '@/helpers/Cluster'
import bot from '@/helpers/bot'
import handlePhoto from "@/handlers/handlePhoto";
import nsfwSpy from "@/helpers/nsfwSpy";

async function runApp() {
  console.log('Starting app...')

  // Various events
  console.log('Initializing events...')
  bot.on(':photo', handlePhoto)
  console.log('Events are successfully initialized.')

  // Errors
  bot.catch(console.error)

  console.log("Initializing NsfwSpy")
  await nsfwSpy.load()
  console.log("NsfwSpy are successfully initialized.")

  await bot.init()
  run(bot)
  console.info(`Bot ${bot.botInfo.username} is up and running`)
}

if (Cluster.isPrimary) {
  void runApp()
}
