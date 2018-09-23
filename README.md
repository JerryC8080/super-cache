# SuperCache
An extended cache  library.

# Feature
 1. 满足最基本的缓存需求，读取（get）和保存（set）
 2. 支持针对缓存进行逻辑代理
 3. 灵活可配置的数据存储方式

# 基本的读写

# 针对缓存进行逻辑代理

TODO 这里描述怎么使用
1. 新增 adapter，强制更新，以及在获取之前进行逻辑处理以及覆盖全局 options
2. 获取参数的时候，忽略缓存，强制更新

# 配置存储方式
这里可以使用 @beautywe/wxapp-storage

# API
TODO 你也可以查看网页版：[API Doc]()

## Classes

<dl>
<dt><a href="#SuperCache">SuperCache</a></dt>
<dd><p>Class SuperCache.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#storageSet">storageSet</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#storageGet">storageGet</a> ⇒ <code>Promise</code> | <code>*</code></dt>
<dd></dd>
<dt><a href="#optionsBeforeGet">optionsBeforeGet</a> ⇒ <code>object</code></dt>
<dd><p>beforeGet callback</p>
</dd>
<dt><a href="#optionsData">optionsData</a> ⇒ <code>Promise</code></dt>
<dd><p>data callback</p>
</dd>
</dl>

<a name="SuperCache"></a>

## SuperCache
Class SuperCache.

**Kind**: global class

* [SuperCache](#SuperCache)
    * [new SuperCache(options)](#new_SuperCache_new)
    * [.get(key, options)](#SuperCache+get)
    * [.set(key, value)](#SuperCache+set)
    * [.getAdapterValue(key)](#SuperCache+getAdapterValue) ⇒ <code>Promise</code>
    * [.updateByAdapter(key)](#SuperCache+updateByAdapter) ⇒ <code>Promise</code>
    * [.addAdapter(key, options)](#SuperCache+addAdapter)

<a name="new_SuperCache_new"></a>

### new SuperCache(options)
Create an instance of SuperCache


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | 配置信息 |
| options.storage | <code>object</code> |  | 外部需要定义的数据存储器 |
| options.storage.set | [<code>storageSet</code>](#storageSet) |  | 数据保存 |
| options.storage.get | [<code>storageGet</code>](#storageGet) |  | 数据获取 |
| [options.ignoreCache] | <code>boolean</code> | <code>false</code> | 是否忽略缓存 |
| [options.updateCache] | <code>boolean</code> | <code>true</code> | 是否更新缓存 |
| [options.log] | <code>object</code> |  | 允许改变内部的 log 库 |

<a name="SuperCache+get"></a>

### superCache.get(key, options)
Get value

**Kind**: instance method of [<code>SuperCache</code>](#SuperCache)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | 需要获取数据的 key |
| options | <code>object</code> |  | 配置信息 |
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
| value | <code>\*</code> | key 对应的数据 |

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

<a name="storageSet"></a>

## storageSet : <code>function</code>
**Kind**: global typedef

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 需要获取数据的 key |
| data | <code>\*</code> | 需要存储的数据 |

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