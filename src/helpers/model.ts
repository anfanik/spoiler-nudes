import * as nsfwjs from 'nsfwjs'
import {NSFWJS} from "nsfwjs";
import * as console from "console";

let model: NSFWJS

export async function loadModel() {
    model = await nsfwjs.load()
}

export default function getModel() {
    return model
}
