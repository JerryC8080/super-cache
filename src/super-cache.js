/**
 * SuperCache
 */

import { log } from "./inner-log";

function initStorage(ins, storage, { keyPrefix }) {

    if (storage === 'memory') {
        this.memoryCache = {};
        storege = {
            get(key) {
                return this.memoryCache[key];
            },
            set(key, value) {
                return this.memoryCache[key] = value;
            },
            remove(key, value) {
                delete this.memoryCache[key];
            },
            removeAll() {
                this.memoryCache = {};
            },
        };
    }

    if (typeof storage.get !== 'function') throw new Error('storage.get must typeof function');
    if (typeof storage.set !== 'function') throw new Error('storage.set must typeof function');
    ins.getData = key => storage.get.call(ins, `${keyPrefix}:${key}`);
    ins.setData = (key, value) => storage.set.call(ins, `${keyPrefix}:${key}`, value);

    if (typeof storege.remove !== 'function') ins.removeData = () => { throw new Error('storage.remove was undefined'); };
    else ins.removeData = key => storage.remove.call(ins, `${keyPrefix}:${key}`);

    if (typeof storege.removeAll !== 'function') ins.removeData = () => { throw new Error('storage.removeAll was undefined'); };
    else ins.removeAll = key => storage.removeAll.call(ins);
}

/** Class SuperCache. */
class SuperCache {

    /**
     * @callback storageSet
     * @param {string} key 需要获取数据的 key
     * @param {*} data storage.get 的返回值
     */

    /**
     * @callback storageRemove
     * @param {string} key 需要获取数据的 key
     * @param {*} data storage.remove 的返回值
     */

    /**
     * @callback storageRemoveAll
     * @param {*} data storage.removeAll 的返回值
     */

    /**
     * @callback storageGet
     * @param {string} key 需要获取数据的 key
     * @returns {Promise | *} 如果返回非 Promise，内部会转化为 Promise
     */

    /**
     * Create an instance of SuperCache
     * @param {object} options 配置信息
     * @param {object} [options.storage] 自定义数据存储器
     * @param {storageSet} options.storage.set 数据保存
     * @param {storageGet} options.storage.get 数据获取
     * @param {storageRemove} [options.storage.remove] 数据删除
     * @param {storageRemoveAll} [options.storage.removeAll] 删除所有数据
     * @param {boolean} [options.ignoreCache=false] 是否忽略缓存
     * @param {boolean} [options.updateCache=true] 是否更新缓存
     * @param {object} [options.log] 允许改变内部的 log 库
     *
     */
    constructor({
        keyPrefix = 'super-cache',
        ignoreCache = false,
        updateCache = true,
        storage,
        log,
    } = {}) {
        this.adapters = {};

        initStorage(this, storage, { keyPrefix });

        this.log = log;
        this.defaultOpt = { ignoreCache, updateCache };
    }

    /**
     * Get value
     * @param {string} key 需要获取数据的 key
     * @param {object} [options] 配置信息
     * @param {boolean} [options.ignoreCache=false] 是否忽略缓存
     * @param {boolean} [options.updateCache=true] 是否更新缓存
     * @param {optionsBeforeGet} [options.beforeGet] 在调用 adapter 获取数据之前的钩子方法
     */
    get(key, options) {
        const domain = {};
        return Promise
            .resolve()
            .then(() => {
                const adapter = this.adapters[key];
                domain.adapter = adapter;
                domain.opt = Object.assign({}, this.defaultOpt, adapter, options);
            })
            .then(() => this.getData(key))
            .then((cacheValue) => { domain.cacheValue = cacheValue; })
            .then(() => {
                // 如果 beforeGet 存在，则执行，然后覆盖 opt
                if (typeof domain.opt.beforeGet === 'function') {
                    return Promise
                        .resolve()
                        .then(() => domain.opt.beforeGet(domain.cacheValue))
                        .then((opt) => { domain.opt = Object.assign({}, domain.opt, opt); });
                }
                return Promise.resolve();
            })

        .then(() => {
            if (typeof domain.cacheValue === 'undefined' || domain.opt.ignoreCache === true) {
                return this
                    .getAdapterValue(key)
                    .then((value) => {
                        if (domain.opt.updateCache === true) this.setData(key, value);
                        return value;
                    });
            }

            if (domain.opt.updateAfterGet) this.updateByAdapter(key);

            return domain.cacheValue;
        });
    }

    /**
     * Set value
     * @param {string} key 需要获取数据的 key
     * @param {*} value storage.remove 的返回结果
     */
    set(key, value) {
        return this.setData(key, value);
    }

    /**
     * Remove value
     * @param {string} key 需要删除数据的 key
     * @param {*} value storage.remove 的返回结果
     */
    remove(key) {
        return this.removeData(key);
    }

    /**
     * Get value by adapter
     * @param {string} key 需要获取数据的 key
     * @returns {Promise}  返回一个 Promise 对象，该对象返回需要获取的数据
     */
    getAdapterValue(key) {
        const adapter = this.adapters[key];
        if (!adapter) throw new Error(`adapter ${key} was undefined`);
        return Promise.resolve().then(() => adapter.data());
    }

    /**
     * Update value by adapter
     * @param {string} key 需要获取数据的 key
     * @returns {Promise} 返回一个 Promise 对象，该对象返回需要获取的数据
     */
    updateByAdapter(key) {
        return this
            .getAdapterValue(key)
            .then((value) => {
                this.setData(key, value);
                return value;
            });
    }


    /**
     * beforeGet callback
     * @callback optionsBeforeGet
     * @param {*} cache 存储在 storage 的缓存数据，如果没有则为 undefined
     * @return {object} runtimeOpt 运行时的配置信息，会暂时覆盖实例的配置
     */

    /**
     * data callback
     * @callback optionsData
     * @returns {Promise} 需要返回一个 Promise 对象，该对象返回需要存储的数据
     */

    /**
     * Add adapter
     * @param {string} key 
     * @param {object|function} options 如果是 object，参数看下面，如果是function，则会变成 options.data = options
     * @param {optionsData} options.data 在调用 adapter，通过该函数来获取数据
     * @param {optionsBeforeGet} [options.beforeGet] 在调用 adapter 获取数据之前的钩子方法
     * @param {boolean} [options.ignoreCache=false] 是否忽略缓存
     * @param {boolean} [options.updateCache=true] 是否更新缓存
     */
    addAdapter(key, options) {
        let adapter = options;
        if (this.adapters[key]) throw new Error(`adapter ${key} not allowed to be repeat definition`);
        if (typeof options === 'function') adapter = { data: options };
        else if (typeof options.data !== 'function') throw new Error('data() must typeof function');
        this.log.info('super-cache:addAdatper', `adapter ${key} was attatched`);
        this.adapters[key] = adapter;
    }
}

export default SuperCache;