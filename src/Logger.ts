import fs from "fs"
import Config from "./Config.js"

const conf : Config = new Config("Logget")
const _logLevel : number = conf.init("LogLevel", 4)
const _isOutFile : boolean = conf.init("isOutFile", true)
const _logFiles : string = conf.init("logFiles", "../logs")

/**
 * 日志管理器
 */
export default class Logger {
    protected _title : string

    /**
     * 获取当前时间
     * @param toDay 是否只获取日期 
     */
    protected _getTime (toDay : boolean = false) : string {
        let date = new Date()

        if ( toDay ) {
            return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`
        } else {
            return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        }
    }

    /**
     * 输出消息到文件
     * @param msg 消息内容
     */
    protected _outFiles (msg : string):void {
        // 不写入文件
        if ( !_isOutFile ) return

        // 获取当前时间字符串
        let time = this._getTime(true)

        try {
            // 创建文件夹
            if ( !fs.existsSync(_logFiles) ) {
                fs.mkdirSync(_logFiles)
            }

            // 创建文件
            if ( !fs.existsSync(`${_logFiles}/${time}.log`) ) {
                fs.writeFileSync(`${_logFiles}/${time}.log`, "")
            }

            // 写入文件
            fs.appendFileSync(`${_logFiles}/${time}.log`, `${msg}\n`)
        } catch (err) {
            console.error(`写入日志文件"${_logFiles}/${time}.log"时出现错误:${err}`)
        }
    }

    /**
     * 日志管理器
     * @param title 日志头
     */
    public constructor (title : string) {
        this._title = title
    }

    /**
     * 设置日志头
     * @param title 日志头
     */
    public setTitle (title : string) : void {
        this._title = title
    }

    /**
     * 输出调试消息
     * @param msg 消息内容
     */
    public debug (msg: string): void {
        // 获取当前时间字符串
        let time = this._getTime()

        if (_logLevel >= 5) {
            // 使用ANSI转义序列设置颜色
            const color = '\x1b[36m' // 青色
            const reset = '\x1b[0m'
            console.log(`${time} ${color}DEBUG${reset} [${this._title}]`, msg)
            this._outFiles(`${time} DEBUG [${this._title}] ${msg}`)
        }
    }

    /**
     * 输出普通消息
     * @param msg 消息内容
     */
    public info (msg: string): void {
        // 获取当前时间字符串
        let time = this._getTime()

        if (_logLevel >= 4) {
            const color = '\x1b[32m'; // 绿色
            const reset = '\x1b[0m';
            console.log(`${time} ${color}INFO${reset} [${this._title}]`, msg);
            this._outFiles(`${time} INFO [${this._title}] ${msg}`);
        }
    }

    /**
     * 输出警告消息
     * @param msg 消息内容
     */
    public warn (msg: string): void {
        // 获取当前时间字符串
        let time = this._getTime();

        if (_logLevel >= 3) {
            const color = '\x1b[33m'; // 黄色
            const reset = '\x1b[0m';
            console.log(`${time} ${color}WARN${reset} [${this._title}]`, msg);
            this._outFiles(`${time} WARN [${this._title}] ${msg}`);
        }
    }

    /**
     * 输出错误消息
     * @param msg 消息内容
     */
    public error (msg: string): void {
        // 获取当前时间字符串
        let time = this._getTime();

        if (_logLevel >= 2) {
            const color = '\x1b[31m' // 红色
            const reset = '\x1b[0m'
            console.log(`${time} ${color}ERROR${reset} [${this._title}]`, msg)
            this._outFiles(`${time} ERROR [${this._title}] ${msg}`)
        }
    }

    /**
     * 输出致命错误消息
     * @param msg 消息内容
     */
    public fatal (msg: string): void {
        // 获取当前时间字符串
        let time = this._getTime()

        if (_logLevel >= 1) {
            const color = '\x1b[41m' // 背景红色
            const reset = '\x1b[0m'
            console.log(`${time} ${color}FATAL${reset} [${this._title}]`, msg)
            this._outFiles(`${time} FATAL [${this._title}] ${msg}`)
        }
    }
}