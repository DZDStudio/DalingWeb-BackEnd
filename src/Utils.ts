import * as uuid from "uuid"
import crypto from "crypto"

export default class Utils {

    /**
     * 生成 UUID
     * @returns {string} 生成的UUID
     */
    public static generateMinecraftJEUUID() {
        const formattedUUID = uuid.v4().replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, "$1-$2-$3-$4-$5")
        
        return formattedUUID
    }

    /**
     * 生成哈西 512 字符串
     * @param data 数据
     * @returns 哈西 512 字符串
     */
    public static getHash (data : string) : string {
        if (data == null) return null

        const hash = crypto.createHash("sha512")
        hash.update(data)
        return hash.digest('hex')
    }

    /**
     * 生成随机字符串
     * @param length 字符串长度
     * @returns 随机字符串
     */
    public static generateRandomString(length : number = 8) : string {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += characters[Math.floor(Math.random() * characters.length)]
        }
        return result
    }
}