const morgan = require('morgan');
const morganToolkit = require('./../')(morgan);
const highlight = require('cli-highlight').highlight;


describe('Morgan Toolkit', () => {

  it('takes a string name of the format as a parameter', () => {
    expect(() => {
      morganToolkit('dev');
    }).not.toThrow();
  });


  it('allows the format name parameter to be optional', () => {
    expect(() => {
      morganToolkit();
    }).not.toThrow();
  });


  describe('middleware', () => {

    it('is a function', () => {
      expect(typeof morganToolkit()).toBe('function');
    });


    it('outputs request objects as json strings', () => {

      // Str to collect output
      let _str = '';

      // Get the middleware function
      // and mock the stream write
      // to append to the string
      //
      // Set to log immediately
      // otherwise string is empty
      const mw = morganToolkit('tiny', {
        immediate: true,
        stream: {
          write: (s) => {
            _str += s;
          }
        }
      });

      // Mock request
      mw({
        method: 'GET',
        url: '/',
        query: { fiz: 'baz' },
        params: { foo: 'bar' },
        body: { biz: 'faz' },
        session: { id: 1 },
        user: { email: 'foobar@gmail.com' }
      }, {}, () => {});


      // Stringify object and syntax
      // highlight so we can accurately
      // compare it to what would be logged
      const j = (obj) => {
        obj = JSON.stringify(obj, null, 2)
        return highlight(obj, {
          language: 'json',
          ignoreIllegals: true
        });
      };


      // Check output for substrings
      // matching the request objects
      expect(
        _str.indexOf(j({ fiz: 'baz' })) > -1
      ).toBe(true);

      expect(
        _str.indexOf(j({ foo: 'bar' })) > -1
      ).toBe(true);

      expect(
        _str.indexOf(j({ biz: 'faz' })) > -1
      ).toBe(true);

      expect(
        _str.indexOf(j({ id: 1 })) > -1
      ).toBe(true);

      expect(
        _str.indexOf(j({ email: 'foobar@gmail.com' })) > -1
      ).toBe(true);
    });
  });
});












