const morgan = require('morgan');
const morganToolkitConfig = require('./../index');
const highlight = require('cli-highlight').highlight;


describe('Config', () => {

  it('takes morgan a the first parameter', () => {
    expect(() => {
      morganToolkitConfig(morgan);
    }).not.toThrow();
  });


  it('throws error when morgan is not passed', () => {
    expect(() => {
      morganToolkitConfig();
    }).toThrow();
  });


  it('optionally allows additional req properties to be logged', () => {

      const morganToolkit = morganToolkitConfig(morgan, {
        req: ['cookies', 'signedCookies']
      });

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
        cookies: { cookies: true },
        signedCookies: { signedCookies: true }
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
        _str.indexOf(j({ cookies: true })) > -1
      ).toBe(true);

      expect(
        _str.indexOf(j({ signedCookies: true })) > -1
      ).toBe(true);
    });
});











