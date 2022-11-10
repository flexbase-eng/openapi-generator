import {hello} from '../src/index';

describe('my description for the test suite', ()=> {
    it('example test scenario', async() => {
        expect(hello('Chris')).toEqual('Hello Chris!');
    });
    it('example test scenario for default', async() => {
        expect(hello()).toEqual('Hello world!');
    });
});
