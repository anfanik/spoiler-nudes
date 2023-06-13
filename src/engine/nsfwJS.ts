import tensorflow from "@/helpers/tf";
import Engine from "@/engine/engine";
import * as nsfwjs from "nsfwjs";
import {NSFWJS} from "nsfwjs";

let model: NSFWJS

async function initialize() {
    tensorflow.enableProdMode()
    model = await nsfwjs.load()
}

async function classify(data: Buffer): Promise<boolean> {
    const image = await tensorflow.node.decodeImage(data)
    const predictions = await model.classify(image)
    image.dispose()

    let nsfwProbability = 0.0
    for (let prediction of predictions) {
        const className = prediction.className
        if (className == 'Porn' || className == 'Sexy' || className == 'Hentai') {
            nsfwProbability += prediction.probability
        }
    }
    return nsfwProbability >= 0.5
}

export const nsfwJSEngine: Engine = {
    code: "nsfwJS",
    name: 'NsfwJS',
    initialize: initialize,
    classify: classify
}