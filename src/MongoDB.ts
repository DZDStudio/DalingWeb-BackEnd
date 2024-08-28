import { MongoClient } from "mongodb"

import Logger from "./Logger.js"
import Config from "./Config.js"

const logger : Logger = new Logger("MongoDB")

const conf : Config = new Config("MongoDB")
const _url : string = conf.init("url", "mongodb://daling:114514@10.0.0.5/daling")
const _maxPoolSize : number = conf.init("maxPoolSize", 20)
const _minPoolSize : number = conf.init("minPoolSize", 3)

const _MongoDB = new MongoClient(_url, {
    maxPoolSize: _maxPoolSize,
    minPoolSize: _minPoolSize
})

_MongoDB.connect().catch(err => {
    logger.fatal(`连接 MongoDB 时出现错误:${err}`)
})

export default class MongoDB {
    /**
     * 添加数据
     * @param collectionName 集合名称
     * @param data 数据
     * @returns Promise<void>
     */
    public static async add (collectionName : string, data : Object | Array<Object>) : Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (Array.isArray(data)) {
                    await _MongoDB.db().collection(collectionName).insertMany(data)
                } else {
                    await _MongoDB.db().collection(collectionName).insertOne(data)
                }

                resolve()
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * 查找数据
     * @param collectionName 集合名称
     * @param query 查询条件
     * @param limit 限制数量
     * @returns Promise<Array<Object>>
     */
    public static async get (collectionName : string, query : Object, limit : number = 0) : Promise<Array<Object>> {
        return new Promise(async (resolve, reject) => {
            try {
                if (limit > 0) {
                    const result = await _MongoDB.db().collection(collectionName).find(query).limit(limit).toArray()

                    resolve(result)
                } else {
                    const result = await _MongoDB.db().collection(collectionName).find(query).toArray()

                    resolve(result)
                }
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * 更新数据
     * @param collectionName 集合名称
     * @param query 查询条件
     * @param data 更新数据
     * @returns Promise<void>
     */
    public static async upData (collectionName : string, query : Object | Array<Object>, data : Object) : Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (Array.isArray(query)) {
                    await _MongoDB.db().collection(collectionName).updateMany(query, data)
                } else {
                    await _MongoDB.db().collection(collectionName).updateOne(query, data)
                }

                resolve()
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * 删除数据
     * @param collectionName 集合名称
     * @param query 查询条件
     * @returns Promise<void>
     */
    public static async remove (collectionName : string, query : Object | Array<Object>) : Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (Array.isArray(query)) {
                    await _MongoDB.db().collection(collectionName).deleteMany(query)
                } else {
                    await _MongoDB.db().collection(collectionName).deleteOne(query)
                }

                resolve()
            } catch (err) {
                reject(err)
            }
        })
    }
}