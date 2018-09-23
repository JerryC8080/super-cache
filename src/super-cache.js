/**
 * SuperCache
 */

import { log } from "./inner-log";

/** Class SuperCache. */
class SuperCache {

    /**
     * @callback storageSet
     * @param {string} key 需要获取数据的 key
     * @param {*} data 需要存储的数据
     */

    /**
     * @callback storageGet
     * @param {string} key 需要获取数据的 key
     * @returns {Promise | *} 如果返回非 Promise，内部会转化为 Promise
     */

    /**
     * Create an instance of SuperCache
     * @param {object} options 配置信息
     * @param {object} options.storage 外部需要定义的数据存储器
     * @param {storageSet} options.storage.set 数据保存
     * @param {storageGet} options.storage.get 数据获取
     * @param {boolean} [options.ignoreCache=false] 是否忽略缓存
     * @param {boolean} [options.updateCache=true] 是否更新缓存
     * @param {object} [options.log] 允许改变内部的 log 库
     *
     */
    constructor({
        ignoreCache = false,
        updateCache = true,
        storage,
        log,
    } = {}) {
        this.adapters = {};

        if (!storage) throw new Error('storage must exit');
        if (typeof storage.get !== 'function') throw new Error('storage.get must typeof function');
        if (typeof storage.set !== 'function') throw new Error('storage.set must typeof function');
        this.getData = key => storage.get.call(this, `super-cache:${key}`);
        this.setData = (key, value) => storage.set.call(this, `super-cache:${key}`, value);
        this.log = log;

        this.defaultOpt = { ignoreCache, updateCache };
    }

    /**
     * Get value
     * @param {string} key 需要获取数据的 key
     * @param {object} options 配置信息
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
     * @param {*} value key 对应的数据
     */
    set(key, value) {
        this.setData(key, value);
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
