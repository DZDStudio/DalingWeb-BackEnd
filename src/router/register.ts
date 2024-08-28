import Utils from "../Utils.js"
import MongoDB from "../MongoDB.js"
import Logger from "../Logger.js"
import Redis from "../Redis.js"
import Mail from "../Mail.js"
import CloudflareTurnstile from "../CloudflareTurnstile.js"

const logger : Logger = new Logger("Register")

export default async (router : any) => {
    // 用户名邮箱重名检测
    router.post("/register/checkNameAndMail", async (ctx : any) => {
        // 获取 get 参数
        let name = ctx.request.body.name
        let mail = ctx.request.body.mail

        // 缺少参数
        if (!name || !mail) {
            ctx.body = {
                code: 400,
                msg: "缺少参数。"
            }
            return
        }

        // 是否已经存在
        if (await MongoDB.get("users", {
            $or: [
                {
                    name: name
                },
                {
                    mail: mail
                }
            ]
        }).then(res => {
            return res.length > 0
        })) {
            ctx.body= {
                code: 200,
                msg: "用户名或邮箱已被注册。",
                data: {
                    "isExist": true,
                }
            }
        } else {
            ctx.body = {
                code: 200,
                msg: "用户名或邮箱未被注册。",
                data: {
                    "isExist": false,
                }
            }
        }
    })

    // 获取验证码
    router.get("/register/getVerificationCode", async (ctx : any) => {
        // 获取参数
        let userMail = ctx.request.query.mail
        let userName = ctx.request.query.name
        let CFToken = ctx.request.query.CFToken

        // 缺少参数
        if (!userMail || !userName || !CFToken) {
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
        const sendTIme = await Redis.ttl("mail_register_code_" + userMail)
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

        // 验证码
        let code = Math.random().toString().slice(2, 8)

        // 缓存
        await Redis.set("mail_register_code_" + userMail, code, 60 * 5)

        // 发送邮件
        await Mail.sendVerificationCode(userMail, userName, "注册账户", code).then(() => {
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

    // 注册
    router.post("/register", async (ctx : any) => {
        // 获取 post 参数
        let name = ctx.request.body.name
        let mail = ctx.request.body.mail
        let pwd = Utils.getHash(ctx.request.body.pwd)
        let code = ctx.request.body.code

        // 缺少参数
        if (!name || !mail || !pwd || !code) {
            ctx.body = {
                code: 400,
                msg: "缺少参数。"
            }
            return
        }

        // 验证码是否存在
        if (await Redis.get("mail_register_code_" + mail) == null) {
            ctx.body = {
                code: 400,
                msg: "验证码错误或无效。"
            }
            return
        }

        // 验证码是否存在以及是否匹配
        const storedCode = await Redis.get("mail_register_code_" + mail);
        if (storedCode === null || storedCode !== code) {
            ctx.body = {
                code: 400,
                msg: "验证码错误或无效。"
            }
            return
        }

        // 插入
        await MongoDB.add("users", {
            "uuid": Utils.generateMinecraftJEUUID(),
            "javaid": "",
            "xboxid": "",
            "qq": 0,
            "name": name,
            "mail": mail,
            "pwd": pwd,
            "session": [], // 会话
            "permissions": ["player"],// 权限
            "money": [0, 0]// 货币
        }).then(() => {
            // 删除验证码
            Redis.del("mail_register_code_" + mail)

            // 发送通知
            Mail.sendNotify(mail, name, "账户注册成功", `您的 DalingOnline 账户注册成功，欢迎加入我们！`)

            ctx.body = {
                code: 200,
                msg: "注册成功。"
            }
        }).catch(err => {
            logger.error("数据库错误：" + err)
            ctx.body = {
                code: 400,
                msg: "数据库错误!"
            }
        })
    })
}