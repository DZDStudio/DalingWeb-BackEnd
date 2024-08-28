// 事件管理器
const _eventList : Map<string, Array<(...args: any[]) => void>> = new Map()

/**
 * 事件管理器
 */
export default class Event {
    /**
     * 创建事件
     * @param name 事件名称
     */
    public static create<T extends any[]>(name : string) : void {
        if ( !_eventList.has(name) ) {
            _eventList.set(name, [])
        }
    }

    /**
     * 触发事件
     * @param name 事件名称
     * @param args 参数
     */
    public static trigger<T extends any[]>(name : string, ...args : T) : void {
        if ( _eventList.has(name) ) {
            _eventList.get(name).forEach(func => {
                func(...args)
            })
        }
    }

    /**
     * 监听事件
     * @param name 事件名称
     * @param func 回调函数
     */
    public static listen<T extends any[]>(name : string, func : (...args: T) => void) : void {
        if ( _eventList.has(name) ) {
            _eventList.get(name).push(func)
        }
    }
}