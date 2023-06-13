import pino from 'pino'
import pretty from 'pino-pretty'

const logger = pino(pretty({ colorize: true }))

export function runAndLog(action: string, func: Function) {
    logger.info(`${action}.`)

    try {
        let result = func()
        logger.info(`${action} is done.`)
        return result
    } catch (error) {
        logger.error(`${action} is not done because of unexpected error: ${error}.`)
    }
}

export async function runAndLogPromise(action: string, promiser: Function) {
    const start = new Date().getTime()
    logger.info(`${action}...`)
    const promise = promiser() as Promise<any>

    promise.then(
        () => {
            const end = new Date().getTime()
            logger.info(`${action} is done in ${(end - start) / 1000} seconds.`)
        },
        error => {
            const end = new Date().getTime()
            logger.error(`${action} is not done after ${(end - start) / 1000} seconds because of unexpected error: ${error}.`)
        }
    )
    return promise
}

export default logger