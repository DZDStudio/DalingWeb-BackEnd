import Utils from "../Utils.js"
import MongoDB from "../MongoDB.js"
import Logger from "../Logger.js"
import { User , userData , sessionData } from "../User.js"

const logger : Logger = new Logger("Register")

export default async (router : any) => {
    // 验证登录状态
    router.post("/login/verify", async (ctx : any) => {
        let token = ctx.request.body.token

        if (!token) {
            ctx.body = {
                code: 400,
                msg: "未登录",
                data: {
                    isLogin: false
                }
            }
            return
        }

        await User.verifyToken(token).then(async (data) => {
            if(data == null) {
                ctx.body = {
                    code:  200,
                    msg: "未登录",
                    data: {
                        isLogin: false
                    }
                }
            } else {
                ctx.body = {
                    code:  200,
                    msg: "已登录",
                    data: {
                        isLogin: true
                    }
                }
            }
            return
        }).catch((err) => {
            logger.error(`获取用户登录状态时出现错误:${err}`)
            ctx.body = {
                code: 500,
                msg: err
            }
            return
        })
    })

    // 登录
    router.post("/login", async (ctx : any) => {
        // 获取 post 参数
        let mail = ctx.request.body.mail
        let pwd = Utils.getHash(ctx.request.body.pwd)

        // 缺少参数
        if (!mail || !pwd) {
            ctx.body = {
                code: 400,
                msg: "缺少参数。"
            }
            return
        }

        // 验证
        await MongoDB.get("users", {
            mail: mail,
            pwd: pwd
        }).then(async (res : Array<userData>) => {
            // 没有
            if (res.length == 0) {
                ctx.body = {
                    code: 400,
                    msg: "邮箱或密码错误。"
                }
                return
            }

            let user : userData = res[0]
            let sessionData : sessionData = {
                ip: ctx.ip,
                source: ctx.userAgent.source,
                version: ctx.userAgent.version,
                browser: ctx.userAgent.browser,
                os: ctx.userAgent.os,
                platform: ctx.userAgent.platform
            }

            // 获取 token
            let token = await User.getToken(user.uuid, sessionData).catch(err => {
                logger.error("获取 token 时出错：" + err)
                ctx.body = {
                    code: 400,
                    msg: "获取 token 时出错！"
                }
                return
            })

            ctx.body = {
                code: 200,
                msg: "登录成功。",
                data: {
                    token: token
                }
            }
        }).catch(err => {
            logger.error("数据库错误：" + err)
            ctx.body = {
                code: 400,
                msg: "数据库错误!"
            }
        })
        return
    })
}