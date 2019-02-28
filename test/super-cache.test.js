import test from 'ava';
import SuperCache from '../src/super-cache';

test('hello', async (t) => {
    const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });

    await promise.then();

    t.is(true, true);
});
