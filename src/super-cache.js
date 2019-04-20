/**
 * SuperCache
 */

import innerLog from "./inner-log";

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
 * beforeGet callback
 * @callback optionsBeforeGet
 * @param {*} cache 存储在 storage 的缓存数据，如果没有则为 undefined
 * @return {object} runtimeOpt 运行时的配置信息，会暂时覆盖实例的配置
 */

/**
 * data callback
 * @callback adapterDataFunction
 * @returns {Promise} 需要返回一个 Promise 对象，该对象返回需要存储的数据
 */

/**
 * Adapter Default Options
 * @typeof {Object} AdapterOptions
 * @property {boolean} [ignoreCache=false] - 是否忽略缓存
 * @property {boolean} [updateCache=true] - 是否在数据返回之后更新缓存
 * @property {optionsBeforeGet} [beforeGet=undefinded] - 在调用 adapter 获取数据之前的钩子方法
 */
const adapterDefaultOptions = {
    ignoreCache: false,
    updateCache: true,
    beforeGet: undefined,
};

function initStorage(ins, storage) {
    if (typeof storage === 'undefined' || storage === 'memory') {
        ins.memoryCache = {};
        storage = {
            get(key) {
                return this.memoryCache[key];
            },
            set(key, value) {
                return this.memoryCache[key] = value;
            },
            remove(key) {
                delete this.memoryCache[key];
            },
            removeAll() {
                this.memoryCache = {};
            },
        };
    }

    if (!storage.keyPrefix) storage.keyPrefix = 'super-cache';
    if (typeof storage.get !== 'function') throw new Error('storage.get must typeof function');
    if (typeof storage.set !== 'function') throw new Error('storage.set must typeof function');
    ins.getData = key => storage.get.call(ins, `${storage.keyPrefix}:${key}`);
    ins.setData = (key, value) => storage.set.call(ins, `${storage.keyPrefix}:${key}`, value);

    if (typeof storage.remove !== 'function') ins.removeData = () => { throw new Error('storage.remove was undefined'); };
    else ins.removeData = key => storage.remove.call(ins, `${storage.keyPrefix}:${key}`);

    if (typeof storage.removeAll !== 'function') ins.removeAll = () => { throw new Error('storage.removeAll was undefined'); };
    else ins.removeAll = () => storage.removeAll.call(ins);
}

/** Class SuperCache. */
class SuperCache {

    /**
     * Create an instance of SuperCache
     * @param {object} options 配置信息
     * @param {object} [options.storage] 自定义数据存储器
     * @param {storageSet} options.storage.set 数据保存
     * @param {storageGet} options.storage.get 数据获取
     * @param {storageRemove} [options.storage.remove] 数据删除
     * @param {storageRemoveAll} [options.storage.removeAll] 删除所有数据
     * @param {string} [options.storage.keyPrefix] 数据库缓存 key 的前缀，默认：'super-cache'
     * @param {AdapterOptions} [options.adapterOptions] - adapter 的全局配置
     * @param {*} [options.extra] 额外的配置信息，可以通过 this.extra 获得
     
     * @param {object} [options.log] 允许改变内部的 log 库
     *
     */
    constructor({
        adapterOptions,
        storage,
        log = innerLog,
        extra,
    } = {}) {
        this.adapters = {};

        initStorage(this, storage);

        this.log = log;
        this.adapterGlobalOptions = Object.assign({}, adapterDefaultOptions, adapterOptions);
        this.extra = extra;
    }

    /**
     * Get value
     * @async
     * @param {string} key 需要获取数据的 key
     * @param {AdapterOptions} [options.adapterOptions] - adapter 配置
     * @returns {Promise}  返回一个 Promise 对象，该对象返回需要获取的数据
     */
    get(key, options = {}) {
        const domain = {};
        return Promise
            .resolve()

            // 获取 cache value
            .then(() => this.getData(key))
            .then((cacheValue) => { domain.cacheValue = cacheValue; })

            // 获取 adapter
            .then(() => { domain.adapter = this.getAdapter(key); })

            // 处理 adapterOptions
            .then(() => {

                // 合并 adapterOptions
                domain.adapterOptions = Object.assign({}, this.adapterGlobalOptions, domain.adapter.options, options.adapterOptions);

                // 如果 beforeGet 存在，则执行
                if (typeof domain.adapterOptions.beforeGet === 'function') {
                    return Promise
                        .resolve()
                        .then(() => domain.adapterOptions.beforeGet(domain.cacheValue))

                        // 允许 beforeGet 覆盖运行时的 adapterOptions
                        .then((opt) => { domain.adapterOptions = Object.assign({}, domain.adapterOptions, opt); });
                }
            })

            // 获取数据
            .then(() => {

                // 当缓存无数据（第一次获取），或者显式配置 ignoreCache，则先从 adapter.data 获取数据再返回
                if (typeof domain.cacheValue === 'undefined' || domain.adapterOptions.ignoreCache === true) {
                    return this.getAndUpdateAdapterValue(key, domain.adapterOptions);
                }

                // 在返回数据的同时，异步请求数据与更新缓存
                if (domain.adapterOptions.updateCache) {
                    this

                        .getAndUpdateAdapterValue(key, domain.adapterOptions)

                        // 自己处理 error，不阻塞流程
                        .catch((error) => this.log.error('updateCache', 'getAndUpdateAdapterValue fail', error));
                }

                // 默认返回缓存数据
                return domain.cacheValue;
            })

            .catch((err) => {

                // 如果 adapter 不存在，则返回 cacheValue
                if (err.message === `adapter ${key} was undefined`) return Promise.resolve(domain.cacheValue);

                // 其他情况，让外部处理错误
                throw err;
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
     * Get adapter by key
     * @param {string} key
     * @returns {object} 返回 adapter 对象
     */
    getAdapter(key) {
        const adapter = this.adapters[key];
        if (!adapter) throw new Error(`adapter ${key} was undefined`);
        return adapter;
    }

    /**
     * Get value by adapter
     * @async
     * @param {string} key 需要获取数据的 key
     * @returns {Promise}  返回一个 Promise 对象，该对象返回需要获取的数据
     */
    getAdapterValue(key) {
        const adapter = this.getAdapter(key);
        return Promise.resolve().then(() => adapter.data());
    }

    /**
     * Get and Update value by adapter
     * @async
     * @param {string} key 需要获取数据的 key
     * @returns {Promise} 返回一个 Promise 对象，该对象返回需要获取的数据
     */
    getAndUpdateAdapterValue(key, { updateCache = true }) {
        return this
            .getAdapterValue(key)
            .then((value) => {
                if (updateCache === true) this.setData(key, value);
                return value;
            });
    }

    /**
     * Add adapter
     * @param {string} key 
     * @param {object|function} adapter 如果是 object，参数看下面，如果是function，则会变成 adapter.data = adapter
     * @param {adapterDataFunction} adapter.data 在调用 adapter，通过该函数来获取数据
     * @param {AdapterOptions} [adapter.options] - adapter 配置
     * @param {*} [options.extra] 额外的配置信息，供外部灵活配置，可以通过 this.getAdapters(key).extra 获得     * 
     */
    addAdapter(key, adapter) {
        let _adapter = adapter;
        if (this.adapters[key]) throw new Error(`adapter ${key} not allowed to be repeat definition`);
        if (typeof _adapter === 'function') _adapter = { data: _adapter };
        else if (typeof _adapter.data !== 'function') throw new Error('data() must typeof function');
        if (!_adapter.options) _adapter.options = {};
        this.log.info('addAdatper', `adapter ${key} was attatched`);
        this.adapters[key] = _adapter;
    }
}

export default SuperCache;