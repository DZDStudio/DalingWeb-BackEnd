import axios from "axios"

import Logger from "./Logger.js"
import Config from "./Config.js"

const logger : Logger = new Logger("CloudflareTurnstile")
const CloudflareTurnstileConf : Config = new Config("CloudflareTurnstile")

let CFToken_Key = CloudflareTurnstileConf.init("CFToken_Key", "")
let useIP = CloudflareTurnstileConf.init("useIP", false)

export default class CloudflareTurnstile {
    /**
     * 人机验证
     * @param CFToken CloudflareToken
     * @param ip IP
     * @returns Promise<any>
     */
    public static robotVerify (CFToken : string, ip : string) : Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = {
                    secret: CFToken_Key,
                    response: CFToken,
                    remoteip: ip
                }
                if (!useIP) {
                    delete data.remoteip
                }
            
                const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', data)
            
                const { success, score, error_codes } = response.data
            
                if (success) {
                    resolve({
                        success: success,
                        score: score,
                        error_codes: error_codes
                    })
                } else {
                    resolve({
                        success: success,
                        score: score,
                        error_codes: error_codes
                    })
                }
            } catch (err) {
                reject(err)
            }
        })
    }
}