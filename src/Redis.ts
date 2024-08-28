import * as redis from 'redis'

import Logger from "./Logger.js"
import Config from "./Config.js"

const logger = new Logger("Redis")

const conf : Config = new Config("Redis")
const _host : string = conf.init("host", "10.0.0.5")
const _port : number = conf.init("port", 6379)
const _pwd : string = conf.init("pass", "***")

// 创建 Redis 客户端
const _client : redis.RedisClientType = redis.createClient({
    url: `redis://${_host}:${_port}`,
    password: _pwd,
    socket: {
        reconnectStrategy: (retries) => {
            logger.error(`Redis 重连失败，重试次数：${retries}`)
            return Math.min(retries * 100, 10000)
        }
    }
})

// 连接 Redis
_client.connect().catch(err => {
    logger.fatal(`连接 Redis 时出现错误:${err}`)
})

export default class Redis {
    /**
     * 设置数据
     * @param key 键
     * @param value 值
     * @param time 剩余时间(秒)
     * @returns Promise<void>
     */
    public static async set (key : string, value : any, time : number) : Promise<void> {
        return new Promise((resolve, reject) => {
            _client.set(key, value, {
                EX: time
            }).then(() => {
                resolve()
            }).catch(err => {
                logger.error(`更新 Redis 数据时出现错误:${err}`)
                reject(err)
            })
        })
    }

    /**
     * 获取数据
     * @param key 键
     * @returns Promise<string>
     */
    public static async get (key : string) : Promise<string> {
        return new Promise((resolve, reject) => {
            _client.get(key).then(value => {
                resolve(value)
            }).catch(err => {
                logger.error(`获取 Redis 数据时出现错误:${err}`)
                reject(err)
            })
        })
    }

    /**
     * 获取时间
     * @param key 键
     * @returns Promise<number>
     */
    public static async ttl (key : string) : Promise<number> {
        return new Promise((resolve, reject) => {
            _client.ttl(key).then(value => {
                resolve(value)
            }).catch(err => {
                logger.error(`获取 Redis 数据剩余时间时出现错误:${err}`)
                reject(err)
            })
        })
    }

    /**
     * 删除数据
     * @param key 键
     * @returns Promise<void>
     */
    public static async del (key : string) : Promise<void> {
        return new Promise((resolve, reject) => {
            _client.del(key).then(() => {
                resolve()
            }).catch(err => {
                logger.error(`删除 Redis 数据时出现错误:${err}`)
                reject(err)
            })
        })
    }
}