/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const windowUtils = require("window-utils");
const broadcasters = require("broadcasters");
const timers = require("timers");
const { Cc, Ci } = require("chrome");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

let window = windowUtils.activeBrowserWindow;
let document = window.document;
function $(id) document.getElementById(id);

function createBC(options, test) {
  test.assertEqual(!$(options.id), true);
  var bc = new broadcasters.Broadcaster(options);
  return bc;
}

exports.testBCDoesNotExist = function(test) {
  var options = {
    id: "test-bc-dne"
  };
  createBC(options, test);
  test.assertEqual(!!$(options.id), false, 'broadcaster does not exists');
};

exports.testBCDoesExist = function(test) {
  var options = {
    id: "test-bc-exists",
    label: "test-bc-label",
    parentid: "mainBroadcasterSet"
  };
  let bc = createBC(options, test);
  let broadcaster = $(options.id);
  test.assertEqual(!!broadcaster, true, 'broadcaster exists');
  test.assertEqual(broadcaster.id, options.id, 'broadcaster id is ok');
  test.assertEqual(broadcaster.getAttribute('label'), options.label, 'broadcaster label is ok');
  test.assertEqual(broadcaster.parentNode.id, options.parentid, 'in the main broadcaster set');
  test.assertEqual(broadcaster.getAttribute('class'), '', 'broadcaster class is ok');
  test.assertEqual(broadcaster.nextSibling, undefined, 'broadcaster is last');
  test.assertEqual(broadcaster.getAttribute("autocheck"), 'false', 'broadcaster not autochecked');
  test.assertEqual(broadcaster.getAttribute("checked"), 'false', 'broadcaster not checked');
  test.assertEqual(broadcaster.getAttribute("type"), '', 'broadcaster has no type');
  test.assertEqual(broadcaster.getAttribute("group"), '', 'broadcaster is not in group');
  test.assertEqual(broadcaster.getAttribute('sidebarurl'), '', 'broadcaster has\'nt sidebarurl');
  test.assertEqual(broadcaster.getAttribute('sidebartitle'), '', 'broadcaster has\'nt sidebartitle');
  bc.destroy();
  test.assert(!$(options.id), 'broadcaster is gone');
  test.assertEqual(broadcaster.parentNode, null, 'broadcaster has no parent');
};

exports.testBCOnCommandObserves = function(test) {
  test.waitUntilDone();

  let options = {
    id: "test-bc-onclick",
    label: "testlabel",
    parentid: "mainBroadcasterSet",
    autocheck: true,
    type: "checkbox",
    group: "sidebar",
    sidebarurl: "chrome://browser/content/bookmarks/bookmarksPanel.xul",
    oncommand: "toggleSidebar('test-bc-onclick');"
  };

  var bc = createBC(options, test);
  let broadcaster = $(options.id);
  test.assertEqual(!!broadcaster, true, 'broadcaster exists');

  let mioptions = {
    id: "test-bc-oncommand-observes",
    menuid: "menu_FilePopup",
    observes: options.id,
    accesskey: 'z'
  };

  var menuitem = window.document.createElementNS(NS_XUL, "menuitem");
  menuitem.setAttribute("id", mioptions.id);
  menuitem.setAttribute("type", mioptions.type);
  menuitem.setAttribute("observes", mioptions.observes);
  menuitem.setAttribute("accesskey", mioptions.accesskey);
  var parent = window.document.getElementById(mioptions.menuid);
  parent.insertBefore(menuitem, null)

  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  var win = wm.getMostRecentWindow(null);
  $(mioptions.menuid).openPopupAtScreen(0, 0, false);
  var utils = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
  utils.sendKeyEvent("keypress", Ci.nsIDOMKeyEvent.DOM_VK_Z, Ci.nsIDOMKeyEvent.DOM_VK_Z, null);

  timers.setTimeout(function(){
    test.assertEqual(options.label, $("sidebar-title").getAttribute("value"), 'onCommand worked!');
    parent.removeChild(menuitem);
    bc.destroy();
    test.done();
  }, 1000);
};
