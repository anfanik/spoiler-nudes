import { Bot, Context as BaseContext } from 'grammy'

const bot = new Bot<BaseContext>(process.env.TOKEN)

export default bot
