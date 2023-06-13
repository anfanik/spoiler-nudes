import {Context, InputFile} from "grammy";
import bot from "@/helper/bot";
import fileUrl from "@/helper/fileUrl";

export default async function handleDebugItCommand(context: Context) {
    const message = context.message
    const args = context.message.text.split(" ").splice(1)

    const reply = message.reply_to_message

    if (args[0] == "update") {
        void bot.api.sendMessage(message.from.id, `<code>${JSON.stringify(context.update, null, 4)}</code>`, {
            parse_mode: "HTML"
        })
    } else if (args[0] == "photo") {
        if (reply) {
            const photo = reply.photo[reply.photo.length - 1]

            void bot.api.sendPhoto(message.from.id, photo.file_id, {
                caption: `Replied photo`
            })
        } else {
            void bot.api.sendMessage(message.from.id, "There is no photo in the reply message")
        }
    } else {
        void bot.api.sendMessage(message.from.id, `Pass one of arguments!\n${["update", "photo"].map(it => `<b>${it}</b>`).join(", ")}`,{
            parse_mode: "HTML"
        })
    }

    void context.deleteMessage()
}