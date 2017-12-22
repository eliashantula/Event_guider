const highlight = require('cli-highlight').highlight;
const chalk = require('chalk');


// ----------------------------------------
// Status
// ----------------------------------------
const statusColorizor = (req, res) => {
  let status = res.statusCode;

  // Get status color
  const color = status >= 500 ? 'red'
    : status >= 400 ? 'yellow'
    : status >= 300 ? 'cyan'
    : status >= 200 ? 'green'
    : 0;

  if (color) {
    status = chalk[color](status);
  }

  return status;
};


// ----------------------------------------
// Request Properties
// ----------------------------------------
const reqPropertiesToken = ':req_properties';
const reqProperties = [
  'query',
  'params',
  'body',
  'session',
  'user'
];


// Extracts request properties and
// returns them as a syntax highlighted
// JSON string
const reqPropertyExtractor = (req, res) => {

  let data = [];

  reqProperties.forEach(key => {

    let capKey = key[0].toUpperCase() + key.substr(1);
    let value = req[key];

    if (value) {
      value = JSON.stringify(value, null, 2);

      value = highlight(value, {
        language: 'json',
        ignoreIllegals: true
      });

      data.push(`${ capKey }: ${ value }`);
    }
  });

  return data.join('\n');
};



// ----------------------------------------
// Format
// ----------------------------------------
const createFormat = (format, morgan, reqPropertiesToken) => {

  // If the format is `dev` we need to
  // set it manually to a string because morgan[format]
  // returns a function only when format is `dev`
  if (format === 'dev') {
    format = ":method :url :status :response-time ms - :res[content-length]";
  } else {
    format = morgan[format];
  }

  return [
    ':separator',
    ':newline',
    format,
    ':newline', ':newline',
    reqPropertiesToken,
    ':newline',
    ':separator',
    ':newline', ':newline',
  ].join('');
};



// ----------------------------------------
// Exports
// ----------------------------------------
module.exports = (morgan, options={}) => {

  // Throw if we don't have a morgan instance
  if (!morgan && typeof morgan !== 'function') {
    throw "Must pass morgan as param when requiring morgan toolkit";
  }

  // Add additional req properties to be logged
  if (options.req) {
    options.req.forEach(
      property => reqProperties.push(property)
    );
  }

  // Set up tokens
  morgan.token('separator', () => '****');
  morgan.token('newline', () => "\n");
  morgan.token(reqPropertiesToken.substr(1), reqPropertyExtractor);
  morgan.token('status', statusColorizor);

  // Return the wrapper for the morgan middleware
  // function
  return (format='tiny', options={}) => {
    format = createFormat(format, morgan, reqPropertiesToken);
    return morgan(format, options);
  };
};















