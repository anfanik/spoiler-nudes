import {nsfwSpyEngine} from "@/engine/nsfwSpy";

export default interface Engine {
    code: string
    name: string
    initialize: () => Promise<void>
    classify: (image) => Promise<boolean>
}

export const engine = nsfwSpyEngine