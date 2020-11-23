# Nodejs domino demo

This example showcases the integration of TT polyfill in nodejs environemnt. We are using TypeScript
on purpose to show our type definitions work. Using TT polyfill on nodejs without enforcement is
possible, but some project emulate DOM on the server side (angular) and this demo shows TT polyfill
can work in those cases, too.

We are emulating DOM using our version of
[domino](https://github.com/Siegrift/domino/tree/configurable), because there is an
[issue](https://github.com/fgnass/domino/issues/171) which prevents us from reconfiguring the DOM
functions defined by domino.

To start enforcing on the emulated DOM object you have two options:

1. Define emulated `window` object on the global scope and create enforcer with a single argument -
   enforcement configuration.
2. Pass the emulated `window` object to the enforcer as a second argument. _(You don't need to
   expose the object on the global scope)_.

## Running the demos

1. Run `yarn` to install dependencies.
2. There are two demos, which you can run by `yarn run-demo-global` or `yarn run-demo-custom`.

Both demos output a bunch of text to the console. Check the source files to understand the output.
