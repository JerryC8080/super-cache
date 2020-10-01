# SuperCache

[![CircleCI](https://circleci.com/gh/JerryC8080/super-cache/tree/master.svg?style=svg)](https://circleci.com/gh/JerryC8080/super-cache/tree/master)

[![NPM Version](https://img.shields.io/npm/v/@jerryc/super-cache.svg)](https://www.npmjs.com/package/@jerryc/super-cache) [![NPM Downloads](https://img.shields.io/npm/dm/@jerryc/super-cache.svg)](https://www.npmjs.com/package/@jerryc/super-cache) [![Coverage Status](https://coveralls.io/repos/github/JerryC8080/super-cache/badge.svg?branch=master)](https://coveralls.io/github/JerryC8080/super-cache?branch=master) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@jerryc/super-cache.svg)

An extended cache library.

# Feature

1. 提供一套「服务端接口耗时慢，但加载性能要求高」场景的解决方案
2. 满足最基本的缓存需求，读取（get）和保存（set）
3. 支持针对缓存进行逻辑代理
4. 灵活可配置的数据存储方式

# How it work

一般的请求数据的形式是，页面加载的时候，从服务端获取数据，然后等待数据返回之后，进行页面渲染：

![](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20200917113658.png)

但这种模式，会受到服务端接口耗时，网络环境等因素影响到加载性能。

对于加载性能要求高的页面（如首页），一般的 Web 开发我们有很多解决方案（如服务端渲染，服务端缓存，SSR 等）。  
但是也有一些环境不能使用这种技术（如微信小程序）。

Super Cache 提供了一个中间数据缓存的解决方案：

![](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20200917113443.png)

Super Cache 的解决思路：

1. 当你需要获取一个数据的时候，如果有缓存，先把旧的数据给你。
2. 然后再从服务端获取新的数据，刷新缓存。
3. 如果一开始没有缓存，则请求服务端数据，再把数据返回。
4. 下一次请求缓存，从第一步开始。

这种解决方案，舍弃了一点数据的实时性（非第一次请求，只能获取上一次最新数据），大大提高了前端的加载性能。  
适合的场景：

1. 数据实时性要求不高。
2. 服务端接口耗时长。

# 使用

1. 安装

   ```
   $ npm install @jerryc/super-cache
   ```

2. 载入模块

   ```javascript
   import SuperCache from '@jerryc/super-cache';
   const cache = new SuperCache();
   ```

# 基本操作

1. set 、 get、remove、removeAll

   ```javascript
   cache.set('name', 'jc');
   cache.get('name').then((value) => console.log(value));
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

   在 `new SuperCache()`、`addAdapter()` 与 `get()` 方法中，都支持对 adapter 进行配置：

   ```javascript
   const adapterOptions = {

       // 是否忽略缓存，默认为 false。如果为 true，则 get() 每次都会请求 adapter 获取数据
       ignoreCache: false,

       // 是否更新缓存，默认为 true。如果为 false，则 get() 请求回来的数据，不会更新到缓存中
       updateCache: true,

       // get() 操作的回调钩子
       beforeGet: function(value) {
           // ...

           // 允许修改该次 get 操作的 adapterOptions，且支持异步的形式。
           return Promise.resolve(newAdapterOptions);
       },
   }

   // 配置会作用于 cache 范围内的所有 adapter
   const cache = new SuperCache({
       adapterOptions,
   });


   // 配置会作用于该 adapter 范围内
   cache.addAdapter(key, {
       data: function() {...},
       ...adapterOptions,
   });

   // 配置只会作用于该次 get 操作
   cache.get(key, {
       adapterOptions,
   })
   ```

   adapterOptions 可以设置的值参考：

2. 自定义 storage

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

       // 设置缓存 key 的前缀，最终会成为：super-cache:${key}
       keyPrefix: 'super-cache',
     },
   });
   ```

3. 自定义的配置

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

4. 额外的配置信息

   `SuperCache()` 和 `cacheInstance.addAdapter()` 都支持配置额外的自定义字段：

   ```javascript
   const cache = new SuperCache({
       extra: { name: 'jc' },
   });

   // { name: 'jc' }
   cache.extra;

   cache.addAdapter('name', {
       extra: { name: 'david' },
       data() {...},
   });

   // { name: 'david' }
   cache.getAdapter('name').extra;
   ```

   利用这种特性，我们可以满足 storage 中针对不同的 adapter 进行不同的缓存策略：

   ```javascript
   const cache = new SuperCache({
       extra: {
           // 默认缓存时间是 60s
           ttl: 60 * 1000,
       },
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

详细 API 参考：[SuperCache API Doc](https://jerryc8080.github.io/super-cache/classes/supercache.html)
