import jwt from "jsonwebtoken"
import * as uuid from "uuid"

import Config from "./Config.js"
import MongoDB from "./MongoDB.js"

const tokenConf : Config = new Config("Token")
const _tokenSecret : string = tokenConf.init("tokenSecret", "114514")
const _loginValidTime : number = tokenConf.init("loginValidTime", 30)

export type userData = {
    "uuid": string
    "javaid": string
    "xboxid": string
    "qq": number
    "name": string
    "mail": string
    "pwd": string
    "session": Array<Session>
    "currentSession": string
    "permissions": Array<string>
    "money": [number, number]
}

export type sessionData = {
    "ip" : string,
    "source": string
    "version": string
    "browser": string
    "os": string
    "platform": string
}

export type Session = {
    "sessionId": string,
    "ip" : string,
    "loginTime": number,
    "source": string
    "version": string
    "browser": string
    "os": string
    "platform": string
}

export type TokenData = {
    "uuid": string
    "sessionId": string
}

export class User {
    /**
     * 获取token
     * @param userUuid 用户 UUID
     * @param sessionData 会话数据
     * @returns {string} token
     */
    public static async getToken (userUuid : string, sessionData : sessionData) {
        return new Promise<string>((resolve, reject) => {
            // 获取用户数据
            MongoDB.get("users", {
                uuid: userUuid
            }).then((res : Array<userData>) => {
                // 不存在
                if (res.length == 0) {
                    reject("用户不存在")
                    return
                }

                let user = res[0]
                let session : Session = {
                    sessionId: uuid.v4(),
                    ip: sessionData.ip,
                    loginTime: Date.now(),
                    source: sessionData.source,
                    version: sessionData.version,
                    browser: sessionData.browser,
                    os: sessionData.os,
                    platform: sessionData.platform
                }

                // 更新 session
                user.session.push(session)
                MongoDB.upData("users", {
                    uuid: userUuid
                }, {
                    $set: {
                        session: user.session
                    }
                })

                // 生成 token
                let token = jwt.sign({
                    uuid: userUuid,
                    sessionId: session.sessionId
                }, _tokenSecret, {
                    expiresIn: _loginValidTime + "d"
                })

                resolve(token)
            }).catch(err => {
                reject(err)
            })
        })
    }

    // 验证token
    public static async verifyToken (token : string) {
        return new Promise<userData | null>((resolve, reject) => {
            // 还原
            let { uuid , sessionId } : TokenData = jwt.verify(token, _tokenSecret) as TokenData

            // 读取用户信息
            MongoDB.get("users", {
                uuid
            }).then((res : Array<userData>) => {
                // 不存在
                if (res.length == 0) {
                    resolve(null)
                    return
                }

                let user = res[0]

                // 获取 session 信息
                let session : Session = user.session.find((session : Session) => {
                    return session.sessionId == sessionId
                })

                // 不存在
                if (session == undefined) {
                    resolve(null)
                    return
                }

                // 超过有效期
                if (Date.now() - session.loginTime > _loginValidTime * 24 * 60 * 60 * 1000) {
                    resolve(null)
                    return
                }

                user.currentSession = session.sessionId
            
                resolve(user)
            }).catch(err => {
                reject(err)
            })
        })
    }

    // 下线设备
    public static async offline (userUuid : string, sessionId : string) {
        return new Promise<void>((resolve, reject) => {
            // 获取用户数据
            MongoDB.get("users", {
                uuid: userUuid
            }).then((res : Array<userData>) => {
                // 不存在
                if (res.length == 0) {
                    reject("用户不存在")
                    return
                }

                let user = res[0]

                // 获取 session 信息
                let session : Session = user.session.find((session : Session) => {
                    return session.sessionId == sessionId
                })

                //不存在
                if (session == undefined) {
                    reject("会话不存在")
                    return
                }

                MongoDB.upData("users", {
                    uuid: userUuid
                }, {
                    $pull: {
                        session: {
                            sessionId: sessionId
                        }
                    }
                }).then(() => {
                    resolve()
                }).catch(err => {
                    reject("数据库错误")
                })
            })
        })
    }

    // 下线所有设备
    public static async offlineAll (userUuid : string) {
        return new Promise<void>((resolve, reject) => {
            // 获取用户数据
            MongoDB.get("users", {
                uuid: userUuid
            }).then((res : Array<userData>) => {
                // 不存在
                if (res.length == 0) {
                    reject("用户不存在")
                    return
                }

                MongoDB.upData("users", {
                    uuid: userUuid
                }, {
                    $set: {
                        session: []
                    }
                }).then(() => {
                   resolve()
                })
            })
        })
    }
}