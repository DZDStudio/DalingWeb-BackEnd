import nodemailer from "nodemailer"

import fs from "fs"

import Logger from "./Logger.js"
import Config from "./Config.js"

const logger = new Logger("Mail")

const conf : Config = new Config("Mail")
const _host : string = conf.init("host", "smtpdm.aliyun.com")
const _port : number = conf.init("port", 465)
const _secure : boolean = conf.init("secure", true)
const _user : string = conf.init("user", "notify@daling.ac.cn")
const _pass : string = conf.init("pass", "***")

// 缓存 HTML 模板
const _cache : Map<string, string> = new Map()
try {
    // 同步读取
    let templateFiles = fs.readdirSync("../template")

    for (let file of templateFiles) {
        // 读取文件
        let data = fs.readFileSync(`../template/${file}`, "utf8")

        // 缓存
        _cache.set(file.split(".")[0], data)
        logger.debug(`读取模板文件：${file.split(".")[0]}`)
    }
} catch (err) {
    logger.fatal(`读取模板文件时出现错误:${err}`)
}

// 创建邮件发送器
const _transporter : nodemailer.Transporter = nodemailer.createTransport({
    host: _host,
    port: _port,
    secure: _secure,
    auth: {
        user: _user,
        pass: _pass
    }
})

export default class Mail {
    /**
     * 发送验证码
     * @param to 接收者
     * @param userName 用户名
     * @param operate 操作
     * @return Promise<void>
     */
    public static async sendVerificationCode (to : string, userName : string, operate : string, code : string) : Promise<void> {
        return new Promise((resolve, reject) => {
            // 读取模板
            let html = _cache.get("VerificationCode")

            // 替换模板
            html = html.replace(/{{name}}/g, userName)
            html = html.replace(/{{operate}}/g, operate)
            html = html.replace(/{{code}}/g, code)

            // 发送邮件
            _transporter.sendMail({
                from: `DalingOnline 运维团队<${_user}>`,
                to: to,
                subject: "DalingOnline 运维团队 - 验证码",
                html: html
            }).then(() => {
                logger.debug(`发送验证码邮件成功：${to}`)
                resolve()
            }).catch(err => {
                logger.fatal(`发送验证码邮件失败：${to}，错误信息：${err}`)
                reject()
            })
        })
    }

    /**
     * 发送通知
     * @param to 接收者
     * @param userName 用户名
     * @param title 标题
     * @param content 内容
     * @return Promise<void>
     */
    public static async sendNotify (to : string, userName : string, title : string, content : string) : Promise<void> {
        return new Promise((resolve, reject) => {
            // 读取模板
            let html = _cache.get("Notify")

            // 替换模板
            html = html.replace(/{{name}}/g, userName)
            html = html.replace(/{{title}}/g, title)
            html = html.replace(/{{content}}/g, content)

            // 发送邮件
            _transporter.sendMail({
                from: `DalingOnline 运维团队<${_user}>`,
                to: to,
                subject: `DalingOnline 运维团队 - ${title}`,
                html: html
            })
        })
    }
}