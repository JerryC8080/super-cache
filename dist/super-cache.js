'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * SuperCache
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 功能点
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 1. 满足一般的缓存需求，读取（get）和保存（set）
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 2. 允许通过 adapter 来代理某一个 key 的参数获取逻辑，如果定义了 adapter，则会拿到 adapter 的值，然后更新缓存。
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 3. 默认情况下，get 会优先读取缓存的数据，如果没有，则会调用 adapter 获取数据。
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 4. 如若要主动去根据 adapter 更新某个 key 的缓存数据，调用 updateByAdapter(key)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 5. 改库持久化数据的方式，有外部来定义，通过 storage.set 和 storage.get
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _innerLog = require('./inner-log');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** Class SuperCache. */
var SuperCache = function () {

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
    function SuperCache() {
        var _this = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$ignoreCache = _ref.ignoreCache,
            ignoreCache = _ref$ignoreCache === undefined ? false : _ref$ignoreCache,
            _ref$updateCache = _ref.updateCache,
            updateCache = _ref$updateCache === undefined ? true : _ref$updateCache,
            storage = _ref.storage,
            log = _ref.log;

        _classCallCheck(this, SuperCache);

        this.adapters = {};

        if (!storage) throw new Error('storage must exit');
        if (typeof storage.get !== 'function') throw new Error('storage.get must typeof function');
        if (typeof storage.set !== 'function') throw new Error('storage.set must typeof function');
        this.getData = function (key) {
            return storage.get.call(_this, 'super-cache:' + key);
        };
        this.setData = function (key, value) {
            return storage.set.call(_this, 'super-cache:' + key, value);
        };
        this.log = log;

        this.defaultOpt = { ignoreCache: ignoreCache, updateCache: updateCache };
    }

    /**
     * Get value
     * @param {string} key 需要获取数据的 key
     * @param {object} options 配置信息
     * @param {boolean} [options.ignoreCache=false] 是否忽略缓存
     * @param {boolean} [options.updateCache=true] 是否更新缓存
     * @param {optionsBeforeGet} [options.beforeGet] 在调用 adapter 获取数据之前的钩子方法
     */


    _createClass(SuperCache, [{
        key: 'get',
        value: function get(key, options) {
            var _this2 = this;

            var domain = {};
            return Promise.resolve().then(function () {
                var adapter = _this2.adapters[key];
                domain.adapter = adapter;
                domain.opt = Object.assign({}, _this2.defaultOpt, adapter, options);
            }).then(function () {
                return _this2.getData(key);
            }).then(function (cacheValue) {
                domain.cacheValue = cacheValue;
            }).then(function () {
                // 如果 beforeGet 存在，则执行，然后覆盖 opt
                if (typeof domain.opt.beforeGet === 'function') {
                    return Promise.resolve().then(function () {
                        return domain.opt.beforeGet(domain.cacheValue);
                    }).then(function (opt) {
                        domain.opt = Object.assign({}, domain.opt, opt);
                    });
                }
                return Promise.resolve();
            }).then(function () {
                if (typeof domain.cacheValue === 'undefined' || domain.opt.ignoreCache === true) {
                    return _this2.getAdapterValue(key).then(function (value) {
                        if (domain.opt.updateCache === true) _this2.setData(key, value);
                        return value;
                    });
                }

                if (domain.opt.updateAfterGet) _this2.updateByAdapter(key);

                return domain.cacheValue;
            });
        }

        /**
         * Set value
         * @param {string} key 需要获取数据的 key
         * @param {*} value key 对应的数据
         */

    }, {
        key: 'set',
        value: function set(key, value) {
            this.setData(key, value);
        }

        /**
         * Get value by adapter
         * @param {string} key 需要获取数据的 key
         * @returns {Promise}  返回一个 Promise 对象，该对象返回需要获取的数据
         */

    }, {
        key: 'getAdapterValue',
        value: function getAdapterValue(key) {
            var adapter = this.adapters[key];
            if (!adapter) throw new Error('adapter ' + key + ' was undefined');
            return Promise.resolve().then(function () {
                return adapter.data();
            });
        }

        /**
         * Update value by adapter
         * @param {string} key 需要获取数据的 key
         * @returns {Promise} 返回一个 Promise 对象，该对象返回需要获取的数据
         */

    }, {
        key: 'updateByAdapter',
        value: function updateByAdapter(key) {
            var _this3 = this;

            return this.getAdapterValue(key).then(function (value) {
                _this3.setData(key, value);
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

    }, {
        key: 'addAdapter',
        value: function addAdapter(key, options) {
            var adapter = options;
            if (this.adapters[key]) throw new Error('adapter ' + key + ' not allowed to be repeat definition');
            if (typeof options === 'function') adapter = { data: options };else if (typeof options.data !== 'function') throw new Error('data() must typeof function');
            this.log.info('super-cache:addAdatper', 'adapter ' + key + ' was attatched');
            this.adapters[key] = adapter;
        }
    }]);

    return SuperCache;
}();

exports.default = SuperCache;