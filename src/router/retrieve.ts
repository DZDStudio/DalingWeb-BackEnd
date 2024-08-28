import Utils from "../Utils.js"
import MongoDB from "../MongoDB.js"
import Logger from "../Logger.js"
import Redis from "../Redis.js"
import Mail from "../Mail.js"
import CloudflareTurnstile from "../CloudflareTurnstile.js"
import { User , userData , Session } from "../User.js"

const logger : Logger = new Logger("Retrieve")

export default async (router : any) => {
    // 用户名邮箱重名检测
    router.post("/retrieve/checkMail", async (ctx : any) => {
        // 获取 get 参数
        let mail = ctx.request.body.mail

        // 缺少参数
        if (!mail) {
            ctx.body = {
                code: 400,
                msg: "缺少参数。"
            }
            return
        }

        // 是否已经存在
        if (await MongoDB.get("users", {
            mail: mail
        }).then(res => {
            return res.length > 0
        })) {
            ctx.body= {
                code: 200,
                msg: "邮箱存在。",
                data: {
                    "isExist": true,
                }
            }
        } else {
            ctx.body = {
                code: 200,
                msg: "邮箱不存在。",
                data: {
                    "isExist": false,
                }
            }
        }
    })

    // 获取验证码
    router.get("/retrieve/getVerificationCode", async (ctx : any) => {
        // 获取参数
        let userMail = ctx.request.query.mail
        let CFToken = ctx.request.query.CFToken

        // 缺少参数
        if (!userMail || !CFToken) {
            ctx.body = {
                code: 400,
                msg: "缺少参数。"
            }
            return
        }

        // 人机验证
        let robotVerifyRes = await CloudflareTurnstile.robotVerify(CFToken, ctx.ip).catch(err => {
            logger.error("人机验证时出错：" + err)
            ctx.body = {
                code: 400,
                msg: "连接人机验证服务失败！"
            }
            return
        })
        if (!robotVerifyRes.success) {
            ctx.body = {
                code: 400,
                msg: "人机验证失败。"
            }
            return
        }

        // 刚发送
        const sendTIme = await Redis.ttl("mail_retrieve_code_" + userMail)
        if (sendTIme > 60 * 4) {
            ctx.body = {
                code: 400,
                msg: `验证码发送过于频繁，请于${sendTIme - 60 * 3}秒后在试。`,
                data: {
                    time: sendTIme - 60 * 3
                }
            }
            return
        }

        // 获取名称
        let userName = await MongoDB.get("users", {
            mail: userMail
        }).then((res : userData[]) => {
            return res[0].name
        })

        // 验证码
        let code = Math.random().toString().slice(2, 8)

        // 缓存
        await Redis.set("mail_retrieve_code_" + userMail, code, 60 * 5)

        // 发送邮件
        await Mail.sendVerificationCode(userMail, userName, "找回密码", code).then(() => {
            ctx.body = {
                code: 200,
                msg: "发送成功。"
            }
        }).catch(() => {
            ctx.body = {
                code: 500,
                msg: "发送邮件失败！"
            }
        })
    })

    // 找回
    router.post("/retrieve", async (ctx : any) => {
        // 获取 post 参数
        let mail = ctx.request.body.mail
        let pwd = Utils.getHash(ctx.request.body.pwd)
        let code = ctx.request.body.code

        // 缺少参数
        if (!mail || !pwd || !code) {
            ctx.body = {
                code: 400,
                msg: "缺少参数。"
            }
            return
        }

        // 验证码是否存在
        if (await Redis.get("mail_retrieve_code_" + mail) == null) {
            ctx.body = {
                code: 400,
                msg: "验证码错误或无效。"
            }
            return
        }

        // 验证码是否存在以及是否匹配
        const storedCode = await Redis.get("mail_retrieve_code_" + mail);
        if (storedCode === null || storedCode !== code) {
            ctx.body = {
                code: 400,
                msg: "验证码错误或无效。"
            }
            return
        }

        // 更新密码
        await MongoDB.upData("users", {
            "mail": mail
        }, {
            $set:{
                "pwd": pwd
            }
        }).then(async () => {
            // 删除验证码
            Redis.del("mail_retrieve_code_" + mail)

            // 发送通知
            Mail.sendNotify(mail, mail, "账户找回成功", `您的 DalingOnline 账户找回成功，欢迎回来！`)

            // 获取 uuid
            let userUuid = await MongoDB.get("users", {
                mail: mail
            }).then((res : userData[]) => {
                return res[0].uuid
            })

            // 下线所有设备
            User.offlineAll(userUuid)

            ctx.body = {
                code: 200,
                msg: "找回成功。"
            }
        }).catch(err => {
            logger.error("数据库错误：" + err)
            ctx.body = {
                code: 400,
            }
        })
    })
}