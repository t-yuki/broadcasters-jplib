<!-- contributed by Yukinari Toyota [xxseyxx@gmail.com]  -->
<!-- forked from broadcasters package by Erik Vold [erikvvold@gmail.com]  -->

The `broadcasters` API is a simple way to create
[Broadcasters](https://developer.mozilla.org/en-US/docs/XUL/Tutorial/Broadcasters_and_Observers), which
can respond to events or changes of state easily

## Example ##

    exports.main = function(options) {
      // create a broadcaster for mainBroadcasterSet
      require("broadcasters").Broadcaster({
        id: "myextprefix-some-bc-id",
        parentid: "mainBroadcasterSet",
        "label": _("label"),
        checked: false,
        onCommand: function() {
          // do something
        },
        group: "sidebar",
        sidebarurl: "chrome://browser/content/browser.xul"
      });
    };

<api name="Broadcaster">
@class

Module exports `Broadcaster` constructor allowing users to create a
[`broadcaster`](https://developer.mozilla.org/en/XUL/broadcaster).

<api name="Broadcaster">
@constructor
Creates a `broadcaster`.

@param options {Object}
  Options for the `broadcaster`, with the following parameters:

@prop id {String}
A id for the `broadcaster`, this should be namespaced.

@prop parentid {String}
The id of the parent `<broadcasterset>` node.

@prop label {String}
A label for the `broadcaster`.

@prop checked {Boolean}
Displays a check beside the broadcaster.

@prop [onCommand] {Function}
 A option function that is invoked when the `broadcaster` is executed.

@prop group {String}
A label for the `broadcaster`.

@prop sidebarurl {String}
A sidebarurl for the `broadcaster`.

@prop sidebartitle {String}
A sidebartitle for the `broadcaster`.
</api>
</api>
