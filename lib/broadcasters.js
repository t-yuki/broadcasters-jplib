/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const windowUtils = require("sdk/deprecated/window-utils");
const { Class } = require("sdk/core/heritage");
const { validateOptions } = require("sdk/deprecated/api-utils");
const { on, emit, once, off } = require("sdk/event/core");
const { isBrowser } = require("sdk/window/utils");
const { EventTarget } = require('sdk/event/target');
const { unload } = require("unload+");

const broadcasterNS = require("namespace").ns();
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

function BroadcasterOptions(options) {
  return validateOptions(options, {
    id: { is: ['string'] },
    parentid: { is: ['undefined', 'string'] },
    label: { is: ['undefined', "string"] },
    checked: { is: ['undefined', 'boolean'] },
    onCommand: { is: ['undefined', 'function'] },
    group: { is: ['undefined', 'string'] },
    sidebarurl: { is: ['undefined', 'string'] },
    sidebartitle: { is: ['undefined', 'string'] }
  });
}

let Broadcaster = Class({
  extends: EventTarget,
  initialize: function(options) {
    options = broadcasterNS(this).options = BroadcasterOptions(options);
    EventTarget.prototype.initialize.call(this, options);

    broadcasterNS(this).destroyed = false;
    broadcasterNS(this).unloaders = [];
    broadcasterNS(this).broadcasters = addBroadcasters(this, options).broadcasters;
  },
  get id() broadcasterNS(this).options.id,
  get label() broadcasterNS(this).options.label,
  set label(val) updateProperty(this, 'label', val),
  get checked() menuitemNS(this).options.checked,
  set checked(val) updateProperty(this, 'checked', !!val),
  get group() broadcasterNS(this).options.group,
  set group(val) updateProperty(this, 'group', val),
  get sidebarurl() broadcasterNS(this).options.sidebarurl,
  set sidebarurl(val) updateProperty(this, 'sidebarurl', val),
  get sidebartitle() broadcasterNS(this).options.sidebartitle,
  set sidebartitle(val) updateProperty(this, 'sidebartitle', val),
  clone: function (overwrites) {
    let opts = Object.clone(broadcasterNS(this).options);
    for (let key in overwrites) {
      opts[key] = overwrites[key];
    }
    return Broadcaster(opts);
  },
  get parentid() broadcasterNS(this).options.parentid,
  set parentid(val) {
    let options = broadcasterNS(this).options;
    options.parentid = val;

    forEachBC(function(broadcaster, i, $) {
      updateBroadcasterParent(broadcaster, options, $);
    }, this);
  },
  destroy: function() {
    if (!broadcasterNS(this).destroyed) {
      broadcasterNS(this).destroyed = true;
      broadcasterNS(this).unloaders.forEach(function(u) u());
      broadcasterNS(this).unloaders = null;
      broadcasterNS(this).broadcasters = null;
    }
    return true;
  }
});

function addBroadcasters(self, options) {
  let broadcasters = [];

  // setup window tracker
  windowUtils.WindowTracker({
    onTrack: function (window) {
      if (!isBrowser(window) || broadcasterNS(self).destroyed) return;

      // create a broadcaster
      var broadcaster = updateBroadcasterAttributes(
          window.document.createElementNS(NS_XUL, "broadcaster"), options);
      var broadcasters_i = broadcasters.push(broadcaster) - 1;

      // add the broadcaster to the window
      updateBroadcasterParent(broadcaster, options, function(id) window.document.getElementById(id));

      // add unloader
      let unloader = function unloader() {
        broadcaster.parentNode && broadcaster.parentNode.removeChild(broadcaster);
        broadcasters[broadcasters_i] = null;
      };
      broadcasterNS(self).unloaders.push(function() {
        remover();
        unloader();
      });
      let remover = unload(unloader, window);
    }
  });
  return {broadcasters: broadcasters};
}

function updateBroadcasterParent(broadcaster, options, $) {
  // add the broadcaster to the window
  if (Array.isArray(options.parentid)) {
      let ids = options.parentid;
      for (var len = ids.length, i = 0; i < len; i++) {
        if (tryParent($(ids[i]), broadcaster))
          return true;
      }
  }
  else {
    return tryParent($(options.parentid), broadcaster);
  }
  return false;
}

function updateBroadcasterAttributes(broadcaster, options) {
  broadcaster.setAttribute("id", options.id);

  if (options.label)
    broadcaster.setAttribute("label", options.label);

  if (options.group)
    broadcaster.setAttribute("group", options.group);

  if (options.sidebarurl)
    broadcaster.setAttribute("sidebarurl", options.sidebarurl);

  if (options.sidebartitle)
    broadcaster.setAttribute("sidebartitle", options.sidebartitle);

  broadcaster.setAttribute('checked', !!options.checked);

  return broadcaster;
}

function updateProperty(broadcaster, key, val) {
  broadcasterNS(broadcaster).options[key] = val;

  forEachBC(function(broadcaster) {
    broadcaster.setAttribute(key, val);
  }, broadcaster);
  return val;
}

function forEachBC(callback, broadcaster) {
  broadcasterNS(broadcaster).broadcasters.forEach(function(mi, i) {
    if (!mi) return;
    callback(mi, i, function(id) mi.ownerDocument.getElementById(id));
  });
}

function tryParent(parent, broadcaster) {
  if (parent) parent.insertBefore(broadcaster, undefined);
  return !!parent;
}

function BroadcasterExport(options) {
  return Broadcaster(options);
}

exports.Broadcaster = BroadcasterExport;
