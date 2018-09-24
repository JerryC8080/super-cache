# SuperCache
An extended cache  library.

# Feature
  1. 满足最基本的缓存需求，读取（get）和保存（set）
  2. 支持针对缓存进行逻辑代理
  3. 灵活可配置的数据存储方式

# 使用

1. 安装

    ```
    $ npm install @brightwe/super-cache
    ```

2. 载入模块

    ```javascript
    import SuperCache from '@brightwe/super-cache'
    const cache = new SuperCache();
    ```

# 基本操作
1. set 、 get、remove、removeAll

    ```javascript
    cache.set('name', 'jc');
    cache.get('name').then(value => console.log(value));
    cache.remove('name');
    cache.removeAll();
    ```

2. 通过 adapter 定义缓存的数据如何获取

    ```javascript
    // 支持异步返回，Promise
    cache.addAdapter('name', () => {
        return Promise
            .resolve()
            .then(() => API.request('name'))
    });

    // 支持同步返回
    cache.addAdapter('name', () => ({'jc'}));
    ```

# 高级使用

1. 适配器的高级配置

    ```javascript
    cache.addAdapter('name', {

        // 当调用 get 之后，同时异步获取数据并更新，成功失败不阻塞逻辑。
        updateAfterGet: true,

        // 定义缓存的数据如何获取
        data() {
            return Promise
                .resolve()
                .then(() => API.request('name'))
        },

        // 当调用 get 的钩子，可以通过这个钩子来在获取缓存的时候进行逻辑处理，返回值 options 会合并到 get(value, opt) 的 opt
        beforeGet(cache) {
            if (cache === 'jc') {
                return { ignoreCache: true }
            }

            return {};
        },
    });
    ```

2. 带配置的 get

    ```javascript
    cache.get('name', {

        // 忽略缓存，调用 adapter 进行数据获取，默认 false
        ignoreCache: true

        // 获取数据之后，是否自动更新到缓存，默认 true
        updateCache: true
    });
    ```

3. 自定义 storage

   storage 默认是存储到 memory，但在生产环境中是不科学的做法，你可以自定义数据的存储

    ```javascript
    const cache = new SuperCache({
        storage: {
            get(key) {
                // this 指针等于当前 cache 实例
                
                // 自定义数据的获取
                const value = seltStorage.get(key);
                
                // 然后返回结果，支持 Promise 和非 Promise
                return value;
            },
            set(key, value) {
                // this 指针等于当前 cache 实例
                
                // 自定义数据的存储
                selfStorage.set(key, value);
                
                // 然后返回结果，支持 Promise 和非 Promise
                return value;
            },
            remove(key) {
                // this 指针等于当前 cache 实例

                return selfStorage.remove(key);
            },
            removeAll() {
                // this 指针等于当前 cache 实例
                
                return selfStorage.removeAll();
            },
        }
    })
    ```

4. 自定义缓存的 key 前缀

    ```javascript
    const cache = new SuperCache({
        // 默认 'super-cache'   
        keyPrefix: 'myCacheKeyPrefix',
        storage: {...},
    });
    ```

5. 自定义的配置

    SuperCache 的实例和 adapter 都支持配置自定义的配置信息：

    ```javascript
    // 给 SuperCache 实例配置自定义配置
    const customOptions = {
        ttl: 60 * 1000,
    }
    const cache = new SuperCache({
        extra: customOptions,
    });
        
    // true
    cache.extra === customOptions;
    
    
    // 给 adapter 配置自定义配置
    cache.addAdapter('name', {
        extra: customOptions,
        data() {...},
    });
        
    // true
    cache.getAddapter('name').extra === customOptions;
    ```

    ​    

    storage 的 get、set、remove、removeAll 方法的 `this` 都会被绑定到当前实例上，这样的特性可以用来满足针对不同 adapter 进行不同的缓存策略

    ```javascript
    const cache = new SuperCache({
    	extra: {
    		// 默认缓存时间是 60s
            ttl: 60 * 1000,
    	}
        storage: {
            get(key) {...},
            set(key, value) {
                // 获取自定义配置信息
                const adapterTTL = this.getAdapter(key).extra.ttl;
    			const ttl = this.extra.ttl;
    
    			// 调用自定义的存储库
                myStorage.save(key, { ttl: ttl || adapterTTL });
            },
            remove(key) {...},
            removeAll() {...},
        },
    });
    
    cache.addAdapter('name', {
        extra: {
            // 针对于 name 的缓存，只做 30s 时间缓存
            ttl: 30 * 1000,
        },
        data() {...},
    });
    ```


# API
## SuperCache
Class SuperCache.

**Kind**: global class

* [SuperCache](#SuperCache)
    * [new SuperCache(options)](#new_SuperCache_new)
    * [.get(key, [options])](#SuperCache+get)
    * [.set(key, value)](#SuperCache+set)
    * [.remove(key, value)](#SuperCache+remove)
    * [.getAdapter(key)](#SuperCache+getAdapter)
    * [.getAdapterValue(key)](#SuperCache+getAdapterValue) ⇒ <code>Promise</code>
    * [.updateByAdapter(key)](#SuperCache+updateByAdapter) ⇒ <code>Promise</code>
    * [.addAdapter(key, options)](#SuperCache+addAdapter)

<a name="new_SuperCache_new"></a>

### new SuperCache(options)
Create an instance of SuperCache


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | 配置信息 |
| [options.storage] | <code>object</code> |  | 自定义数据存储器 |
| options.storage.set | [<code>storageSet</code>](#storageSet) |  | 数据保存 |
| options.storage.get | [<code>storageGet</code>](#storageGet) |  | 数据获取 |
| [options.storage.remove] | [<code>storageRemove</code>](#storageRemove) |  | 数据删除 |
| [options.storage.removeAll] | [<code>storageRemoveAll</code>](#storageRemoveAll) |  | 删除所有数据 |
| [options.ignoreCache] | <code>boolean</code> | <code>false</code> | 是否忽略缓存 |
| [options.updateCache] | <code>boolean</code> | <code>true</code> | 是否更新缓存 |
| [options.extra] | <code>\*</code> |  | 额外的配置信息，可以通过 this.extra 获得 |
| [options.log] | <code>object</code> |  | 允许改变内部的 log 库 |

<a name="SuperCache+get"></a>

### superCache.get(key, [options])
Get value

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | 需要获取数据的 key |
| [options] | <code>object</code> |  | 配置信息 |
| [options.ignoreCache] | <code>boolean</code> | <code>false</code> | 是否忽略缓存 |
| [options.updateCache] | <code>boolean</code> | <code>true</code> | 是否更新缓存 |
| [options.beforeGet] | [<code>optionsBeforeGet</code>](#optionsBeforeGet) |  | 在调用 adapter 获取数据之前的钩子方法 |

<a name="SuperCache+set"></a>

### superCache.set(key, value)
Set value

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |
| value | <code>\*</code> | storage.remove 的返回结果 |

<a name="SuperCache+remove"></a>

### superCache.remove(key, value)
Remove value

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要删除数据的 key |
| value | <code>\*</code> | storage.remove 的返回结果 |

<a name="SuperCache+getAdapter"></a>

### superCache.getAdapter(key)
Get adapter by key

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)

| Param | Type |
| --- | --- |
| key | <code>string</code> |

<a name="SuperCache+getAdapterValue"></a>

### superCache.getAdapterValue(key) ⇒ <code>Promise</code>
Get value by adapter

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)
**Returns**: <code>Promise</code> - 返回一个 Promise 对象，该对象返回需要获取的数据

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |

<a name="SuperCache+updateByAdapter"></a>

### superCache.updateByAdapter(key) ⇒ <code>Promise</code>
Update value by adapter

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)
**Returns**: <code>Promise</code> - 返回一个 Promise 对象，该对象返回需要获取的数据

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |

<a name="SuperCache+addAdapter"></a>

### superCache.addAdapter(key, options)
Add adapter

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  |  |
| options | <code>object</code> \| <code>function</code> |  | 如果是 object，参数看下面，如果是function，则会变成 options.data = options |
| options.data | [<code>optionsData</code>](#optionsData) |  | 在调用 adapter，通过该函数来获取数据 |
| [options.beforeGet] | [<code>optionsBeforeGet</code>](#optionsBeforeGet) |  | 在调用 adapter 获取数据之前的钩子方法 |
| [options.ignoreCache] | <code>boolean</code> | <code>false</code> | 是否忽略缓存 |
| [options.updateCache] | <code>boolean</code> | <code>true</code> | 是否更新缓存 |
| [options.extra] | <code>\*</code> |  |额外的配置信息，供外部灵活配置，可以通过 this.getAdapters(key).extra获得 |

<a name="storageSet"></a>

## storageSet : <code>function</code>
**Kind**: global typedef

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |
| data | <code>\*</code> | storage.get 的返回值 |

<a name="storageRemove"></a>

## storageRemove : <code>function</code>
**Kind**: global typedef

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |
| data | <code>\*</code> | storage.remove 的返回值 |

<a name="storageRemoveAll"></a>

## storageRemoveAll : <code>function</code>
**Kind**: global typedef

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | storage.removeAll 的返回值 |

<a name="storageGet"></a>

## storageGet ⇒ <code>Promise</code> \| <code>\*</code>
**Kind**: global typedef
**Returns**: <code>Promise</code> \| <code>\*</code> - 如果返回非 Promise，内部会转化为 Promise

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |

<a name="optionsBeforeGet"></a>

## optionsBeforeGet ⇒ <code>object</code>
beforeGet callback

**Kind**: global typedef
**Returns**: <code>object</code> - runtimeOpt 运行时的配置信息，会暂时覆盖实例的配置

| Param | Type | Description |
| --- | --- | --- |
| cache | <code>\*</code> | 存储在 storage 的缓存数据，如果没有则为 undefined |

<a name="optionsData"></a>

## optionsData ⇒ <code>Promise</code>
data callback

**Kind**: global typedef
**Returns**: <code>Promise</code> - 需要返回一个 Promise 对象，该对象返回需要存储的数据