import fs from "fs"

/**
 * 配置文件管理器
 */
export default class Config {
    protected _fileName : string
    protected _filePath : string
    protected _config : Map<string, any> = new Map()

    /**
     * 存储配置
     */
    protected _save () : void {
        let data = JSON.stringify(Object.fromEntries(this._config), null, 4)
        
        try {
            fs.writeFileSync(this._filePath, data, "utf8")
        } catch (err) {
            console.log(`写入配置文件"${this._filePath}"时出现错误:${err}`)
        }
    }

    /**
     * 配置文件管理器
     * @param fileName 配置文件名
     */
    public constructor (fileName : string) {
        this._fileName = fileName
        this._filePath = "../config/" + this._fileName + ".json"

        try {
            // 创建文件夹
            if (!fs.existsSync("../config")) {
                fs.mkdirSync("../config")
            }

            // 创建文件
            if (!fs.existsSync(this._filePath)) {
                fs.writeFileSync(this._filePath, "{}", "utf8")
            }
            
            // 读取内容
            let data = JSON.parse(fs.readFileSync(this._filePath, "utf8"))
            this._config = new Map(Object.entries(data))
        } catch (err) {
            console.log(`读取配置文件"${this._filePath}"时出现错误:${err}`)
        }
    }

    /**
     * 初始化配置
     * 此方法会判断配置项是否存在，不存在会使用默认配置值新建并返回，存在即直接返回
     * 如果配置项不存在，会调用回调函数
     * @param key 配置键
     * @param value 配置值
     * @param callback 配置不存在变更回调
     * @returns 配置值
     */
    public init<T> (key : string, value : T, callback : Function = () => {}) : T {
        if ( !this._config.has(key) ) {
            this._config.set(key, value)
            this._save()
        }

        return this._config.get(key)
    }

    /**
     * 获取配置
     * @param key 配置键
     * @returns 配置值
     */
    public get (key : string) : any {
        return this._config.get(key)
    }

    /**
     * 设置配置
     * @param key 配置键
     * @param value 配置值
     */
    public set (key : string, value : any) : void {
        this._config.set(key, value)
        this._save()
    }
}