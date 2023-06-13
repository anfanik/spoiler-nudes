import Engine from "@/engine/engine";
import {NsfwSpy} from "@nsfwspy/node";

let model: NsfwSpy

async function initialize() {
    model = new NsfwSpy()
    await model.load()
}

async function classify(data: Buffer): Promise<boolean> {
    const result = await model.classifyImageFromByteArray(data)
    return result.isNsfw
}

export const nsfwSpyEngine: Engine = {
    code: "nsfwSpy",
    name: 'NsfwSpy',
    initialize: initialize,
    classify: classify
}
