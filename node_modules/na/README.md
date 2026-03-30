Na.js
====

Takes a mostly new approach to control flow, yet is built upon the existing concepts, such as dependancy injection.

[![Build Status](https://secure.travis-ci.org/forivall/na.png?branch=master)](http://travis-ci.org/forivall/na)



## Getting Started
Install the module with: `npm install na`

```javascript
var na = require('na');
na({ name: (injected_names[, $callback]) { $callback(...) OR return promise; OR return simple_value; }});
```

## Documentation
Currently, Na.js is a facade to `async.auto`, that reduces the need to repeat and unpack arguments.

## Examples
See the test file for now.

## TODOs

- Remove dependancy on async.auto (browser-native)
- Allow more advanced injection parameters ('array[0]': ..., slices, 'object.foo')
- Better error handling
- Use cssauron-falafel to extract the $annotate function from angularjs directly (and other code bits from angularjs; stay tuned for more)
- native support for returning promises of any library (just supply a factory function!)
- anything else I remember

## Similar projects

[shepard](https://github.com/Obvious/shepherd) - I could make the Na.js interface a simplified facade for shepherd.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Jordan James Klassen. Licensed under the Apache2 license.
