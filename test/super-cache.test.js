import test from 'ava';
import SuperCache from '../src/super-cache';

test('get/set/remove/removeAll', async (t) => {
    const cache = new SuperCache();

    // set and get
    cache.set('name', 'jc');
    t.is(await cache.get('name'), 'jc');

    // remove
    cache.remove('name');
    t.is(await cache.get('name'), undefined);

    // remove all
    cache.set('age', 18);
    cache.set('hobby', 'guitar');
    t.is(await cache.get('age'), 18);
    t.is(await cache.get('hobby'), 'guitar');
    cache.removeAll();
    t.is(await cache.get('age'), undefined);
    t.is(await cache.get('hobby'), undefined);
});

test('adapter:addAdapter', (t) => {
    const cache = new SuperCache();

    return Promise
        .resolve()

        // options is function
        .then(() => {
            let reqTimes = 0;
            cache.addAdapter('name', function () {
                return Promise
                    .resolve(['jc', 'david', 'jade', 'jack'][reqTimes])
                    .then((value) => {
                        reqTimes++;
                        return value;
                    });
            });

            return Promise
                .resolve()
                .then(() => cache.get('name'))
                .then(value => t.is(value, 'jc'))

                .then(() => cache.get('name'))
                .then(value => t.is(value, 'jc'))

                .then(() => cache.get('name'))
                .then(value => t.is(value, 'david'))

                .then(() => cache.get('name'))
                .then(value => t.is(value, 'jade'));
        });
});

test('adapter.options.updateCache && ignoreCache', (t) => {
    const cache = new SuperCache();

    return Promise
        .resolve()

        .then(() => {
            let reqTimes = 0;
            cache.addAdapter('name', {
                data: function () {
                    return Promise
                        .resolve(['jc', 'david', 'jade', 'jack'][reqTimes])
                        .then((value) => {
                            reqTimes++;

                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    resolve(value);
                                }, 100);
                            });
                        });
                },
                options: {
                    updateCache: false,
                }
            });

            return Promise
                .resolve()

                // 不更新缓存，此时缓存为 undefinded
                .then(() => cache.get('name'))
                .then(value => {
                    t.is(value, 'jc');
                    t.is(cache.getData('name'), undefined);
                })

                // 更新缓存，此时缓存为 david，下一次会直接返回 david
                .then(() => cache.get('name', {
                    adapterOptions: {
                        updateCache: true,
                    },
                }))
                .then(value => {
                    t.is(value, 'david');
                    t.is(cache.getData('name'), 'david');
                })

                // 更新缓存，此时缓存返回 david ，但是由于更新是并行异步的，立马获取的话，还是 david
                .then(() => cache.get('name', {
                    adapterOptions: {
                        updateCache: true,
                    },
                }))
                .then(value => {
                    t.is(value, 'david');
                    t.is(cache.getData('name'), 'david');

                    // 在上面的数据成功返回之后，应该是缓存应该是 jade
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            t.is(cache.getData('name'), 'jade');
                            resolve();
                        }, 200);
                    });
                })

                // 不更新缓存，此时缓存返回 jade，缓存还是 jade，后续会永远都是 jade
                .then(() => cache.get('name'))
                .then(value => {
                    t.is(value, 'jade');
                    t.is(cache.getData('name'), 'jade');
                })

                // 除非显式忽略缓存
                .then(() => cache.get('name', {
                    adapterOptions: {
                        ignoreCache: true,
                    }
                }))
                .then((value) => {
                    t.is(value, 'jack');
                    t.is(cache.getData('name'), 'jade');
                })
        });
});

// TODO
// adapter.options.beforeGet

// TODO
// custom storage

// TODO
// extra data for SuperCache() and addAdapter()