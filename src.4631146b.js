// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({14:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.app = app;
function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();
    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}

function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));

  scheduleRender();

  return wiredActions;

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : recycleElement(element);
      })
    };
  }

  function resolveNode(node) {
    return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
  }

  function render() {
    skipRender = !skipRender;

    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, oldNode = node);
    }

    isRecycling = false;

    while (lifecycle.length) lifecycle.pop()();
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) out[i] = target[i];
    for (var i in source) out[i] = source[i];

    return out;
  }

  function setPartialState(path, value, source) {
    var target = {};
    if (path.length) {
      target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }
    return value;
  }

  function getPartialState(path, source) {
    var i = 0;
    while (i < path.length) {
      source = source[path[i++]];
    }
    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          var result = action(data);

          if (typeof result === "function") {
            result = result(getPartialState(path, globalState), actions);
          }

          if (result && result !== (state = getPartialState(path, globalState)) && !result.then // !isPromise
          ) {
              scheduleRender(globalState = setPartialState(path, clone(state, result), globalState));
            }

          return result;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = clone(state[key]), actions[key] = clone(actions[key]));
    }

    return actions;
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event);
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {} else if (name === "style") {
      for (var i in clone(oldValue, value)) {
        var style = value == null || value[i] == null ? "" : value[i];
        if (i[0] === "-") {
          element[name].setProperty(i, style);
        } else {
          element[name][i] = style;
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) oldValue = element.events[name];
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && name !== "type" && name !== "draggable" && name !== "spellcheck" && name !== "translate" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);

    var attributes = node.attributes;
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element;
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
        updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;
    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;
    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }
    return element;
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;
    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {} else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(element, oldNode.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");

      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];

        var oldKey = getKey(oldChildren[i]);
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey(children[k] = resolveNode(children[k]));

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }
          i++;
          continue;
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }
          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }
        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }
    return element;
  }
}
},{}],15:[function(require,module,exports) {
var define;
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Amplitude", [], factory);
	else if(typeof exports === 'object')
		exports["Amplitude"] = factory();
	else
		root["Amplitude"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * These variables make Amplitude run. The config is the most important
 * containing active settings and parameters.
 *
 * The config JSON is the global settings for ALL of Amplitude functions.
 * This is global and contains all of the user preferences. The default
 * settings are set, and the user overwrites them when they initialize
 * Amplitude.
 *
 * @module config
 * @type {object}
 * @property {string}  	config.version          				- The current version of AmplitudeJS.
 * @property {object} 	config.active_song 		 					-	Handles all of the audio.
 * @property {object} 	config.active_metadata					- Contains the active metadata for the song.
 * @property {string} 	config.active_album							- Holds the active album name. Used to check and see if the album changed and run the album changed callback.
 * @property {number} 	config.active_index							- Contains the index of the actively playing song.
 * @property {string} 	config.active_playlist					- Contains the key to the active playlist index.
 * @property {boolean}	config.autoplay									- Set to true to autoplay the song
 * @property {number} 	config.playback_speed						- Sets the initial playback speed of the song. The values for this can be 1.0, 1.5, 2.0
 * @property {object} 	config.callbacks								- The user can pass a JSON object with a key => value store of callbacks to be run at certain events.
 * @property {array} 		config.songs										- Contains all of the songs the user has passed to Amplitude to use.
 * @property {object} 	config.playlists								- Contains all of the playlists the user created.
 * @property {object} 	config.start_song 							- The index of the song that AmplitudeJS should start with.
 * @property {object} 	config.shuffled_playlists				- Will contain shuffled playlists.
 * @property {string} 	config.starting_playlist 				- The starting playlist the player will intiialize to.
 * @property {object} 	config.shuffled_statuses 				- Contains whether the current playlist is in shuffle mode or not.
 * @property {object} 	config.repeat_statuses 					- Contains whether the playlist is in repeat mode or not.
 * @property {object} 	config.shuffled_active_indexes	- Contains the active index in a shuffled playlist.
 * @property {boolean} 	config.repeat 									- When repeat is on, when the song ends the song will replay itself.
 * @property {object} 	config.shuffle_list							- When shuffled, gets populated with the songs the user provided in a random order.
 * @property {boolean} 	config.shuffle_on								- When on, gets set to true so when traversing through songs, AmplitudeJS knows whether or not to use the songs object or the shuffle_list
 * @property {number} 	config.shuffle_active_index 		- When shuffled, this index is used to let AmplitudeJS know where it's at when traversing.
 * @property {string}		config.default_album_art 				- The user can set default album art to be displayed if the song they set doesn't contain album art.
 * @property {boolean} 	config.debug										- When set to true, AmplitudeJS will print to the console any errors providing helpful feedback to the user.
 * @property {number} 	config.volume 									- The user can set the initial volume to a number between 0 and 1 over-riding the default of .5
 * @property {number} 	config.pre_mute_volume 					- This is set on mute so that when a user un-mutes AmplitudeJS knows what to restore the volume to.
 * @property {number}		config.volume_increment 				- The default values are an integer between 1 and 100 for how much the volume should increase when the user presses the volume up button.
 * @property {number}		config.volume_decrement 				- The default values are an integer between 1 and 100 for how much the volume should decrease when the user presses the volume down button.
 * @property {string} 	config.soundcloud_client 				- When using SoundCloud, the user will have to provide their API Client ID
 * @property {boolean} 	config.soundcloud_use_art 			- The user can set this to true and AmplitudeJS will use the album art for the song returned from the Soundcloud API
 * @property {number} 	config.soundcloud_song_count 		- Used on config to count how many songs are from Soundcloud and compare it to how many are ready for when to move to the rest of the configuration
 * @property {number} 	config.soundcloud_songs_ready 	- Used on config to count how many songs are ready so when we get all of the data from the SoundCloud API that we need this should match the SoundCloud song count meaning we can move to the rest of the config.
 * @property {integer}	config.is_touch_moving 					- Flag for if the user is moving the screen.
 * @property {boolean}	config.buffered									- How much of the song is buffered.
 * @property {object} 	config.bindings									- Array of bindings to certain key events.
 * @property {boolean} 	config.continue_next 						- Determines when a song ends, we should continue to the next song.
 */
module.exports = {
  version: '3.3.0',

  active_song: new Audio(),

  active_metadata: {},

  active_album: '',

  active_index: 0,

  active_playlist: '',

  autoplay: false,

  playback_speed: 1.0,

  callbacks: {},

  songs: [],

  playlists: {},

  start_song: '',

  shuffled_playlists: {},

  starting_playlist: '',

  shuffled_statuses: {},

  shuffled_active_indexes: {},

  repeat_statuses: {},

  repeat: false,

  repeat_song: false,

  shuffle_list: {},

  shuffle_on: false,

  shuffle_active_index: 0,

  default_album_art: '',

  debug: false,

  volume: .5,

  pre_mute_volume: .5,

  volume_increment: 5,

  volume_decrement: 5,

  soundcloud_client: '',

  soundcloud_use_art: false,

  soundcloud_song_count: 0,

  soundcloud_songs_ready: 0,

  is_touch_moving: false,

  buffered: 0,

  bindings: {},

  continue_next: true
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _core = __webpack_require__(3);

var _core2 = _interopRequireDefault(_core);

var _visual = __webpack_require__(2);

var _visual2 = _interopRequireDefault(_visual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * For the sake of code clarity, these functions perform helper tasks
 * assisting the logical functions with what they need such as setting
 * the proper song index after an event has occured.
 *
 * @module core/AmplitudeHelpers
 */


/**
 * AmplitudeJS Core Module
 * @module core/AmplitudeCore
 */
var AmplitudeHelpers = function () {
	/**
  * Resets the config to the default state. This is called on initialize
  * to ensure the user's config is what matters.
  *
  * Public Accessor: AmplitudeHelpers.resetConfig()
  *
  * @access public
  */
	function resetConfig() {
		_config2.default.active_song = new Audio();
		_config2.default.active_metadata = {};
		_config2.default.active_album = '';
		_config2.default.active_index = 0;
		_config2.default.active_playlist = '';
		_config2.default.active_playlist = '';
		_config2.default.autoplay = false;
		_config2.default.playback_speed = 1.0;
		_config2.default.callbacks = {};
		_config2.default.songs = [];
		_config2.default.playlists = {};
		_config2.default.start_song = '';
		_config2.default.shuffled_playlists = {};
		_config2.default.shuffled_statuses = {};
		_config2.default.repeat = false;
		_config2.default.shuffle_list = {};
		_config2.default.shuffle_on = false;
		_config2.default.shuffle_active_index = 0;
		_config2.default.default_album_art = '';
		_config2.default.debug = false;
		_config2.default.handle_song_elements = true;
		_config2.default.volume = .5;
		_config2.default.pre_mute_volume = .5;
		_config2.default.volume_increment = 5;
		_config2.default.volume_decrement = 5;
		_config2.default.soundcloud_client = '';
		_config2.default.soundcloud_use_art = false;
		_config2.default.soundcloud_song_count = 0;
		_config2.default.soundcloud_songs_ready = 0;
		_config2.default.continue_next = true;
	}

	/**
  * Writes out debug message to the console if enabled.
  *
  * Public Accessor: AmplitudeHelpers.writeDebugMessage( message )
  *
  * @access public
  * @param {string} message - The string that gets printed to alert the user of a debugging error.
  */
	function writeDebugMessage(message) {
		if (_config2.default.debug) {
			console.log(message);
		}
	}

	/**
  * Runs a user defined callback method
  *
  * Public Accessor: AmplitudeHelpers.runCallback( callbackName )
  *
  * @access public
  * @param {string} callbackName - The name of the callback we are going to run.
  */
	function runCallback(callbackName) {
		/*
  	Checks to see if a user defined a callback method for the
  	callback we are running.
  */
		if (_config2.default.callbacks[callbackName]) {
			/*
   	Build the callback function
   */
			var callbackFunction = _config2.default.callbacks[callbackName];

			/*
   	Write a debug message stating the callback we are running
   */
			writeDebugMessage('Running Callback: ' + callbackName);

			/*
   	Run the callback function and catch any errors
   */
			try {
				callbackFunction();
			} catch (error) {
				if (error.message == "CANCEL EVENT") {
					throw error;
				} else {
					writeDebugMessage('Callback error: ' + error.message);
				}
			}
		}
	}

	/**
  * Changes the active song in the config. This happens in multiple
  * scenarios: The user clicks a play button that has an index that is
  * different than what is currently playing, the song ends and the next
  * song begins, etc.
  *
  * Public Accessor: AmplitudeHelpers.changeSong( songIndex )
  *
  * @access public
  * @param {number} songIndex - The song index we are changing to
  *
  */
	function changeSong(songIndex) {
		/*
  	Grab the song at the index defined by the user.
  */
		var song = _config2.default.songs[songIndex];

		/*
  	Stops the currently playing song so we can adjust
  	what we need.
  */
		_core2.default.stop();

		/**
   * @todo: Stop Visualization
   */

		/*
  	Set all play buttons to pause while we change
  	the song.
  */
		_visual2.default.setPlayPauseButtonsToPause();

		/*
  	Since it is a new song, we reset the song sliders. These
  	react to time updates and will eventually be updated but we
  	force update them is if there is a song slider bound to a
  	specific song, they won't update.
  */
		_visual2.default.resetSongSliders();

		/*
  	Resets the progress bars
  */
		_visual2.default.resetSongPlayedProgressBars();

		/*
  	Reset all the time place holders accordingly.
  */
		_visual2.default.resetTimes();

		/*
  	Run a callback if an album is going
  	to change.
  */
		if (checkNewAlbum(song)) {
			runCallback('album_change');
		}

		/*
  	Set the new song information so we can use the
  	active meta data later on.
  */
		setNewSong(song, songIndex);

		/*
  	Display the new visual metadata now that the config has
  	been changed. This will show the new song.
  */
		_visual2.default.displaySongMetadata();

		/*
  	Sets the active container. This is a class that
  	designers can use on an element that contains the current
  	song's controls to show it's highlighted.
  */
		_visual2.default.setActiveContainer();

		/*
  	Sets the active song's duration
  */
		_visual2.default.syncSongDuration();

		/*
  	Run song change callback.
  */
		runCallback('song_change');
	}

	/**
  * Checks to see if the new song to be played is different than the song
  * that is currently playing. To be true, the user would have selected
  * play on a new song with a new index. To be false, the user would have
  * clicked play/pause on the song that was playing.
  *
  * Public Accessor: AmplitudeHelpers.checkNewSong( songIndex )
  *
  * @access public
  * @param {number} songIndex - The index of the new song to be played.
  * @returns {boolean} True if we are setting a new song, false if we are not setting a new song.
  */
	function checkNewSong(songIndex) {
		if (songIndex != _config2.default.active_index) {
			return true;
		} else {
			return false;
		}
	}

	/**
  * Checks to see if there is a new album
  *
  * Public Accessor: AmplitudeHelpers.checkNewAlbum( new Album )
  *
  * @access public
  * @param {string} newAlbum - Checks to see if the new song will have a new album.
  * @returns {boolean} True if there is a new album, false if there is not a new ablum.
  */
	function checkNewAlbum(newAlbum) {
		if (_config2.default.active_album != newAlbum) {
			return true;
		} else {
			return false;
		}
	}

	/**
  * Checks to see if there is a new playlist
  *
  * Public Accessor: AmplitudeHelpers.checkNewPlaylist( playlist )
  *
  * @access public
  * @param {string} playlist - The playlist passed in to check against the active playlist.
  * @returns {boolean} True if there is a new playlist, false if there is not a new playlist.
  */
	function checkNewPlaylist(playlist) {
		if (_config2.default.active_playlist != playlist) {
			return true;
		} else {
			return false;
		}
	}

	/**
  * Sets the new song in the config. Sets the src of the audio object,
  * updates the	metadata and sets the active album.
  *
  * @access private
  * @param {object} song 	- The song object of the song we are changing to.
  * @param {number} index 	- The index of the song in the songs object we are changing.
  */
	function setNewSong(song, index) {
		_config2.default.active_song.src = song.url;
		_config2.default.active_metadata = song;
		_config2.default.active_album = song.album;
		_config2.default.active_index = index;
	}

	/**
  * Shuffles individual songs in the config
  * Based off of: http://www.codinghorror.com/blog/2007/12/the-danger-of-naivete.html
  *
  * Public Accessor: AmplitudeHelpers.shuffleSongs()
  *
  * @access public
  */
	function shuffleSongs() {
		/*
  	Builds a temporary array with the length of the config.
  */
		var shuffleTemp = new Array(_config2.default.songs.length);

		/*
  	Set the temporary array equal to the songs array.
  */
		for (var i = 0; i < _config2.default.songs.length; i++) {
			shuffleTemp[i] = _config2.default.songs[i];
			shuffleTemp[i].original_index = i;
		}

		/*
  	Iterate ove rthe songs and generate random numbers to
  	swap the indexes of the shuffle array.
  */
		for (var _i = _config2.default.songs.length - 1; _i > 0; _i--) {
			var randNum = Math.floor(Math.random() * _config2.default.songs.length + 1);
			shuffleSwap(shuffleTemp, _i, randNum - 1);
		}

		/*
  	Set the shuffle list to the shuffle temp.
  */
		_config2.default.shuffle_list = shuffleTemp;
	}

	/**
  * Shuffle songs in a playlist
  *
  * Public Accessor: AmplitudeHelpers.shufflePlaylistSongs( playlist )
  *
  * @access public
  * @param {string} playlist - The playlist we are shuffling.
  */
	function shufflePlaylistSongs(playlist) {
		/*
  	Builds a temporary array with the length of the playlist songs.
  */
		var shuffleTemp = new Array(_config2.default.playlists[playlist].length);

		/*
  	Set the temporary array equal to the playlist array.
  */
		for (var i = 0; i < _config2.default.playlists[playlist].length; i++) {
			shuffleTemp[i] = _config2.default.songs[_config2.default.playlists[playlist][i]];
			shuffleTemp[i].original_index = _config2.default.playlists[playlist][i];
		}

		/*
  	Iterate ove rthe songs and generate random numbers to
  	swap the indexes of the shuffle array.
  */
		for (var _i2 = _config2.default.playlists[playlist].length - 1; _i2 > 0; _i2--) {
			var randNum = Math.floor(Math.random() * _config2.default.playlists[playlist].length + 1);
			shuffleSwap(shuffleTemp, _i2, randNum - 1);
		}

		/*
  	Set the shuffle list to the shuffle temp.
  */
		_config2.default.shuffled_playlists[playlist] = shuffleTemp;
	}

	/**
  * Swaps and randomizes the song shuffle.
  *
  * @access private
  * @param {object} shuffleList 	- The list of songs that is going to be shuffled
  * @param {number} original 		- The original index of he song in the songs array
  * @param {number} random 			- The randomized index that will be the new index of the song in the shuffle array.
  */
	function shuffleSwap(shuffleList, original, random) {
		var temp = shuffleList[original];
		shuffleList[original] = shuffleList[random];
		shuffleList[random] = temp;
	}

	/**
  * Sets the active playlist
  *
  * Public Accessor: AmplitudeHelpers.setActivePlaylist( playlist )
  *
  * @access public
  * @param {string} playlist - The string of the playlist being set to active.
  */
	function setActivePlaylist(playlist) {
		/*
  	If the active playlist is different than the playlist being set,
  	we run the `playlist_changed` callback.
  */
		if (_config2.default.active_playlist != playlist) {
			runCallback('playlist_changed');
		}

		/*
  	Set the active playlist to the playlist parameter.
  */
		_config2.default.active_playlist = playlist;
	}

	/**
  * Determines if the string passed in is a URL or not
  *
  * Public Accessor: AmplitudeHelpers.isURL( url )
  *
  * @access public
  * @param {string} url - The string we are testing to see if it's a URL.
  * @returns {boolean} True if the string is a url, false if it is not.
  */
	function isURL(url) {
		/*
  	Test the string against the URL pattern and return if it matches
  */
		var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

		return pattern.test(url);
	}

	/**
  * Determines if what is passed in is an integer or not.
  *
  * Public Accessor: AmplitudeHelpers.isInt( int )
  *
  * @access public
  * @param {string|number} int - The variable we are testing to see is an integer or not.
  * @returns {boolean} If the variable is an integer or not.
  */
	function isInt(int) {
		return !isNaN(int) && parseInt(Number(int)) == int && !isNaN(parseInt(int, 10));
	}

	/*
 	Returns the public functions
 */
	return {
		resetConfig: resetConfig,
		writeDebugMessage: writeDebugMessage,
		runCallback: runCallback,
		changeSong: changeSong,
		checkNewSong: checkNewSong,
		checkNewAlbum: checkNewAlbum,
		checkNewPlaylist: checkNewPlaylist,
		shuffleSongs: shuffleSongs,
		shufflePlaylistSongs: shufflePlaylistSongs,
		setActivePlaylist: setActivePlaylist,
		isURL: isURL,
		isInt: isInt
	};
}();

/**
 * AmplitudeJS Visual Sync
 * @module visual/AmplitudeVisualSync
*/
/**
 * Imports the config module
 * @module config
 */
exports.default = AmplitudeHelpers;
module.exports = exports['default'];

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _helpers = __webpack_require__(10);

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Helps with the syncing of the display data
 *
 * @module visual/AmplitudeVisualSync
 */
/**
 * Imports the config module
 * @module config
 */
var AmplitudeVisualSync = function () {
	/**
  * Visually displays the current time on the screen. This is called on
  * time update for the current song.
  *
  * @access public
  * @param {object} currentTime 					- An object containing the current time for the song in seconds, minutes, and hours.
  * @param {float} completionPercentage	- The percent of the way through the song the user is at.
  */
	function syncCurrentTime(currentTime, completionPercentage) {
		/*
  	Set current hour display.
  */
		_helpers2.default.syncCurrentHours(currentTime.hours);

		/*
  	Set current minute display.
  */
		_helpers2.default.syncCurrentMinutes(currentTime.minutes);

		/*
  	Set current second display.
  */
		_helpers2.default.syncCurrentSeconds(currentTime.seconds);

		/*
  	Set current time display.
  */
		_helpers2.default.syncCurrentTime(currentTime);

		/*
  	Set all song sliders to be to the current percentage
  	of the song played.
  */
		syncMainSliderLocation(completionPercentage);
		syncPlaylistSliderLocation(_config2.default.active_playlist, completionPercentage);
		syncSongSliderLocation(_config2.default.active_playlist, _config2.default.active_index, completionPercentage);

		_helpers2.default.syncSongPlayedProgressBar(completionPercentage);
	}

	/**
  * Visually sync all of the times to the initial time of 0. This is so
  * we can keep all the players in sync
  *
  * @access public
  */
	function resetTimes() {
		_helpers2.default.resetCurrentHours();
		_helpers2.default.resetCurrentMinutes();
		_helpers2.default.resetCurrentSeconds();
		_helpers2.default.resetCurrentTime();
	}

	/**
  * Visually syncs the song sliders back to 0. This usually happens when
  * a song has changed, we ensure that all song sliders get reset.
  *
  * @access public
  */
	function resetSongSliders() {
		var songSliders = document.getElementsByClassName("amplitude-song-slider");

		/*
  	Iterate over all of the song sliders and set them to
  	0 essentially resetting them.
  */
		for (var i = 0; i < songSliders.length; i++) {
			songSliders[i].value = 0;
		}
	}

	/**
  * Sets all of the song buffered progress bars to 0
  *
  * @access public
  */
	function resetSongBufferedProgressBars() {
		/*
  	Gets all of the song buffered progress bars.
  */
		var songBufferedProgressBars = document.getElementsByClassName("amplitude-buffered-progress");

		/*
  	Iterate over all of the song buffered progress bar and
  	set them to 0 which is like re-setting them.
  */
		for (var i = 0; i < songBufferedProgressBars.length; i++) {
			songBufferedProgressBars[i].value = 0;
		}
	}

	/**
  * Sets all of the song played progress bars to 0
  *
  * @access public
  */
	function resetSongPlayedProgressBars() {
		var songPlayedProgressBars = document.getElementsByClassName("amplitude-song-played-progress");

		for (var i = 0; i < songPlayedProgressBars.length; i++) {
			songPlayedProgressBars[i].value = 0;
		}
	}

	/**
  * Applies the class 'amplitude-active-song-container' to the element
  * containing visual information regarding the active song.
  *
  * @access public
  */
	function setActiveContainer() {
		var songContainers = document.getElementsByClassName('amplitude-song-container');

		/*
  	Removes all of the active song containrs.
  */
		for (var i = 0; i < songContainers.length; i++) {
			songContainers[i].classList.remove('amplitude-active-song-container');
		}

		/*
  	Finds the active index and adds the active song container to the element
  	that represents the song at the index.
  */
		if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
			if (document.querySelectorAll('.amplitude-song-container[amplitude-song-index="' + _config2.default.active_index + '"]')) {
				var _songContainers = document.querySelectorAll('.amplitude-song-container[amplitude-song-index="' + _config2.default.active_index + '"]');

				for (var _i = 0; _i < _songContainers.length; _i++) {
					if (!_songContainers[_i].hasAttribute('amplitude-playlist')) {
						_songContainers[_i].classList.add('amplitude-active-song-container');
					}
				}
			}
		} else {
			if (document.querySelectorAll('.amplitude-song-container[amplitude-song-index="' + _config2.default.active_index + '"][amplitude-playlist="' + _config2.default.active_playlist + '"]')) {
				var _songContainers2 = document.querySelectorAll('.amplitude-song-container[amplitude-song-index="' + _config2.default.active_index + '"][amplitude-playlist="' + _config2.default.active_playlist + '"]');

				for (var _i2 = 0; _i2 < _songContainers2.length; _i2++) {
					_songContainers2[_i2].classList.add('amplitude-active-song-container');
				}
			}
		}
	}

	/**
  * Displays the active song's metadata. This is called after a song has
  * been changed. This method takes the active song and displays the
  * metadata. So once the new active song is set, we update all of the
  * screen elements.
  *
  * @access public
  */
	function displaySongMetadata() {
		/*
  	Define the image meta data keys. These are managed separately
  	since we aren't actually changing the inner HTML of these elements.
  */
		var imageMetaDataKeys = ['cover_art_url', 'station_art_url', 'podcast_episode_cover_art_url'];

		/*
  	These are the ignored keys that we won't be worrying about displaying.
  	Every other key in the song object can be displayed.
  */
		var ignoredKeys = ['url', 'live'];

		/*
  	Get all of the song info elements
  */
		var songInfoElements = document.querySelectorAll('[amplitude-song-info]');

		/*
  	Iterate over all of the song info elements. We will either
  	set these to the new values, or clear them if the active song
  	doesn't have the info set.
  */
		for (var i = 0; i < songInfoElements.length; i++) {
			/*
   	Get the info so we can check if the active meta data has the
   	key.
   */
			var info = songInfoElements[i].getAttribute('amplitude-song-info');

			/*
   	Get the song info element playlist.
   */
			var playlist = songInfoElements[i].getAttribute('amplitude-playlist');

			/*
   	Get the main song info flag.
   */
			var main = songInfoElements[i].getAttribute('amplitude-main-song-info');

			/*
   	If the playlists match or the element is a main element, then
   	we set the song info.
   */
			if (_config2.default.active_playlist == playlist || main == 'true') {
				/*
    	If the active metadata has the key, then we set it,
    	otherwise we clear it. If it's an image element then
    	we default it to the default info if needed.
    */
				if (_config2.default.active_metadata[info] != undefined) {
					if (imageMetaDataKeys.indexOf(info) >= 0) {
						songInfoElements[i].setAttribute('src', _config2.default.active_metadata[info]);
					} else {
						songInfoElements[i].innerHTML = _config2.default.active_metadata[info];
					}
				} else {
					/*
     	We look for the default album art because
     	the actual key didn't exist. If the default album
     	art doesn't exist then we set the src attribute
     	to null.
     */
					if (imageMetaDataKeys.indexOf(info) >= 0) {
						if (_config2.default.default_album_art != '') {
							songInfoElements[i].setAttribute('src', _config2.default.default_album_art);
						} else {
							songInfoElements[i].setAttribute('src', '');
						}
					} else {
						songInfoElements[i].innerHTML = '';
					}
				}
			}
		}
	}

	/**
   * Sets the first song in the playlist. This is used to fill in the meta
  * data in the playlist
  *
  * @param {object} song 			- The song we are setting to be the first song in the playlist
  * @param {string} playlist 	- Key of the playlist we are setting the first song in
  */
	function setFirstSongInPlaylist(song, playlist) {
		/*
  	Define the image meta data keys. These are managed separately
  	since we aren't actually changing the inner HTML of these elements.
  */
		var imageMetaDataKeys = ['cover_art_url', 'station_art_url', 'podcast_episode_cover_art_url'];

		/*
  	These are the ignored keys that we won't be worrying about displaying.
  	Every other key in the song object can be displayed.
  */
		var ignoredKeys = ['url', 'live'];

		/*
  	Get all of the song info elements
  */
		var songInfoElements = document.querySelectorAll('[amplitude-song-info][amplitude-playlist="' + playlist + '"]');

		/*
  	Iterate over all of the song info elements. We will either
  	set these to the new values, or clear them if the active song
  	doesn't have the info set.
  */
		for (var i = 0; i < songInfoElements.length; i++) {
			/*
   	Get the info so we can check if the active meta data has the
   	key.
   */
			var info = songInfoElements[i].getAttribute('amplitude-song-info');

			/*
   	Get the song info element playlist.
   */
			var elementPlaylist = songInfoElements[i].getAttribute('amplitude-playlist');

			/*
   	If the playlists match or the element is a main element, then
   	we set the song info.
   */
			if (elementPlaylist == playlist) {
				/*
    	If the active metadata has the key, then we set it,
    	otherwise we clear it. If it's an image element then
    	we default it to the default info if needed.
    */
				if (song[info] != undefined) {
					if (imageMetaDataKeys.indexOf(info) >= 0) {
						songInfoElements[i].setAttribute('src', song[info]);
					} else {
						songInfoElements[i].innerHTML = song[info];
					}
				} else {
					/*
     	We look for the default album art because
     	the actual key didn't exist. If the default album
     	art doesn't exist then we set the src attribute
     	to null.
     */
					if (imageMetaDataKeys.indexOf(info) >= 0) {
						if (song.default_album_art != '') {
							songInfoElements[i].setAttribute('src', song.default_album_art);
						} else {
							songInfoElements[i].setAttribute('src', '');
						}
					} else {
						songInfoElements[i].innerHTML = '';
					}
				}
			}
		}
	}

	/**
  * Sets all of the visual playback speed buttons to have the right class
  * to display the background image that represents the current playback
  * speed.
  *
  * @access public
  */
	function syncPlaybackSpeed() {
		/*
  	Gets all of the playback speed classes.
  */
		var playbackSpeedClasses = document.getElementsByClassName("amplitude-playback-speed");

		/*
  	Iterates over all of the playback speed classes
  	applying the right speed class for visual purposes.
  */
		for (var i = 0; i < playbackSpeedClasses.length; i++) {
			/*
   	Removes all of the old playback speed classes.
   */
			playbackSpeedClasses[i].classList.remove('amplitude-playback-speed-10');
			playbackSpeedClasses[i].classList.remove('amplitude-playback-speed-15');
			playbackSpeedClasses[i].classList.remove('amplitude-playback-speed-20');

			/*
   	Switch the current playback speed and apply the appropriate
   	speed class.
   */
			switch (_config2.default.playback_speed) {
				case 1:
					playbackSpeedClasses[i].classList.add('amplitude-playback-speed-10');
					break;
				case 1.5:
					playbackSpeedClasses[i].classList.add('amplitude-playback-speed-15');
					break;
				case 2:
					playbackSpeedClasses[i].classList.add('amplitude-playback-speed-20');
					break;
			}
		}
	}

	/**
  * Syncs the buffered progress bars to the current percentage in the config
  *
  * @access public
  */
	function syncBufferedProgressBars() {
		/*
  	Gets all of the song buffered progress bars.
  */
		var songBufferedProgressBars = document.getElementsByClassName("amplitude-buffered-progress");

		/*
  	Iterate over all of the song buffered progress bar and
  	set them to 0 which is like re-setting them.
  */
		for (var i = 0; i < songBufferedProgressBars.length; i++) {
			songBufferedProgressBars[i].value = parseFloat(parseFloat(_config2.default.buffered) / 100);
		}
	}

	/**
  * Visually syncs the volume sliders so they are all the same if there
  * are more than one.
  *
  * @access public
  */
	function syncVolumeSliders() {
		var amplitudeVolumeSliders = document.getElementsByClassName("amplitude-volume-slider");

		/*
  	Iterates over all of the volume sliders for the song, setting the value
  	to the config value.
  */
		for (var i = 0; i < amplitudeVolumeSliders.length; i++) {
			amplitudeVolumeSliders[i].value = _config2.default.active_song.volume * 100;
		}
	}

	/**
  * Sets all of the play pause buttons to paused.
  *
  * @access public
  */
	function setPlayPauseButtonsToPause() {
		/*
  	Gets all of the play pause elements
  */
		var playPauseElements = document.querySelectorAll('.amplitude-play-pause');

		/*
  	Sets all of the elements to pause
  */
		for (var i = 0; i < playPauseElements.length; i++) {
			_helpers2.default.setElementPause(playPauseElements[i]);
		}
	}

	/**
  * Syncs the main play pause buttons to the state of the active song.
  *
  * @param {string} state The state of the player
  * @access public
  */
	function syncMainPlayPause(state) {
		/*
  	Ensures we have a string for the state otherwise we grab the
  	state from the config.
  */
		if (typeof state != "string") {
			state = _config2.default.active_song.paused ? "paused" : "playing";
		}

		/*
  	Get all play pause buttons.
  */
		var playPauseElements = document.querySelectorAll('.amplitude-play-pause[amplitude-main-play-pause="true"]');

		/*
  	Iterate over all of the play pause elements syncing the
  	display visually.
  */
		for (var i = 0; i < playPauseElements.length; i++) {
			/*
   	Determines what classes we should add and remove
   	from the elements.
   */
			switch (state) {
				case 'playing':
					_helpers2.default.setElementPlay(playPauseElements[i]);
					break;
				case 'paused':
					_helpers2.default.setElementPause(playPauseElements[i]);
					break;
			}
		}
	}

	/**
  * Syncs the main playlist play pause buttons to the state of the active song.
  *
  * @access public
  * @param {string} playlist 	- The playlist we are setting the play pause state for.
  * @param {string} state 			- Either playing or paused for the state of the active song.
  */
	function syncPlaylistPlayPause(playlist, state) {
		/*
  	Ensures we have a string for the state otherwise we grab the
  	state from the config.
  */
		if (typeof state != "string") {
			state = _config2.default.active_song.paused ? "paused" : "playing";
		}

		/*
  	Get all of the main playlist play pause elements
  */
		var playlistPlayPauseElements = document.querySelectorAll('.amplitude-play-pause[amplitude-playlist-main-play-pause="true"]');

		/*
  	Iterate over the play pause elements, syncing the state accordingly.
  */
		for (var i = 0; i < playlistPlayPauseElements.length; i++) {
			/*
   	If the element has the same playlist attribute as the playlist
   	passed in and the state is playing, we set the element to
   	be playing otherwise we set it to pause. Setting to pause
   	means the element doesn't match the active playlist or the
   	state is paused.
   */
			if (playlistPlayPauseElements[i].getAttribute('amplitude-playlist') == playlist && state == 'playing') {

				_helpers2.default.setElementPlay(playlistPlayPauseElements[i]);
			} else {
				_helpers2.default.setElementPause(playlistPlayPauseElements[i]);
			}
		}
	}

	/**
  * Syncs the song play pause buttons to the state of the active song.
  *
  * @access public
  * @param {string} playlist 	- The playlist we are setting the play pause state for.
  * @param {int} song 					- The index of the song we are syncing the state for
  * @param {string} state 			- Either playing or paused for the state of the active song.
  */
	function syncSongPlayPause(playlist, song, state) {
		/*
  	Ensures we have a string for the state otherwise we grab the
  	state from the config.
  */
		if (typeof state != "string") {
			state = _config2.default.active_song.paused ? "paused" : "playing";
		}

		/*
  	If the playlist is null or empty, we make sure that any song
  	that is a part of a playlist is set to paused.
  */
		if (playlist == null || playlist == '') {
			/*
   	Get all of the individual song play pause buttons. These have an
   	amplitude-song-index attribute. Some have amplitude-playlist which
   	means they are individual songs within a playlist.
   */
			var songPlayPauseElements = document.querySelectorAll('.amplitude-play-pause[amplitude-song-index]');

			/*
   	Iterate over all of the song play pause elements
   */
			for (var i = 0; i < songPlayPauseElements.length; i++) {
				/*
    	If the song element has an attribute for amplitude-playlist then
    	we set it to paused no matter what because the state of the player
    	is not in a playlist mode.
    */
				if (songPlayPauseElements[i].hasAttribute('amplitude-playlist')) {
					_helpers2.default.setElementPause(songPlayPauseElements[i]);
				} else {
					/*
     	If the state of the song is playing and the song index matches the
     	index of the song we have, we set the element to playing otherwise
     	we set the element to paused.
     */
					if (state == 'playing' && songPlayPauseElements[i].getAttribute('amplitude-song-index') == song) {
						_helpers2.default.setElementPlay(songPlayPauseElements[i]);
					} else {
						_helpers2.default.setElementPause(songPlayPauseElements[i]);
					}
				}
			}
		} else {
			/*
   	Get all of the individual song play pause buttons. These have an
   	amplitude-song-index attribute. Some have amplitude-playlist which
   	means they are individual songs within a playlist.
   */
			var _songPlayPauseElements = document.querySelectorAll('.amplitude-play-pause[amplitude-song-index]');

			/*
   	Iterate over all of the individual play pause elements.
   */
			for (var _i3 = 0; _i3 < _songPlayPauseElements.length; _i3++) {
				/*
    	Since we have an active playlist this time, we want any stand alone
    	songs to be set to paused since the scope is within a playlist.
    		We check to see if the element has an amplitude-playlist attribute.
    */
				if (_songPlayPauseElements[_i3].hasAttribute('amplitude-playlist')) {

					/*
     	Check to see if the song index matches the index passed in and the
     	playlist matches the scoped playlist we are looking for and the
     	state of the player is playing, then we set the element to play. If those
     	three parameters are not met, set the element to pause.
     */
					if (_songPlayPauseElements[_i3].getAttribute('amplitude-song-index') == song && _songPlayPauseElements[_i3].getAttribute('amplitude-playlist') == playlist && state == 'playing') {
						_helpers2.default.setElementPlay(_songPlayPauseElements[_i3]);
					} else {
						_helpers2.default.setElementPause(_songPlayPauseElements[_i3]);
					}
				} else {
					/*
     	Set any individual songs (songs outside of a playlist scope) to pause
     	since we are in the scope of a playlist.
     */
					_helpers2.default.setElementPause(_songPlayPauseElements[_i3]);
				}
			}
		}
	}

	/**
  * Syncs repeat for all of the repeat buttons. Users
  * can apply styles to the 'amplitude-repeat-on' and
  * 'amplitude-repeat-off' classes. They represent the state
  * of the player.
  */
	function syncRepeat() {
		/*
  	Gets all of the repeat classes
  */
		var repeatClasses = document.getElementsByClassName("amplitude-repeat");

		/*
  	Iterate over all of the repeat classes. If repeat is on,
  	then add the 'amplitude-repeat-on' class and remove the
  	'amplitude-repeat-off' class. If it's off, then do the
  	opposite.
  */
		for (var i = 0; i < repeatClasses.length; i++) {
			if (_config2.default.repeat) {
				repeatClasses[i].classList.add('amplitude-repeat-on');
				repeatClasses[i].classList.remove('amplitude-repeat-off');
			} else {
				repeatClasses[i].classList.remove('amplitude-repeat-on');
				repeatClasses[i].classList.add('amplitude-repeat-off');
			}
		}
	}

	/**
  * Syncs repeat for all of the playlist repeat buttons. Users
  * can apply styles to the `amplitude-repeat-on` and `amplitude-repeat-off`
  * classes. They repreent the state of the playlist in the player.
  */
	function syncRepeatPlaylist(playlist) {
		/*
   Gets all of the repeat buttons.
  */
		var repeatButtons = document.getElementsByClassName("amplitude-repeat");

		/*
   Iterate over all of the repeat buttons
  */
		for (var i = 0; i < repeatButtons.length; i++) {
			/*
    Ensure that the repeat button belongs to matches the
    playlist we are syncing the state for.
   */
			if (repeatButtons[i].getAttribute('amplitude-playlist') == playlist) {
				/*
     If the state of the playlist is shuffled on, true, then
     we add the 'amplitude-repeat-on' class and remove the
     'amplitude-repeat-off' class. If the player is not shuffled
     then we do the opposite.
    */
				if (_config2.default.repeat_statuses[playlist]) {
					repeatButtons[i].classList.add('amplitude-repeat-on');
					repeatButtons[i].classList.remove('amplitude-repeat-off');
				} else {
					repeatButtons[i].classList.add('amplitude-repeat-off');
					repeatButtons[i].classList.remove('amplitude-repeat-on');
				}
			}
		}
	}

	/**
  * Syncs repeat for all of the repeat song buttons. Users
  * can apply styles to the 'amplitude-repeat-song-on' and
  * 'amplitude-repeat-song-off' classes. They represent the state
  * of the player.
  */
	function syncRepeatSong() {
		/*
  	Gets all of the repeat song classes
  */
		var repeatSongClasses = document.getElementsByClassName("amplitude-repeat-song");

		/*
  	Iterate over all of the repeat song classes. If repeat is on,
  	then add the 'amplitude-repeat-song-on' class and remove the
  	'amplitude-repeat-song-off' class. If it's off, then do the
  	opposite.
  */
		for (var i = 0; i < repeatSongClasses.length; i++) {
			if (_config2.default.repeat_song) {
				repeatSongClasses[i].classList.add('amplitude-repeat-song-on');
				repeatSongClasses[i].classList.remove('amplitude-repeat-song-off');
			} else {
				repeatSongClasses[i].classList.remove('amplitude-repeat-song-on');
				repeatSongClasses[i].classList.add('amplitude-repeat-song-off');
			}
		}
	}

	/**
  * Syncs mute for all of the mute buttons. This represents the
  * state of the player if it's muted or not.
  *
  * @access public
  * @param {string} state 	- The muted state of the player.
  */
	function syncMute(state) {
		/*
  	Get all of the mute buttons.
  */
		var muteClasses = document.getElementsByClassName("amplitude-mute");

		/*
  	Iterate over all of the mute classes. If the state of the player
  	is not-muted then we add the amplitude-not-muted classe and remove
  	the amplitude muted class otherwise we do the opposite.
  */
		for (var i = 0; i < muteClasses.length; i++) {
			if (!state) {
				muteClasses[i].classList.add('amplitude-not-muted');
				muteClasses[i].classList.remove('amplitude-muted');
			} else {
				muteClasses[i].classList.remove('amplitude-not-muted');
				muteClasses[i].classList.add('amplitude-muted');
			}
		}
	}

	/**
  * Syncs the global shuffle button visual state.
  *
  * @access public
  * @param {boolean} state  	- The shuffled state of the player.
  */
	function syncShuffle(state) {
		/*
  	Gets the shuffle buttons.
  */
		var shuffleButtons = document.getElementsByClassName("amplitude-shuffle");

		/*
  	Iterate over all of the shuffle buttons.
  */
		for (var i = 0; i < shuffleButtons.length; i++) {
			/*
   	Ensure the shuffle button doesn't belong to a playlist. We have
   	a separate method for that.
   */
			if (shuffleButtons[i].getAttribute('amplitude-playlist') == null) {
				/*
    	If the state of the player is shuffled on, true, then
    	we add the 'amplitude-shuffle-on' class and remove the
    	'amplitude-shuffle-off' class. If the player is not shuffled
    	then we do the opposite.
    */
				if (state) {
					shuffleButtons[i].classList.add('amplitude-shuffle-on');
					shuffleButtons[i].classList.remove('amplitude-shuffle-off');
				} else {
					shuffleButtons[i].classList.add('amplitude-shuffle-off');
					shuffleButtons[i].classList.remove('amplitude-shuffle-on');
				}
			}
		}
	}

	/**
  * Syncs the playlist shuffle button visual state.
  *
  * @access public
  * @param {boolean} state 	- The shuffled state of the player.
  * @param {string} playlist - The playlist string the shuffle button belongs to.
  */
	function syncPlaylistShuffle(state, playlist) {
		/*
  	Gets all of the shuffle buttons.
  */
		var shuffleButtons = document.getElementsByClassName("amplitude-shuffle");

		/*
  	Iterate over all of the shuffle buttons
  */
		for (var i = 0; i < shuffleButtons.length; i++) {
			/*
   	Ensure that the playlist the shuffle button belongs to matches the
   	playlist we are syncing the state for.
   */
			if (shuffleButtons[i].getAttribute('amplitude-playlist') == playlist) {
				/*
    	If the state of the playlist is shuffled on, true, then
    	we add the 'amplitude-shuffle-on' class and remove the
    	'amplitude-shuffle-off' class. If the player is not shuffled
    	then we do the opposite.
    */
				if (state) {
					shuffleButtons[i].classList.add('amplitude-shuffle-on');
					shuffleButtons[i].classList.remove('amplitude-shuffle-off');
				} else {
					shuffleButtons[i].classList.add('amplitude-shuffle-off');
					shuffleButtons[i].classList.remove('amplitude-shuffle-on');
				}
			}
		}
	}

	/**
  * Syncs the main slider location
  *
  * @access public
  * @param {number} location 	- The location of the song as a percentage.
  */
	function syncMainSliderLocation(location) {
		/*
  	Ensure we have a location that's a number
  */
		location = !isNaN(location) ? location : 0;

		/*
  	Gets the main song sliders
  */
		var mainSongSliders = document.querySelectorAll('.amplitude-song-slider[amplitude-main-song-slider="true"]');

		/*
  	Iterates over all of the main sliders and sets the value to the
  	percentage of the song played.
  */
		for (var i = 0; i < mainSongSliders.length; i++) {
			mainSongSliders[i].value = location;
		}
	}

	/**
  * Syncs playlist song slider locations
  *
  * @access public
  * @param {string} playlist 	- The playlist we are setting the song slider for.
  * @param {number} location 	- The location of the song as a percentage.
  */
	function syncPlaylistSliderLocation(playlist, location) {
		/*
  	Ensure we have a location that's a number
  */
		location = !isNaN(location) ? location : 0;

		/*
  	Gets the playlist song sliders
  */
		var playlistSongSliders = document.querySelectorAll('.amplitude-song-slider[amplitude-playlist-song-slider="true"][amplitude-playlist="' + playlist + '"]');

		/*
  	Iterates over all of the playlist sliders and sets the value to the
  	percentage of the song played.
  */
		for (var i = 0; i < playlistSongSliders.length; i++) {
			playlistSongSliders[i].value = location;
		}
	}

	/**
  * Syncs individual song slider locations
  *
  * @access public
  * @param {string} playlist 	- The playlist we are setting the song slider for.
  * @param {number} songIndex 	- The index of the song we are adjusting the song slider for.
  * @param {number} location 	- The location of the song as a percentage.
  */
	function syncSongSliderLocation(playlist, songIndex, location) {
		/*
  	Ensure we have a location that's a number
  */
		location = !isNaN(location) ? location : 0;
		/*
  	If the playlist is set, we get all of the individual song sliders
  	that relate to the song and the playlist.
  */
		if (playlist != '' && playlist != null) {
			/*
   	Gets the song sliders for the individual songs and the
   	playlist
   */
			var songSliders = document.querySelectorAll('.amplitude-song-slider[amplitude-playlist="' + playlist + '"][amplitude-song-index="' + songIndex + '"]');

			/*
   	Iterates over all of the playlist sliders and set the value to the
   	percentage of the song played.
   */
			for (var i = 0; i < songSliders.length; i++) {
				songSliders[i].value = location;
			}
		} else {
			/*
   	Get the individual song slider by index
   */
			var _songSliders = document.querySelectorAll('.amplitude-song-slider[amplitude-song-index="' + songIndex + '"]');

			/*
   	Iterats over all of the song sliders that have the index of
   	the song we are sliding. If the song doesn't have a playlist
   	attribute, we set the location.
   */
			for (var _i4 = 0; _i4 < _songSliders.length; _i4++) {
				if (!_songSliders[_i4].hasAttribute('amplitude-playlist')) {
					if (location != 0) {
						_songSliders[_i4].value = location;
					}
				}
			}
		}
	}

	/**
  * Sets the volume slider location
  *
  * @access public
  * @param {number} volume 	- The volume from 0 - 1 for song volume.
  */
	function syncVolumeSliderLocation(volume) {
		/*
  	Gets all of the volume sliders
  */
		var volumeSliders = document.querySelectorAll('.amplitude-volume-slider');

		/*
  	Iterates over all of the sliders and sets their volume
  	to the volume of the song.
  */
		for (var i = 0; i < volumeSliders.length; i++) {
			volumeSliders[i].value = volume;
		}
	}

	/**
  * Syncs the song's duration
  *
  * @access public
  * @param {object} currentTime 		- Object containing information about the current time of the song.
  * @param {object} songDuration 	- Object containing information about the duration of the song.
  */
	function syncSongDuration(currentTime, songDuration) {
		/*
  	Set duration hour display.
  */
		_helpers2.default.syncDurationHours(songDuration != undefined && !isNaN(songDuration.hours) ? songDuration.hours : '00');

		/*
  	Set duration minute display.
  */
		_helpers2.default.syncDurationMinutes(songDuration != undefined && !isNaN(songDuration.minutes) ? songDuration.minutes : '00');

		/*
  	Set duration second display.
  */
		_helpers2.default.syncDurationSeconds(songDuration != undefined && !isNaN(songDuration.seconds) ? songDuration.seconds : '00');

		/*
  	Set duration time display.
  */
		_helpers2.default.syncDurationTime(songDuration != undefined ? songDuration : {});

		/*
  	Set count down time display.
  */
		_helpers2.default.syncCountDownTime(currentTime, songDuration);
	}

	/**
  * Sets the meta data for songs loaded in the songs array
  */
	function syncSongsMetaData() {
		/*
  	Define the image meta data keys. These are managed separately
  	since we aren't actually changing the inner HTML of these elements.
  */
		var imageMetaDataKeys = ['cover_art_url', 'station_art_url', 'podcast_episode_cover_art_url'];

		/*
  	These are the ignored keys that we won't be worrying about displaying.
  	Every other key in the song object can be displayed.
  */
		var ignoredKeys = ['url', 'live'];

		/*
  	Get all of the song info elements
  */
		var songInfoElements = document.querySelectorAll('[amplitude-song-info]');

		/*
  	Iterate over all of the song info elements. We will either
  	set these to the new values, or clear them if the active song
  	doesn't have the info set.
  */
		for (var i = 0; i < songInfoElements.length; i++) {

			/*
   	For this method we do not want the element to have any playlist or
   	main song info. This way we aren't adjusting the main song information for the
   	global player or the playlist player.
   */
			if (songInfoElements[i].getAttribute('amplitude-playlist') == null && songInfoElements[i].getAttribute('amplitude-main-song-info') == null && songInfoElements[i].getAttribute('amplitude-song-index') != null) {

				/*
    		Get the info so we can check if the active meta data has the
    		key.
    	*/
				var info = songInfoElements[i].getAttribute('amplitude-song-info');
				var index = songInfoElements[i].getAttribute('amplitude-song-index');

				/*
    	Make sure that the song index they are referencing is defined.
    */
				if (_config2.default.songs[index][info] != undefined) {

					/*
     	If it's an image meta data key, then we set the src attribute of
     	the element. Otherwise we set the inner HTML of the element.
     */
					if (imageMetaDataKeys.indexOf(info) >= 0) {
						songInfoElements[i].setAttribute('src', _config2.default.songs[index][info]);
					} else {
						songInfoElements[i].innerHTML = _config2.default.songs[index][info];
					}
				}
			}
		}
	}

	/**
 	Returns the publically available functions
 	@TODO Re-order to order of methods in module
 */
	return {
		syncCurrentTime: syncCurrentTime,
		resetTimes: resetTimes,
		resetSongSliders: resetSongSliders,
		resetSongPlayedProgressBars: resetSongPlayedProgressBars,
		resetSongBufferedProgressBars: resetSongBufferedProgressBars,
		setActiveContainer: setActiveContainer,
		displaySongMetadata: displaySongMetadata,
		syncPlaybackSpeed: syncPlaybackSpeed,
		syncBufferedProgressBars: syncBufferedProgressBars,
		syncVolumeSliders: syncVolumeSliders,
		setPlayPauseButtonsToPause: setPlayPauseButtonsToPause,
		setFirstSongInPlaylist: setFirstSongInPlaylist,
		syncMainPlayPause: syncMainPlayPause,
		syncPlaylistPlayPause: syncPlaylistPlayPause,
		syncSongPlayPause: syncSongPlayPause,
		syncRepeat: syncRepeat,
		syncRepeatSong: syncRepeatSong,
		syncRepeatPlaylist: syncRepeatPlaylist,
		syncMute: syncMute,
		syncShuffle: syncShuffle,
		syncPlaylistShuffle: syncPlaylistShuffle,
		syncMainSliderLocation: syncMainSliderLocation,
		syncPlaylistSliderLocation: syncPlaylistSliderLocation,
		syncSongSliderLocation: syncSongSliderLocation,
		syncVolumeSliderLocation: syncVolumeSliderLocation,
		syncSongDuration: syncSongDuration,
		syncSongsMetaData: syncSongsMetaData
	};
}();

/**
 * Imports the Amplitude Visual Sync Helpers to keep the display in sync
 * @module visual/AmplitudeVisualSyncHelpers
 */
exports.default = AmplitudeVisualSync;
module.exports = exports['default'];

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _helpers = __webpack_require__(1);

var _helpers2 = _interopRequireDefault(_helpers);

var _visual = __webpack_require__(2);

var _visual2 = _interopRequireDefault(_visual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Interacts directly with native functions of the Audio element. Logic
 * leading up to these methods are handled by click handlers which call
 * helpers and visual synchronizers. These are the core functions of AmplitudeJS.
 * Every other function that leads to these prepare the information to be
 * acted upon by these functions.
 *
 * @module core/AmplitudeCore
 */


/**
 * AmplitudeJS Core Helpers
 * @module core/helpers
 */
var AmplitudeCore = function () {
	/**
  * Plays the active song. If the current song is live, it reconnects
  * the stream before playing.
  *
  * Public Accessor: Amplitude.play()
  *
  * @access public
  */
	function play() {
		/*
  	Run the before play callback
  */
		_helpers2.default.runCallback('before_play');

		/*
  	If the audio is live we re-conenct the stream.
  */
		if (_config2.default.active_metadata.live) {
			reconnectStream();
		}

		/*
  	Mobile remote sources need to be reconnected on play. I think this is
  	because mobile browsers are optimized not to load all resources
  	for speed reasons. We only do this if mobile and the paused button
  	is not clicked. If the pause button was clicked then we don't reconnect
  	or the user will lose their place in the stream.
  */
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !_config2.default.paused) {
			reconnectStream();
		}

		/*
  	Play the song and set the playback rate to the playback
  	speed.
  */
		_config2.default.active_song.play();
		_config2.default.active_song.playbackRate = _config2.default.playback_speed;

		/*
  	Run the after play callback
  */
		_helpers2.default.runCallback('after_play');
	}

	/**
  * Pauses the active song. If it's live, it disconnects the stream.
  *
  * Public Accessor: Amplitude.pause()
  *
  * @access public
  */
	function pause() {
		/*
  	Run the before pause callback.
  */
		_helpers2.default.runCallback('before_pause');

		/*
  	Pause the active song.
  */
		_config2.default.active_song.pause();

		/*
  	Flag that pause button was clicked.
  */
		_config2.default.paused = true;

		/*
  	If the song is live, we disconnect the stream so we aren't
  	saving it to memory.
  */
		if (_config2.default.active_metadata.live) {
			disconnectStream();
		}

		/*
  	Run the after pause callback.
  */
		_helpers2.default.runCallback('after_pause');
	}

	/**
  * Stops the active song by setting the current song time to 0.
  * When the user resumes, it will be from the beginning.
  * If it's a live stream it disconnects.
  *
  * Public Accessor: Amplitude.stop()
  *
  * @access public
  */
	function stop() {
		/*
  	Runs the before stop callback.
  */
		_helpers2.default.runCallback('before_stop');

		/*
  	Set the current time of the song to 0 which will reset the song.
  */
		if (_config2.default.active_song.currentTime != 0) {
			_config2.default.active_song.currentTime = 0;
		}

		/*
  	Run pause so the song will stop
  */
		_config2.default.active_song.pause();

		/*
  	If the song is live, disconnect the stream.
  */
		if (_config2.default.active_metadata.live) {
			disconnectStream();
		}

		/*
  	Run the after stop callback
  */
		_helpers2.default.runCallback('after_stop');
	}

	/**
  * Sets the song volume.
  *
  * Public Accessor: Amplitude.setVolume( volumeLevel )
  *
  * @access public
  * @param {number} volumeLevel - A number between 1 and 100 as a percentage of
  * min to max for a volume level.
  */
	function setVolume(volumeLevel) {
		/*
  	If the volume is set to mute somewhere else, we sync the display.
  */
		if (volumeLevel == 0) {
			_visual2.default.syncMute(true);
		} else {
			_visual2.default.syncMute(false);
		}

		/*
  	Set the volume of the active song.
  */
		_config2.default.active_song.volume = volumeLevel / 100;
	}

	/**
  * Sets the song percentage. If it's a live song, we ignore this because
  * we can't skip ahead. This is an issue if you have a playlist with
  * a live source.
  *
  * Public Accessor: Amplitude.setSongLocation( songPercentage )
  *
  * @access public
  * @param {number} songPercentage - A number between 1 and 100 as a percentage of song completion.
  */
	function setSongLocation(songPercentage) {
		/*
  	As long as the song is not live, we can set the current time of the
  	song to the percentage the user passed in.
  */
		if (!_config2.default.active_metadata.live) {
			_config2.default.active_song.currentTime = _config2.default.active_song.duration * (song_percentage / 100);
		}
	}

	/**
  * Skips to a location in a song
  *
  * Public Accessor: Amplitude.skipToLocation( seconds )
  *
  * @access public
  * @param {number} seconds - An integer containing the seconds to skip to
  */
	function skipToLocation(seconds) {
		/*
  	When the active song can be played through, we can check to
  	see if the seconds will work. We only bind the event handler
  	once and remove it once it's fired.
  */
		_config2.default.active_song.addEventListener('canplaythrough', function () {
			/*
   	If the active song duration is greater than or equal to the
   	amount of seconds the user wants to skip to and the seconds
   	is greater than 0, we skip to the seconds defined.
   */
			if (_config2.default.active_song.duration >= seconds && seconds > 0) {
				_config2.default.active_song.currentTime = seconds;
			} else {
				_helpers2.default.writeDebugMessage('Amplitude can\'t skip to a location greater than the duration of the audio or less than 0');
			}
		}, { once: true });
	}

	/**
  * Disconnects the live stream
  *
  * Public Accessor: Amplitude.disconnectStream()
  *
  * @access public
  */
	function disconnectStream() {
		_config2.default.active_song.src = '';
		_config2.default.active_song.load();
	}

	/**
  * Reconnects the live stream
  *
  * Public Accessor: Amplitude.reconnectStream()
  *
  * @access public\
  */
	function reconnectStream() {
		_config2.default.active_song.src = _config2.default.active_metadata.url;
		_config2.default.active_song.load();
	}

	/**
  * When you pass a song object it plays that song right awawy.  It sets
  * the active song in the config to the song you pass in and synchronizes
  * the visuals.
  *
  * Public Accessor: Amplitude.playNow( song )
  *
  * @access public
  * @param {object} song - JSON representation of a song.
  */
	function playNow(song) {
		/*
  	Makes sure the song object has a URL associated with it
  	or there will be nothing to play.
  */
		if (song.url) {
			_config2.default.active_song.src = song.url;
			_config2.default.active_metadata = song;
			_config2.default.active_album = song.album;
		} else {
			/*
   	Write error message since the song passed in doesn't
   	have a URL.
   */
			_helpers2.default.writeDebugMessage('The song needs to have a URL!');
		}

		/*
  	Sets the main song control status visual
  */
		_visual2.default.syncMainPlayPause('playing');

		/*
  	Update the song meta data
  */
		_visual2.default.displaySongMetadata();

		/*
  	Reset the song sliders, song progress bar info, and
  	reset times. This ensures everything stays in sync.
  */
		_visual2.default.resetSongSliders();

		_visual2.default.resetSongPlayedProgressBars();

		_visual2.default.resetTimes();

		/*
  	Plays the song.
  */
		play();
	}

	/**
  * Plays the song at a specific index in the songs array
  *
  * Public Accessor: Amplitude.playSongAtIndex( song )
  *
  * @access public
  * @param {number} index - The number representing the song in the songs array
  */
	function playSongAtIndex(index) {
		/*
  	Stop the current song.
  */
		stop();

		/*
  	Determine if there is a new playlist, if so set the active playlist and change the song.
  */
		if (_helpers2.default.checkNewPlaylist(null)) {
			_helpers2.default.setActivePlaylist(null);

			_helpers2.default.changeSong(index);
		}

		/*
  	Check if the song is new. If so, change the song.
  */
		if (_helpers2.default.checkNewSong(index)) {
			_helpers2.default.changeSong(index);
		}

		/*
   Sync all of the play pause buttons.
  */
		_visual2.default.syncMainPlayPause('playing');
		_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'playing');
		_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'playing');

		/*
   Play the song
  */
		play();
	}

	/**
 * Plays a song at the index passed in for the playlist provided. The index passed
 * in should be the index of the song in the playlist and not the songs array.
 *
 * @access public
 * @param {number} index 		- The number representing the song in the playlist array.
 * @param {string} playlist 	- The key string representing the playlist we are playing the song from.
 *
 */
	function playPlaylistSongAtIndex(index, playlist) {
		/*
  		Stop the current song.
  */
		stop();

		/*
  		Get the index of the song in the songs array. This is the integer at the index
  	in the playlist.
  */
		var songIndex = _config2.default.playlists[playlist][index];

		/*
  		Determine if there is a new playlist, if so set the active playlist and change the song.
  */
		if (_helpers2.default.checkNewPlaylist(playlist)) {
			_helpers2.default.setActivePlaylist(playlist);

			_helpers2.default.changeSong(songIndex);
		}

		/*
  		Check if the song is new. If so, change the song.
  */
		if (_helpers2.default.checkNewSong(songIndex)) {
			_helpers2.default.changeSong(songIndex);
		}

		/*
  	Sync all of the play pause buttons.
  */
		_visual2.default.syncMainPlayPause('playing');
		_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'playing');
		_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'playing');

		/*
  	Play the song
  */
		play();
	}

	/**
  * Sets the playback speed for the song.
  *
  * @param {number} playbackSpeed The speed we want the song to play back at.
  */
	function setPlaybackSpeed(playbackSpeed) {
		/*
  	Set the config playback speed.
  */
		_config2.default.playback_speed = playbackSpeed;

		/*
  	Set the active song playback rate.
  */
		_config2.default.active_song.playbackRate = _config2.default.playback_speed;
	}

	/*
 	Return publically facing functions
 */
	return {
		play: play,
		pause: pause,
		stop: stop,
		setVolume: setVolume,
		setSongLocation: setSongLocation,
		skipToLocation: skipToLocation,
		disconnectStream: disconnectStream,
		reconnectStream: reconnectStream,
		playNow: playNow,
		playSongAtIndex: playSongAtIndex,
		playPlaylistSongAtIndex: playPlaylistSongAtIndex,
		setPlaybackSpeed: setPlaybackSpeed
	};
}();

/**
 * AmplitudeJS Visual Sync
 * @module visual/visual
*/
/**
 * Imports the config module
 * @module config
 */
exports.default = AmplitudeCore;
module.exports = exports['default'];

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _helpers = __webpack_require__(1);

var _helpers2 = _interopRequireDefault(_helpers);

var _handlers = __webpack_require__(7);

var _handlers2 = _interopRequireDefault(_handlers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
|----------------------------------------------------------------------------------------------------
| EVENTS METHODS
|----------------------------------------------------------------------------------------------------
| These methods are called when we need to bind events to certain elements.
|
| METHODS:
| 	initializeEvents()
|	bindPlay()
|	bindPause()
|	bindPlayPause()
|	bindStop()
|	bindMute()
|	bindVolumeUp()
|	bindVolumeDown()
|	bindSongSlider()
|	bindVolumeSlider()
|	bindNext()
|	bindPrev()
|	bindShuffle()
|	bindRepeat()
|	bindPlaybackSpeed()
|	bindSkipTo()
|      bindProgress()
*/
var AmplitudeEvents = function () {
	/*--------------------------------------------------------------------------
 	Initializes the handlers for the events listened to by Amplitude
 --------------------------------------------------------------------------*/
	function initializeEvents() {
		/*
  	Write out debug message
  */
		_helpers2.default.writeDebugMessage('Beginning initialization of event handlers..');

		/*
  	Sets flag that the screen is moving and not a tap
  */
		document.addEventListener('touchmove', function () {
			_config2.default.is_touch_moving = true;
		});

		/*
  	On touch end if it was a touch move event, set moving to
  	false
  */
		document.addEventListener('touchend', function () {
			if (_config2.default.is_touch_moving) {
				_config2.default.is_touch_moving = false;
			}
		});

		/*
  	On time update for the audio element, update visual displays that
  	represent the time on either a visualized element or time display.
  */
		bindTimeUpdate();

		/*
  	Binds key down event handlers for matching key codes to functions.
  */
		bindKeyDownEventHandlers();

		/*
  	When the audio element has ended playing, we handle the song
  	ending. In a single song or multiple modular song instance,
  	this just synchronizes the visuals for time and song time
  	visualization, but for a playlist it determines whether
  	it should play the next song or not.
  */
		bindSongEnded();

		/*
  	Binds progress event so we can see how much of the song is loaded.
  */
		bindProgress();

		/*
  	Binds 'amplitude-play' event handlers
  */
		bindPlay();

		/*
  	Binds 'amplitude-pause' event handlers.
  */
		bindPause();

		/*
  	Binds 'amplitude-play-pause' event handlers.
  */
		bindPlayPause();

		/*
  	Binds 'amplitude-stop' event handlers.
  */
		bindStop();

		/*
  	Binds 'amplitude-mute' event handlers.
  */
		bindMute();

		/*
  	Binds 'amplitude-volume-up' event handlers
  */
		bindVolumeUp();

		/*
  	Binds 'amplitude-volume-down' event handlers
  */
		bindVolumeDown();

		/*
  	Binds 'amplitude-song-slider' event handlers
  */
		bindSongSlider();

		/*
  	Binds 'amplitude-volume-slider' event handlers.
  */
		bindVolumeSlider();

		/*
  	Binds 'amplitude-next' event handlers.
  */
		bindNext();

		/*
  	Binds 'amplitude-prev' event handlers.
  */
		bindPrev();

		/*
  	Binds 'amplitude-shuffle' event handlers.
  */
		bindShuffle();

		/*
  	Binds 'amplitude-repeat' event handlers.
  */
		bindRepeat();

		/*
  	Binds 'amplitude-playback-speed' event handlers.
  */
		bindPlaybackSpeed();

		/*
  	Binds 'amplitude-skip-to' event handlers.
  */
		bindSkipTo();
	}

	/*--------------------------------------------------------------------------
 	On time update for the audio element, update visual displays that
 		represent the time on either a visualized element or time display.
 --------------------------------------------------------------------------*/
	function bindTimeUpdate() {
		_config2.default.active_song.removeEventListener('timeupdate', _handlers2.default.updateTime);
		_config2.default.active_song.addEventListener('timeupdate', _handlers2.default.updateTime);

		// also bind change of duratuion
		_config2.default.active_song.removeEventListener('durationchange', _handlers2.default.updateTime);
		_config2.default.active_song.addEventListener('durationchange', _handlers2.default.updateTime);
	}

	/*--------------------------------------------------------------------------
 	On keydown, we listen to what key got pressed so we can map the key to
 	a function. This allows the user to map pause and play, next, etc. to key
 	presses.
 --------------------------------------------------------------------------*/
	function bindKeyDownEventHandlers() {
		document.removeEventListener("keydown", _helpers2.default.keydown);
		document.addEventListener("keydown", _handlers2.default.keydown);
	}

	/*--------------------------------------------------------------------------
 	When the audio element has ended playing, we handle the song
 	ending. In a single song or multiple modular song instance,
 	this just synchronizes the visuals for time and song time
 	visualization, but for a playlist it determines whether
 	it should play the next song or not.
 --------------------------------------------------------------------------*/
	function bindSongEnded() {
		_config2.default.active_song.removeEventListener('ended', _handlers2.default.songEnded);
		_config2.default.active_song.addEventListener('ended', _handlers2.default.songEnded);
	}

	/*--------------------------------------------------------------------------
 	As the audio is loaded, the progress event gets fired. We bind into this
 	to grab the buffered percentage of the song. We can then add more elements
 	to show the buffered amount.
 --------------------------------------------------------------------------*/
	function bindProgress() {
		_config2.default.active_song.removeEventListener('progress', _handlers2.default.progess);
		_config2.default.active_song.addEventListener('progress', _handlers2.default.progress);
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-play"
 		Binds click and touchend events for amplitude play buttons.
 --------------------------------------------------------------------------*/
	function bindPlay() {
		/*
  	Gets all of the elements with the class amplitude-play
  */
		var play_classes = document.getElementsByClassName("amplitude-play");

		/*
  	Iterates over all of the play classes and binds the event interaction
  	method to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < play_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				play_classes[i].removeEventListener('touchend', _handlers2.default.play);
				play_classes[i].addEventListener('touchend', _handlers2.default.play);
			} else {
				play_classes[i].removeEventListener('click', _handlers2.default.play);
				play_classes[i].addEventListener('click', _handlers2.default.play);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-pause"
 		Binds click and touchend events for amplitude pause buttons.
 --------------------------------------------------------------------------*/
	function bindPause() {
		/*
  	Gets all of the elements with the class amplitude-pause
  */
		var pause_classes = document.getElementsByClassName("amplitude-pause");

		/*
  	Iterates over all of the pause classes and binds the event interaction
  	method to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < pause_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				pause_classes[i].removeEventListener('touchend', _handlers2.default.pause);
				pause_classes[i].addEventListener('touchend', _handlers2.default.pause);
			} else {
				pause_classes[i].removeEventListener('click', _handlers2.default.pause);
				pause_classes[i].addEventListener('click', _handlers2.default.pause);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-play-pause"
 		Binds click and touchend events for amplitude play pause buttons.
 --------------------------------------------------------------------------*/
	function bindPlayPause() {
		/*
  	Gets all of the elements with the class amplitude-play-pause
  */
		var play_pause_classes = document.getElementsByClassName("amplitude-play-pause");

		/*
  	Iterates over all of the play/pause classes and binds the event interaction
  	method to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < play_pause_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				play_pause_classes[i].removeEventListener('touchend', _handlers2.default.playPause);
				play_pause_classes[i].addEventListener('touchend', _handlers2.default.playPause);
			} else {
				play_pause_classes[i].removeEventListener('click', _handlers2.default.playPause);
				play_pause_classes[i].addEventListener('click', _handlers2.default.playPause);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-stop"
 		Binds click and touchend events for amplitude stop buttons
 --------------------------------------------------------------------------*/
	function bindStop() {
		/*
  	Gets all of the elements with the class amplitude-stop
  */
		var stop_classes = document.getElementsByClassName("amplitude-stop");

		/*
  	Iterates over all of the stop classes and binds the event interaction
  	method to the element.  If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < stop_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				stop_classes[i].removeEventListener('touchend', _handlers2.default.stop);
				stop_classes[i].addEventListener('touchend', _handlers2.default.stop);
			} else {
				stop_classes[i].removeEventListener('click', _handlers2.default.stop);
				stop_classes[i].addEventListener('click', _handlers2.default.stop);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-mute"
 		Binds click and touchend events for amplitude mute buttons
 --------------------------------------------------------------------------*/
	function bindMute() {
		/*
  	Gets all of the elements with the class amplitue-mute
  */
		var mute_classes = document.getElementsByClassName("amplitude-mute");

		/*
  	Iterates over all of the mute classes and binds the event interaction
  	method to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < mute_classes.length; i++) {
			/*
   	WARNING: If iOS, we don't do anything because iOS does not allow the
   	volume to be adjusted through anything except the buttons on the side of
   	the device.
   */
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				/*
    	Checks for an iOS device and displays an error message if debugging
    	is turned on.
    */
				if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
					_helpers2.default.writeDebugMessage('iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4');
				} else {
					mute_classes[i].removeEventListener('touchend', _handlers2.default.mute);
					mute_classes[i].addEventListener('touchend', _handlers2.default.mute);
				}
			} else {
				mute_classes[i].removeEventListener('click', _handlers2.default.mute);
				mute_classes[i].addEventListener('click', _handlers2.default.mute);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-volume-up"
 		Binds click and touchend events for amplitude volume up buttons
 --------------------------------------------------------------------------*/
	function bindVolumeUp() {
		/*
  	Gets all of the elements with the class amplitude-volume-up
  */
		var volume_up_classes = document.getElementsByClassName("amplitude-volume-up");

		/*
  	Iterates over all of the volume up classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < volume_up_classes.length; i++) {
			/*
   	WARNING: If iOS, we don't do anything because iOS does not allow the
   	volume to be adjusted through anything except the buttons on the side of
   	the device.
   */
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				/*
    	Checks for an iOS device and displays an error message if debugging
    	is turned on.
    */
				if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
					_helpers2.default.writeDebugMessage('iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4');
				} else {
					volume_up_classes[i].removeEventListener('touchend', _handlers2.default.volumeUp);
					volume_up_classes[i].addEventListener('touchend', _handlers2.default.volumeUp);
				}
			} else {
				volume_up_classes[i].removeEventListener('click', _handlers2.default.volumeUp);
				volume_up_classes[i].addEventListener('click', _handlers2.default.volumeUp);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-volume-down"
 		Binds click and touchend events for amplitude volume down buttons
 --------------------------------------------------------------------------*/
	function bindVolumeDown() {
		/*
  	Gets all of the elements with the class amplitude-volume-down
  */
		var volume_down_classes = document.getElementsByClassName("amplitude-volume-down");

		/*
  	Iterates over all of the volume down classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < volume_down_classes.length; i++) {
			/*
   	WARNING: If iOS, we don't do anything because iOS does not allow the
   	volume to be adjusted through anything except the buttons on the side of
   	the device.
   */
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				/*
    	Checks for an iOS device and displays an error message if debugging
    	is turned on.
    */
				if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
					_helpers2.default.writeDebugMessage('iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4');
				} else {
					volume_down_classes[i].removeEventListener('touchend', _handlers2.default.volumeDown);
					volume_down_classes[i].addEventListener('touchend', _handlers2.default.volumeDown);
				}
			} else {
				volume_down_classes[i].removeEventListener('click', _handlers2.default.volumeDown);
				volume_down_classes[i].addEventListener('click', _handlers2.default.volumeDown);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-song-slider"
 		Binds change and input events for amplitude song slider inputs
 --------------------------------------------------------------------------*/
	function bindSongSlider() {
		/*
  	Gets browser so if we need to apply overrides, like we usually
  	have to do for anything cool in IE, we can do that.
  */
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf("MSIE ");

		/*
  	Gets all of the elements with the class amplitude-song-slider
  */
		var song_sliders = document.getElementsByClassName("amplitude-song-slider");

		/*
  	Iterates over all of the song slider classes and binds the event interaction
  	methods to the element. If the browser is IE we listen to the change event
  	where if it is anything else, it's the input method.
  */
		for (var i = 0; i < song_sliders.length; i++) {
			if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
				song_sliders[i].removeEventListener('change', _handlers2.default.songSlider);
				song_sliders[i].addEventListener('change', _handlers2.default.songSlider);
			} else {
				song_sliders[i].removeEventListener('input', _handlers2.default.songSlider);
				song_sliders[i].addEventListener('input', _handlers2.default.songSlider);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-volume-slider"
 		Binds change and input events for amplitude volume slider inputs
 --------------------------------------------------------------------------*/
	function bindVolumeSlider() {
		/*
  	Gets browser so if we need to apply overrides, like we usually
  	have to do for anything cool in IE, we can do that.
  */
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf("MSIE ");

		/*
  Gets all of the elements with the class amplitude-volume-slider
  */
		var volume_sliders = document.getElementsByClassName("amplitude-volume-slider");

		/*
  	Iterates over all of the volume slider classes and binds the event interaction
  	methods to the element. If the browser is IE we listen to the change event
  	where if it is anything else, it's the input method.
  */
		for (var i = 0; i < volume_sliders.length; i++) {
			/*
   	WARNING: If iOS, we don't do anything because iOS does not allow the
   	volume to be adjusted through anything except the buttons on the side of
   	the device.
   */
			if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
				_helpers2.default.writeDebugMessage('iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4');
			} else {
				if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
					volume_sliders[i].removeEventListener('change', _handlers2.default.volumeSlider);
					volume_sliders[i].addEventListener('change', _handlers2.default.volumeSlider);
				} else {
					volume_sliders[i].removeEventListener('input', _handlers2.default.volumeSlider);
					volume_sliders[i].addEventListener('input', _handlers2.default.volumeSlider);
				}
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-next"
 		Binds click and touchend events for amplitude next buttons.
 --------------------------------------------------------------------------*/
	function bindNext() {
		/*
  	Gets all of the elements with the class amplitude-next
        */
		var next_classes = document.getElementsByClassName("amplitude-next");

		/*
  	Iterates over all of the next classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < next_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				next_classes[i].removeEventListener('touchend', _handlers2.default.next);
				next_classes[i].addEventListener('touchend', _handlers2.default.next);
			} else {
				next_classes[i].removeEventListener('click', _handlers2.default.next);
				next_classes[i].addEventListener('click', _handlers2.default.next);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-prev"
 		Binds click and touchend events for amplitude prev buttons.
 --------------------------------------------------------------------------*/
	function bindPrev() {
		/*
  	Gets all of the elements with the class amplitude-prev
  */
		var prev_classes = document.getElementsByClassName("amplitude-prev");

		/*
  	Iterates over all of the prev classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < prev_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				prev_classes[i].removeEventListener('touchend', _handlers2.default.prev);
				prev_classes[i].addEventListener('touchend', _handlers2.default.prev);
			} else {
				prev_classes[i].removeEventListener('click', _handlers2.default.prev);
				prev_classes[i].addEventListener('click', _handlers2.default.prev);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-shuffle"
 		Binds click and touchend events for amplitude shuffle buttons.
 --------------------------------------------------------------------------*/
	function bindShuffle() {
		/*
  	Gets all of the elements with the class amplitude-shuffle
  */
		var shuffle_classes = document.getElementsByClassName("amplitude-shuffle");

		/*
  	Iterates over all of the shuffle classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < shuffle_classes.length; i++) {
			/*
   	Since we are re-binding everything we remove any classes that signify
   	a state of the shuffle control.
   */
			shuffle_classes[i].classList.remove('amplitude-shuffle-on');
			shuffle_classes[i].classList.add('amplitude-shuffle-off');

			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				shuffle_classes[i].removeEventListener('touchend', _handlers2.default.shuffle);
				shuffle_classes[i].addEventListener('touchend', _handlers2.default.shuffle);
			} else {
				shuffle_classes[i].removeEventListener('click', _handlers2.default.shuffle);
				shuffle_classes[i].addEventListener('click', _handlers2.default.shuffle);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-repeat"
 		Binds click and touchend events for amplitude repeat buttons.
 --------------------------------------------------------------------------*/
	function bindRepeat() {
		/*
  	Gets all of the elements with the class amplitude-repeat
  */
		var repeat_classes = document.getElementsByClassName("amplitude-repeat");

		/*
  	Iterates over all of the repeat classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < repeat_classes.length; i++) {
			/*
   	Since we are re-binding everything we remove any classes that signify
   	a state of the repeat control.
   */
			repeat_classes[i].classList.remove('amplitude-repeat-on');
			repeat_classes[i].classList.add('amplitude-repeat-off');

			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				repeat_classes[i].removeEventListener('touchend', _handlers2.default.repeat);
				repeat_classes[i].addEventListener('touchend', _handlers2.default.repeat);
			} else {
				repeat_classes[i].removeEventListener('click', _handlers2.default.repeat);
				repeat_classes[i].addEventListener('click', _handlers2.default.repeat);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-playback-speed"
 		Binds click and touchend events for amplitude playback speed buttons.
 --------------------------------------------------------------------------*/
	function bindPlaybackSpeed() {
		/*
  	Gets all of the elements with the class amplitude-playback-speed
  */
		var playback_speed_classes = document.getElementsByClassName("amplitude-playback-speed");

		/*
  	Iterates over all of the playback speed classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it is click.
  */
		for (var i = 0; i < playback_speed_classes.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				playback_speed_classes[i].removeEventListener('touchend', _handlers2.default.playbackSpeed);
				playback_speed_classes[i].addEventListener('touchend', _handlers2.default.playbackSpeed);
			} else {
				playback_speed_classes[i].removeEventListener('click', _handlers2.default.playbackSpeed);
				playback_speed_classes[i].addEventListener('click', _handlers2.default.playbackSpeed);
			}
		}
	}

	/*--------------------------------------------------------------------------
 	BINDS: class="amplitude-skip-to"
 		Binds click and touchend events for amplitude skip to buttons.
 --------------------------------------------------------------------------*/
	function bindSkipTo() {
		/*
  	Gets all of the skip to elements with the class 'amplitude-skip-to'
  */
		var skipToClasses = document.getElementsByClassName("amplitude-skip-to");

		/*
  	Iterates over all of the skip to classes and binds the event interaction
  	methods to the element. If the browser is mobile, then the event is touchend
  	otherwise it's a click.
  */
		for (var i = 0; i < skipToClasses.length; i++) {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				skipToClasses[i].removeEventListener('touchend', _handlers2.default.skipTo);
				skipToClasses[i].addEventListener('touchend', _handlers2.default.skipTo);
			} else {
				skipToClasses[i].removeEventListener('click', _handlers2.default.skipTo);
				skipToClasses[i].addEventListener('click', _handlers2.default.skipTo);
			}
		}
	}

	return {
		initializeEvents: initializeEvents
	};
}(); /*
     	Import the necessary classes and config to use
     	with the events.
     */
exports.default = AmplitudeEvents;
module.exports = exports['default'];

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _visual = __webpack_require__(2);

var _visual2 = _interopRequireDefault(_visual);

var _core = __webpack_require__(3);

var _core2 = _interopRequireDefault(_core);

var _helpers = __webpack_require__(1);

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * These methods help handle interactions whether it's computation or shuffling
 * songs.
 *
 * @module events/AmplitudeEventsHelpers
 */


/**
 * Imports the Amplitude Core module
 * @module core/AmplitudeCore
 */
/**
 * Imports the config module
 * @module config
 */
var AmplitudeEventsHelpers = function () {
	/**
  * Computes the current song time. Breaks down where the song is into
  * hours, minutes, seconds and formats it to be displayed to the user.
  *
  * @access public
  */
	function computeCurrentTimes() {
		/*
  	Initialize the current time object that will be returned.
  */
		var currentTime = {};

		/*
  	Computes the current seconds for the song.
  */
		var currentSeconds = (Math.floor(_config2.default.active_song.currentTime % 60) < 10 ? '0' : '') + Math.floor(_config2.default.active_song.currentTime % 60);

		/*
  	Computes the current minutes for the song.
  */
		var currentMinutes = Math.floor(_config2.default.active_song.currentTime / 60);

		/*
  	Initialize the current hours variable.
  */
		var currentHours = '00';

		/*
  	If the current minutes is less than 10, we add a leading 0.
  */
		if (currentMinutes < 10) {
			currentMinutes = '0' + currentMinutes;
		}

		/*
  	If the user is more than 60 minutes into the song, then
  	we extract the hours.
  */
		if (currentMinutes >= 60) {
			currentHours = Math.floor(currentMinutes / 60);
			currentMinutes = currentMinutes % 60;

			/*
   	If the user is less than 10 minutes in, we append the
   	additional 0 to the minutes.
   */
			if (currentMinutes < 10) {
				currentMinutes = '0' + currentMinutes;
			}
		}

		/*
  	Build a clean current time object and send back the appropriate information.
  */
		currentTime.seconds = currentSeconds;
		currentTime.minutes = currentMinutes;
		currentTime.hours = currentHours;

		return currentTime;
	}

	/**
  * Computes the current song duration. Breaks down where the song is into
  * hours, minutes, seconds and formats it to be displayed to the user.
  *
  * @access public
  */
	function computeSongDuration() {
		/*
  	Initialize the song duration object that will be returned.
  */
		var songDuration = {};

		/*
  	Computes the duration of the song's seconds.
  */
		var songDurationSeconds = (Math.floor(_config2.default.active_song.duration % 60) < 10 ? '0' : '') + Math.floor(_config2.default.active_song.duration % 60);

		/*
  	Computes the duration of the song's minutes.
  */
		var songDurationMinutes = Math.floor(_config2.default.active_song.duration / 60);

		/*
  	Initialize the hours duration variable.
  */
		var songDurationHours = '0';

		/*
  	If the song duration minutes is less than 10, we add a leading 0.
  */
		if (songDurationMinutes < 10) {
			songDurationMinutes = '0' + songDurationMinutes;
		}

		/*
  	If there is more than 60 minutes in the song, then we
  	extract the hours.
  */
		if (songDurationMinutes >= 60) {
			songDurationHours = Math.floor(songDurationMinutes / 60);
			songDurationMinutes = songDurationMinutes % 60;

			/*
   	If the song duration minutes is less than 10 we append
   	the additional 0.
   */
			if (songDurationMinutes < 10) {
				songDurationMinutes = '0' + songDurationMinutes;
			}
		}

		/*
  	Build a clean song duration object and send back the appropriate information.
  */
		songDuration.seconds = songDurationSeconds;
		songDuration.minutes = songDurationMinutes;
		songDuration.hours = songDurationHours;

		return songDuration;
	}

	/**
  * Computes the song completion percentage.
  *
  * @access public
  */
	function computeSongCompletionPercentage() {
		return _config2.default.active_song.currentTime / _config2.default.active_song.duration * 100;
	}

	/**
  * Sets the current song's playback speed
  *
  * @access public
  * @param {number} speed 	- The float with a base of 1 representing the speed
  *
  */
	function setPlaybackSpeed(speed) {
		_core2.default.setPlaybackSpeed(speed);
	}

	/**
  * Sets the state of the repeat for the current song.
  *
  * @access public
  * @param {boolean} repeat - A boolean representing whether the repeat should be on or off
  * @param {string} playlist - The key of the playlist for repeating
  */
	function setRepeat(repeat, playlist) {
		/*
    If the playlist is null, then we are dealing with the global
    repeat status.
  */
		if (playlist == null) {
			/*
   	Set the global repeat to be toggled
   */
			_config2.default.repeat = repeat;

			/*
   	Visually sync repeat
   */
			_visual2.default.syncRepeat();
		} else {
			/*
   	Set the playlist repeat to be toggled.
   */
			_config2.default.repeat_statuses[playlist] = repeat;

			/*
   	Visually sync playlist repeat
   */
			_visual2.default.syncRepeatPlaylist(playlist);
		}

		/** When song ends and in playlis mode and done with playlist check repeat  **/
	}

	/**
  * Sets the state of the repeat song
  *
  * @access public
  * @param {boolean} repeat - A boolean representing whether the repeat shoudl be on or off for the song.
  */
	function setRepeatSong(repeat) {
		_config2.default.repeat_song = repeat;
	}

	/**
  * Sets the main play pause buttons to the current state of the song.
  *
  * @access public
  */
	function setMainPlayPause() {
		/*
  	Determines what action we should take based on the
  	state of the song.
  */
		if (_config2.default.active_song.paused) {
			/*
   	The song was paused so we sync visually for the song
   	that is playing and we play the song.
   */
			_visual2.default.syncMainPlayPause('playing');

			/*
   	If there is an active playlist, then
   	we need to sync that playlist's play pause
   	button to the state of playing.
   */
			_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'playing');

			/*
   	Sync the song play pause buttons
   */
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'playing');

			/*
   	Play the song
   */
			_core2.default.play();
		} else {
			/*
   	The song was playing so we sync visually for the song
   	to be paused and we pause the song.
   */
			_visual2.default.syncMainPlayPause('paused');

			/*
   	If there is an active playlist, then
   	we need to sync that playlist's play pause
   	button to the state of paused.
   */
			_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'paused');

			/*
   	Sync the song play pause buttons
   */
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'paused');

			/*
   	Pause the song
   */
			_core2.default.pause();
		}
	}

	/**
  * Sets the playlist main play pause buttons to the current state of the song.
  *
  * @access public
  * @param {string} playlist The playlist the main play pause button controls
  */
	function setPlaylistPlayPause(playlist) {
		/*
  	The only thing that can change when you click a playlist
  	play pause is the playlist. Main play pauses have no change
  	in song, song play pauses can change playlist and song.
  */
		if (_helpers2.default.checkNewPlaylist(playlist)) {
			_helpers2.default.setActivePlaylist(playlist);

			/*
   	Play first song in the playlist since we just
   	switched playlists, we start from the first song.
   		If the user has shuffle on for the playlist, then
   	we go from the first song in the shuffle playlist array.
   */
			if (_config2.default.shuffled_statuses[playlist]) {
				_helpers2.default.changeSong(_config2.default.shuffled_playlists[playlist][0].original_index);
			} else {
				_helpers2.default.changeSong(_config2.default.playlists[playlist][0]);
			}
		}

		/*
  	Determines what action we should take based on the
  	state of the song.
  */
		if (_config2.default.active_song.paused) {
			/*
   	The song was paused so we sync visually for the song
   	that is playing and we play the song.
   */
			_visual2.default.syncMainPlayPause('playing');

			/*
   	If there is an active playlist, then
   	we need to sync that playlist's play pause
   	button to the state of playing.
   */
			_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'playing');

			/*
   	Sync the song play pause buttons
   */
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'playing');

			/*
   	Play the song
   */
			_core2.default.play();
		} else {
			/*
   	The song was playing so we sync visually for the song
   	to be paused and we pause the song.
   */
			_visual2.default.syncMainPlayPause('paused');

			/*
   	If there is an active playlist, then
   	we need to sync that playlist's play pause
   	button to the state of paused.
   */
			_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'paused');

			/*
   	Sync the song play pause buttons
   */
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'paused');

			/*
   	Pause the song
   */
			_core2.default.pause();
		}
	}

	/**
  * Sets the song play pause buttons to the current state of the song.
  *
  * @access public
  * @param {string} playlist The playlist the song is a part of
  * @param {number} songIndex The index of the song being played/paused
  *
  */
	function setSongPlayPause(playlist, songIndex) {
		/*
  	There can be multiple playlists on the page and there can be
  	multiple songs on the page AND there can be songs in multiple
  	playlists, so we have some checking to do.
  */

		/*
  	Check to see if the playlist has changed. If it has,
  	set the active playlist.
  */
		if (_helpers2.default.checkNewPlaylist(playlist)) {
			_helpers2.default.setActivePlaylist(playlist);

			/*
   	If there's a new playlist then we reset the
   	song since the song could be in 2 playlists,
   	but the user selects another playlist.
   */
			_helpers2.default.changeSong(songIndex);
		}

		/*
  	Check to see if the song has changed. If it has,
  	set the active song. If it was in a playlist, the
  	song wouldn't change here, since we already set the
  	song when we checked for a playlist.
  */
		if (_helpers2.default.checkNewSong(songIndex)) {
			/*
   	The song selected is different, so we change the
   	song.
   */
			_helpers2.default.changeSong(songIndex);
		}

		/*
  	Determines what action we should take based on the
  	state of the song.
  */
		if (_config2.default.active_song.paused) {
			/*
   	The song was paused so we sync visually for the song
   	that is playing and we play the song.
   */
			_visual2.default.syncMainPlayPause('playing');

			/*
   	If there is an active playlist, then
   	we need to sync that playlist's play pause
   	button to the state of playing.
   */
			_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'playing');

			/*
   	Sync the song play pause buttons
   */
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'playing');

			/*
   	Play the song
   */
			_core2.default.play();
		} else {
			/*
   	The song was playing so we sync visually for the song
   	to be paused and we pause the song.
   */
			_visual2.default.syncMainPlayPause('paused');

			/*
   	If there is an active playlist, then
   	we need to sync that playlist's play pause
   	button to the state of paused.
   */
			_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'paused');

			/*
   	Sync the song play pause buttons
   */
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'paused');

			/*
   	Pause the song
   */
			_core2.default.pause();
		}
	}

	/**
  * Sets the shuffle state for a playlist
  *
  * @access public
  * @param {string} playlist - The playlist being shuffled
  */
	function setShuffle(playlist) {
		/*
  	If the playlist is null, then we are dealing with the global
  	shuffle status.
  */
		if (playlist == null) {
			/*
   	If shuffle is on, we toggle it off. If shuffle is off, we
   	toggle on.
   */
			if (_config2.default.shuffle_on) {
				_config2.default.shuffle_on = false;
				_config2.default.shuffle_list = {};
			} else {
				_config2.default.shuffle_on = true;
				_helpers2.default.shuffleSongs();
			}

			/*
   	Visually sync the shuffle statuses
   */
			_visual2.default.syncShuffle(_config2.default.shuffle_on);
		} else {
			/*
   	If the playlist shuffled is on, we toggle it off. If the
   	playlist shuffled is off, we toggle it on.
   */
			if (_config2.default.shuffled_statuses[playlist]) {
				_config2.default.shuffled_statuses[playlist] = false;
				_config2.default.shuffled_playlists[playlist] = [];
			} else {
				_config2.default.shuffled_statuses[playlist] = true;
				_helpers2.default.shufflePlaylistSongs(playlist);
			}

			/*
   	Visually sync the playlist shuffle statuses.
   */
			_visual2.default.syncPlaylistShuffle(_config2.default.shuffled_statuses[playlist], playlist);
		}
	}

	/**
  * Sets the next song when next is clicked
  *
  * @access public
  * @param {boolean} [songEnded=false] If the song ended, this is set to true
  * so we take into effect the repeat setting.
 */
	function setNext() {
		var songEnded = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		/*
  	Initializes the next index variable. This will be the
  	index of the song that is next.
  */
		var nextIndex = 0;
		/*
    Ensure we don't loop in the playlist if config.repeat is not true
  */
		var endOfList = false;

		if (_config2.default.repeat_song) {
			/*
   	If the playlist is shuffled, get the now playing index.
   */
			if (_config2.default.shuffle_on) {
				nextIndex = _config2.default.shuffle_active_index;
			} else {
				nextIndex = _config2.default.active_index;
			}
		} else {

			/*
   	If the shuffle is on, we use the shuffled list of
   	songs to determine our next song.
   */
			if (_config2.default.shuffle_on) {
				/*
    	If the active shuffle index + 1 is less than the length, then
    	we use the next shuffle otherwise we go to the beginning
    	of the shuffle list.
    */
				if (parseInt(_config2.default.shuffle_active_index) + 1 < _config2.default.shuffle_list.length) {
					_config2.default.shuffle_active_index = parseInt(_config2.default.shuffle_active_index) + 1;

					/*
     	Set the next index to be the index of the song in the shuffle list.
     */
					nextIndex = _config2.default.shuffle_list[parseInt(_config2.default.shuffle_active_index)].original_index;
				} else {
					_config2.default.shuffle_active_index = 0;
					nextIndex = 0;
					endOfList = true;
				}
			} else {
				/*
    	If the active index + 1 is less than the length of the songs, then
    	we use the next song otherwise we go to the beginning of the
    	song list.
    */
				if (parseInt(_config2.default.active_index) + 1 < _config2.default.songs.length) {
					_config2.default.active_index = parseInt(_config2.default.active_index) + 1;
				} else {
					_config2.default.active_index = 0;
					endOfList = true;
				}

				/*
    	Sets the next index.
    */
				nextIndex = _config2.default.active_index;
			}
		}

		/*
  	Stops the active song.
  */
		_core2.default.stop();

		/*
  	Change the song to the index we need.
  */
		_helpers2.default.changeSong(nextIndex);

		/*
  	If it's the end of the list and repeat is not on, do nothing.
  */
		if (endOfList && !_config2.default.repeat) {} else {
			/*
   	If the song has ended and repeat is on, play the song.
   */
			if (!(songEnded && !_config2.default.repeat && endOfList)) {
				_core2.default.play();
			}
		}

		/*
  	Syncs the main play pause button, playlist play pause button and
  	song play pause.
  */
		_visual2.default.syncMainPlayPause();
		_visual2.default.syncSongPlayPause(null, nextIndex);

		/*
  	Call after next callback
  */
		_helpers2.default.runCallback('after_next');

		/*
  	If we are repeating the song, call the song repeated callback
  */
		if (_config2.default.repeat_song) {
			_helpers2.default.runCallback('song_repeated');
		}
	}

	/**
  * Sets the next song in a playlist
  *
  * @param {string} playlist - The playlist being shuffled
  * @param {boolean} [songEnded=false] - If the song ended, this is set to true
  * so we take into effect the repeat setting.
  */
	function setNextPlaylist(playlist) {
		var songEnded = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

		/*
  	Initializes the next index
  */
		var nextIndex = 0;

		/*
    Used to determine whether the playlist looped over
    If it did, only play if repeat is allowed, end otherwise
    @TODO: Different settings for song loop, in-playlist loop and global loop
  */
		var endOfList = false;

		/*
  	If we are repeating the song, then we just start the song over.
  */

		if (_config2.default.repeat_song) {
			/*
   	If the playlist is shuffled, get the now playing index.
   */
			if (_config2.default.shuffled_statuses[playlist]) {
				nextIndex = _config2.default.shuffled_playlists[playlist][_config2.default.shuffled_active_indexes[playlist]].original_index;
			} else {
				nextIndex = _config2.default.active_index;
			}
		} else {
			/*
   	If the playlist is shuffled we get the next index of the playlist.
   */
			if (_config2.default.shuffled_statuses[playlist]) {
				/*
    	Gets the shuffled playlist's active song index.
    */
				var shuffledPlaylistActiveSongIndex = parseInt(_config2.default.shuffled_active_indexes[playlist]);

				/*
    	If the index + 1 is less than the length of the playlist, we increment
    	the next index otherwise we take the first index of 0.
    */
				if (shuffledPlaylistActiveSongIndex + 1 < _config2.default.shuffled_playlists[playlist].length) {
					/*
     	Set the shuffled playlist active song index.
     */
					_config2.default.shuffled_active_indexes[playlist] = shuffledPlaylistActiveSongIndex + 1;
					/*
     	Get the index of the song that we will be switching to.
     */
					nextIndex = _config2.default.shuffled_playlists[playlist][_config2.default.shuffled_active_indexes[playlist]].original_index;
				} else {
					/*
     	Sets the active shuffled playlist active index to 0 and gets the original index of
     	the song at the shuffled index of 0.
     */
					_config2.default.shuffled_active_indexes[playlist] = 0;
					nextIndex = _config2.default.shuffled_playlists[playlist][0].original_index;
					endOfList = true;
				}
			} else {
				/*
    	Gets the index of the active song within the scope
    	of the playlist.
    */
				var playlistActiveSongIndex = _config2.default.playlists[playlist].indexOf(parseInt(_config2.default.active_index));

				/*
    	Checks to see if the next index is still less than the length of the playlist.
    	If it is, use the next index othwerwise get the first song in the playlist.
    */
				if (playlistActiveSongIndex + 1 < _config2.default.playlists[playlist].length) {
					_config2.default.active_index = parseInt(_config2.default.playlists[playlist][playlistActiveSongIndex + 1]);
				} else {
					_config2.default.active_index = parseInt(_config2.default.playlists[playlist][0]);
					endOfList = true;
				}

				/*
    	Sets the next inex to the active index in the config.
    */
				nextIndex = _config2.default.active_index;
			}
		}

		/*
  	Stops the active song playing.
  */

		_core2.default.stop();

		/*
  	Changes the song to the next song in the playlist.
  */
		_helpers2.default.changeSong(nextIndex);

		/*
  	If it's the end of the song in the playlist, and repeat for
  	the playlist is not on, do nothing.
  */
		if (endOfList && !_config2.default.repeat_statuses[playlist]) {} else {
			/*
   	If the song has ended and repeat is on, play the song.
   */
			if (!(songEnded && !_config2.default.repeat_statuses[playlist] && endOfList)) {
				_core2.default.play();
			}
		}

		_helpers2.default.setActivePlaylist(playlist);

		/*
  	Syncs the main play pause button, playlist play pause button and
  	song play pause.
  */
		_visual2.default.syncMainPlayPause();
		_visual2.default.syncPlaylistPlayPause(playlist);
		_visual2.default.syncSongPlayPause(playlist, nextIndex);

		/*
  	Call after next callback
  */
		_helpers2.default.runCallback('after_next');

		/*
  	If we are repeating the song, call the song repeated callback
  */
		if (_config2.default.repeat_song) {
			_helpers2.default.runCallback('song_repeated');
		}
	}

	/**
  * Sets the previous song
  * @access public
  *
 /*--------------------------------------------------------------------------
 	Sets the previous song
 --------------------------------------------------------------------------*/
	function setPrev() {
		/*
  	Initializes the prev index variable. This will be the
  	index of the song that is next.
  */
		var prevIndex = 0;

		/*
  	If the shuffle is on for the individual songs, we get the previous
  	song.
  */
		if (_config2.default.shuffle_on) {
			/*
   	If the previous index is greater than or equal to 0, we use the active
   	index - 1.
   */
			if (parseInt(_config2.default.shuffle_active_index) - 1 >= 0) {
				/*
    	Sets the new active to be 1 less than the current active index.
    */
				_config2.default.shuffle_active_index = parseInt(_config2.default.shuffle_active_index) - 1;

				/*
    	Gets the index of the song in the song array for the new index.
    */
				prevIndex = _config2.default.shuffle_list[parseInt(_config2.default.shuffle_active_index)].original_index;
			} else {
				/*
    	Set the active index and previous index.
    */
				_config2.default.shuffle_active_index = _config2.default.shuffle_list.length - 1;
				prevIndex = _config2.default.shuffle_list[parseInt(_config2.default.shuffle_list.length) - 1].original_index;
			}
		} else {
			/*
   	If the active index - 1 is greater than or equal to 0, we subtract 1 from the
   	active index otherwise we set the active index to the end of the songs array index.
   */
			if (parseInt(_config2.default.active_index) - 1 >= 0) {
				_config2.default.active_index = parseInt(_config2.default.active_index) - 1;
			} else {
				_config2.default.active_index = _config2.default.songs.length - 1;
			}

			/*
   	Set the previous index.
   */
			prevIndex = _config2.default.active_index;
		}

		/*
  	Stops the active song.
  */
		_core2.default.stop();

		/*
  	Change the song to the index we need.
  */
		_helpers2.default.changeSong(prevIndex);

		/*
  	Play the next song.
  */
		_core2.default.play();

		/*
  	Sync the play/pause buttons to the current state of the player.
  */
		_visual2.default.syncMainPlayPause('playing');
		_visual2.default.syncSongPlayPause(null, prevIndex, 'playing');

		/*
  	Call after prev callback
  */
		_helpers2.default.runCallback('after_prev');
	}

	/**
  * Sets the previous song in a playlist
  *
  * @access public
  * @param {string} playlist 	- The playlist we are setting the previous for.
  */
	function setPrevPlaylist(playlist) {
		/*
  	Initializes the prev index variable. This will be the
  	index of the song that is next.
  */
		var prevIndex = 0;

		/*
  	If the shuffle is on for the playlist, we get the previous
  	song.
  */
		if (_config2.default.shuffled_statuses[playlist]) {
			/*
   	Gets the active song index for the shuffled playlist
   */
			var shuffledPlaylistActiveSongIndex = parseInt(_config2.default.shuffled_active_indexes[playlist]);

			/*
   	If the shuffled song active index is greater than or equal to 0,
   	we use the active index - 1.
   */
			if (shuffledPlaylistActiveSongIndex - 1 >= 0) {
				/*
    	Sets the active index to the active song index - 1
    */
				_config2.default.shuffled_active_indexes[playlist] = shuffledPlaylistActiveSongIndex - 1;

				/*
    	Gets the index of the song in the song array for the new index.
    */
				prevIndex = _config2.default.shuffled_playlists[playlist][_config2.default.shuffled_active_indexes[playlist]].original_index;
			} else {
				/*
    	Set the active index and previous index.
    */
				_config2.default.shuffled_active_indexes[playlist] = _config2.default.shuffled_playlists[playlist].length - 1;
				prevIndex = _config2.default.shuffled_playlists[playlist][_config2.default.shuffled_playlists[playlist].length - 1].original_index;
			}
		} else {
			/*
   	Gets the active song index for the playlist
   */
			var playlistActiveSongIndex = _config2.default.playlists[playlist].indexOf(parseInt(_config2.default.active_index));

			/*
   	If the active song index in the playlist - 1 is greater than
   	or equal to 0, then we use the active song index - 1.
   */
			if (playlistActiveSongIndex - 1 >= 0) {
				_config2.default.active_index = parseInt(_config2.default.playlists[playlist][playlistActiveSongIndex - 1]);
			} else {
				_config2.default.active_index = parseInt(_config2.default.playlists[playlist][_config2.default.playlists[playlist].length - 1]);
			}

			/*
   	Set the previous index to the active index for use later.
   */
			prevIndex = _config2.default.active_index;
		}

		/*
  	Stops the active song.
  */
		_core2.default.stop();

		/*
  	Changes the song to the prev song in the playlist.
  */
		_helpers2.default.changeSong(prevIndex);
		_helpers2.default.setActivePlaylist(playlist);

		/*
  	Plays the song
  */
		_core2.default.play();

		/*
  	Syncs the main play pause button, playlist play pause button and
  	song play pause.
  */
		_visual2.default.syncMainPlayPause('playing');
		_visual2.default.syncPlaylistPlayPause(playlist, 'playing');
		_visual2.default.syncSongPlayPause(playlist, prevIndex, 'playing');

		/*
  	Call after prev callback
  */
		_helpers2.default.runCallback('after_prev');
	}

	/**
  * Runs an event on key down
  *
  * @access public
  * @param {number} key 	- The key code the event is bound to.
  */
	function runKeyEvent(key) {
		/*
  	Checks to see if the user bound an event to the code pressed.
  */
		if (_config2.default.bindings[key] != undefined) {
			/*
   	Determine which event should be run if bound.
   */
			switch (_config2.default.bindings[key]) {
				/*
    	Fires a play pause event.
    */
				case 'play_pause':
					setSongPlayPause(_config2.default.active_playlist, _config2.default.active_index);
					break;

				/*
    	Fires a next event.
    */
				case 'next':
					/*
     	Check to see if the current state of the player
     	is in playlist mode or not playlist mode.
     */
					if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
						setNext();
					} else {
						setNextPlaylist(_config2.default.active_playlist);
					}
					break;

				/*
    	Fires a previous event.
    */
				case 'prev':
					/*
     	Check to see if the current playlist has been set
     	or null and set the previous song.
     */
					if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
						AmplitudeEventsHelpers.setPrev();
					} else {
						AmplitudeEventsHelpers.setPrevPlaylist(_config2.default.active_playlist);
					}
					break;

				/*
    	Fires a stop event.
    */
				case 'stop':
					/*
     	Sets all of the play/pause buttons to pause
     */
					_visual2.default.setPlayPauseButtonsToPause();

					/*
     	Stops the active song.
     */
					_core2.default.stop();
					break;

				/*
    	Fires a shuffle event.
    */
				case 'shuffle':
					/*
     	Check to see if the current playlist has been set
     	or null and set the previous song.
     */
					if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
						AmplitudesEventHelpers.setShuffle(null);
					} else {
						AmplitudeEvenstHelpers.setShuffle(_config2.default.active_playlist);
					}
					break;

				/*
    	Fires a repeat event.
    */
				case 'repeat':
					/*
     	Sets repeat to the opposite of what it was set to
     */
					AmplitudeEventsHelpers.setRepeat(!_config2.default.repeat);

					/*
     	Visually sync repeat
     */
					_visual2.default.syncRepeat();
					break;
			}
		}
	}

	/*
 	Return the publically scoped functions
 */
	return {
		computeCurrentTimes: computeCurrentTimes,
		computeSongDuration: computeSongDuration,
		computeSongCompletionPercentage: computeSongCompletionPercentage,
		setPlaybackSpeed: setPlaybackSpeed,
		setRepeat: setRepeat,
		setRepeatSong: setRepeatSong,
		setMainPlayPause: setMainPlayPause,
		setPlaylistPlayPause: setPlaylistPlayPause,
		setSongPlayPause: setSongPlayPause,
		setShuffle: setShuffle,
		setNext: setNext,
		setNextPlaylist: setNextPlaylist,
		setPrev: setPrev,
		setPrevPlaylist: setPrevPlaylist,
		runKeyEvent: runKeyEvent
	};
}();

/**
 * Imports the Amplitude Core Helpers module
 * @module core/AmplitudeCoreHelpers
 */


/**
 * Imports the Amplitude Visual Sync module
 * @module visual/AmplitudeVisualSync
 */
exports.default = AmplitudeEventsHelpers;
module.exports = exports['default'];

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _core = __webpack_require__(3);

var _core2 = _interopRequireDefault(_core);

var _helpers = __webpack_require__(1);

var _helpers2 = _interopRequireDefault(_helpers);

var _events = __webpack_require__(4);

var _events2 = _interopRequireDefault(_events);

var _soundcloud = __webpack_require__(9);

var _soundcloud2 = _interopRequireDefault(_soundcloud);

var _visual = __webpack_require__(2);

var _visual2 = _interopRequireDefault(_visual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * AmplitudeJS Initializer Module. Helps with the handling of all of the
 * initialization for AmplitudeJS.
 *
 * @module init/AmplitudeInitializer
 */


/**
 * AmplitudeJS Soundcloud
 * @module soundcloud/AmplitudeSoundcloud
 */


/**
 * AmplitudeJS Core Helpers
 * @module core/AmplitudeHelpers
 */
/**
 * Imports the config module
 * @module config
 */
var AmplitudeInitializer = function () {

	/**
   * The main init function.  The user will call this through
  * Amplitude.init({}) and pass in their settings.
  *
  * Public Accessor: Amplitude.init( user_config_json )
  * @access public
   * @param {object} userConfig - A JSON object of user defined values that help configure and initialize AmplitudeJS.
   */
	function initialize(userConfig) {
		var ready = false;

		/*
  	Reset the config on init so we have a clean slate. This is if the
  	user has to re-init.
  */
		_helpers2.default.resetConfig();

		/*
  	Initialize event handlers on init. This will clear any old
  	event handlers on the amplitude element and re-bind what is
  	necessary.
  */
		_events2.default.initializeEvents();

		/*
  	Initializes debugging right away so we can use it for the rest
  	of the configuration.
  */
		_config2.default.debug = userConfig.debug != undefined ? userConfig.debug : false;

		/*
  	Checks to see if the user has songs defined.
  */
		if (userConfig.songs) {
			/*
   	Checks to see if the user has some songs in the songs array.
   */
			if (userConfig.songs.length != 0) {
				/*
    	Copies over the user defined songs. and prepares
    	Amplitude for the rest of the configuration.
    */
				_config2.default.songs = userConfig.songs;
				/*
    	Flag amplitude as ready.
    */
				ready = true;
			} else {
				_helpers2.default.writeDebugMessage('Please add some songs, to your songs object!');
			}
		} else {
			_helpers2.default.writeDebugMessage('Please provide a songs object for AmplitudeJS to run!');
		}

		/**
   * Initializes the audio context. In this method it checks to see if the
   * user wants to use visualizations or not before proceeding.
   * @todo MAKE HANDLED BY AMPLITUDE FX.
   */
		//privateHelpInitializeAudioContext();

		/*
  	Checks if the user has any playlists defined. If they do
  	we have to initialize the functionality for the playlists.
  */
		if (userConfig.playlists && countPlaylists(userConfig.playlists) > 0) {
			/*
   	Copy the playlists over to Amplitude
   */
			_config2.default.playlists = userConfig.playlists;

			/*
   	Initialize default live settings
   */
			initializeDefaultLiveSettings();

			/*
   	Check to see if the user has valid song indexes in their playlist.
   */
			checkValidSongsInPlaylists();

			/*
   	Initialize the shuffle status of the playlists.
   */
			initializePlaylistShuffleStatuses();

			/*
   	Initialize the repeat status for the playlits.
   */
			initializePlaylistsRepeatStatuses();

			/*
   	Initialize temporary place holders for shuffle lists.
   */
			initializePlaylistShuffleLists();

			/*
   	Initializes the active shuffled indexes for shuffled playlists.
   */
			initializePlaylistShuffleIndexes();

			/*
   	Initializes the first song in the playlist
   */
			initializeFirstSongInPlaylistMetaData();
		}

		/*
  	When the preliminary config is ready, we are ready to proceed.
  */
		if (ready) {
			/*
   	Copies over the soundcloud information to the global config
   	which will determine where we go from there.
   */
			_config2.default.soundcloud_client = userConfig.soundcloud_client != undefined ? userConfig.soundcloud_client : '';

			/*
   	Checks if we want to use the art loaded from soundcloud.
   */
			_config2.default.soundcloud_use_art = userConfig.soundcloud_use_art != undefined ? userConfig.soundcloud_use_art : '';

			/*
   	If the user provides a soundcloud client then we assume that
   	there are URLs in their songs that will reference SoundcCloud.
   	We then copy over the user config they provided to the
   	temp_user_config so we don't mess up the global or their configs
   	and load the soundcloud information.
   */
			var tempUserConfig = {};

			if (_config2.default.soundcloud_client != '') {
				tempUserConfig = userConfig;

				/*
    	Load up SoundCloud for use with AmplitudeJS.
    */
				_soundcloud2.default.loadSoundCloud(tempUserConfig);
			} else {
				/*
    	The user is not using Soundcloud with Amplitude at this point
    	so we just finish the configuration with the users's preferences.
    */
				setConfig(userConfig);
			}
		}

		/*
  	Debug out what was initialized with AmplitudeJS.
  */
		_helpers2.default.writeDebugMessage('Initialized With: ');
		_helpers2.default.writeDebugMessage(_config2.default);
	}

	/**
  * Rebinds all of the elements in the display.
  *
  * Public Accessor: Amplitude.rebindDisplay()
  * @access public
  */
	function rebindDisplay() {
		_events2.default.initializeEvents();
		_visual2.default.displaySongMetadata();
	}

	/**
  * Finishes the initalization of the config. Takes all of the user defined
  * parameters and makes sure they override the defaults. The important
  * config information is assigned in the publicInit() function.
  *
  * This function can be called from 2 different locations:
  * 	1. Right away on init after the important settings are defined.
  *
  * 	2. After all of the Soundcloud URLs are resolved properly and
  *	 	soundcloud is configured.  We will need the proper URLs from Soundcloud
  * 		to stream through Amplitude so we get those right away before we
  * 		set the information and the active song
  *
  * @access public
  * @param {object} userConfig - A JSON object of user defined values that help configure and initialize AmplitudeJS.
  */
	function setConfig(userConfig) {
		/*
  	Check to see if the user entered a start song
  */
		if (userConfig.start_song != undefined) {
			/*
   	Ensure what has been entered is an integer.
   */
			if (_helpers2.default.isInt(userConfig.start_song)) {
				_helpers2.default.changeSong(userConfig.start_song);
			} else {
				_helpers2.default.writeDebugMessage("You must enter an integer index for the start song.");
			}
		} else {
			_helpers2.default.changeSong(0);
		}

		/*
  	Initialize a sh
  */
		if (userConfig.shuffle_on != undefined && userConfig.shuffle_on) {
			_config2.default.shuffle_on = true;
			_helpers2.default.shuffleSongs();

			/*
   	Visually sync the shuffle statuses
   */
			_visual2.default.syncShuffle(_config2.default.shuffle_on);

			_helpers2.default.changeSong(_config2.default.shuffle_list[0].original_index);
		}

		/*
  	Allows the user to set whether they want to continue to the next song
  	when the current song finishes or not. In any scenario that's not a playlist,
  	contining to the next song may not be desired.
  */
		_config2.default.continue_next = userConfig.continue_next != undefined ? userConfig.continue_next : true;

		/*
  	If the user defined a playback speed, we copy over their
  	preference here, otherwise we default to normal playback
  	speed of 1.0.
  */
		_config2.default.playback_speed = userConfig.playback_speed != undefined ? userConfig.playback_speed : 1.0;

		/*
  	Sets the audio playback speed.
  */
		_core2.default.setPlaybackSpeed(_config2.default.playback_speed);

		/*
  	If the user wants the song to be pre-loaded for instant
  	playback, they set it to true. By default it's set to just
  	load the metadata.
  */
		_config2.default.active_song.preload = userConfig.preload != undefined ? userConfig.preload : "auto";

		/*
  	Initializes the user defined callbacks. This should be a JSON
  	object that contains a key->value store of the callback name
  	and the name of the function the user needs to call.
  */
		_config2.default.callbacks = userConfig.callbacks != undefined ? userConfig.callbacks : {};

		/*
  	Initializes the user defined key bindings. This should be a JSON
  	object that contains a key->value store of the key event number
  	pressed and the method to be run.
  */
		_config2.default.bindings = userConfig.bindings != undefined ? userConfig.bindings : {};

		/*
  	The user can define a starting volume in a range of 0-100 with
  	0 being muted and 100 being the loudest. After the config is set
  	Amplitude sets the active song's volume to the volume defined
  	by the user.
  */
		_config2.default.volume = userConfig.volume != undefined ? userConfig.volume : 50;

		/*
  	The user can set the volume increment and decrement values between 1 and 100
  	for when the volume up or down button is pressed.  The default is an increase
  	or decrease of 5.
  */
		_config2.default.volume_increment = userConfig.volume_increment != undefined ? userConfig.volume_increment : 5;

		_config2.default.volume_decrement = userConfig.volume_decrement != undefined ? userConfig.volume_decrement : 5;

		/*
  	Set the volume to what is defined in the config. The user can define this,
  	so we should set it up that way.
  */
		_core2.default.setVolume(_config2.default.volume);

		/*
  	Since the user can define a start volume, we want our volume
  	sliders to sync with the user defined start value.
  */
		_visual2.default.syncVolumeSliders();

		/*
  	If the user defines default album art, this image will display if the active
  	song doesn't have album art defined.
  */
		if (userConfig.default_album_art != undefined) {
			_config2.default.default_album_art = userConfig.default_album_art;
		} else {
			_config2.default.default_album_art = '';
		}

		/*
  	Syncs all of the visual time elements to 00.
  */
		_visual2.default.resetTimes();

		/*
  	Sets all of the play pause buttons to pause.
  */
		_visual2.default.setPlayPauseButtonsToPause();

		/*
  	Sets the meta data for the songs automatically.
  */
		_visual2.default.syncSongsMetaData();

		/*
  	If the user has autoplay enabled, then begin playing the song. Everything should
  	be configured for this to be ready to play.
  */
		if (userConfig.autoplay) {
			/*
   	If the user hasn't set a starting playlist, set it to null otherwise initialize to the
   	starting playlist selected by the user.
   */
			if (userConfig.starting_playlist == '') {
				_config2.default.active_playlist = null;
			} else {
				_config2.default.active_playlist = userConfig.starting_playlist;
			}

			/*
   	Sync the main and song play pause buttons.
   */
			_visual2.default.syncMainPlayPause('playing');
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, 0, 'playing');

			/*
   	Start playing the song
   */
			_core2.default.play();
		}

		/*
  	If the user has selected a starting playlist, we need to set the starting playlist
  	and sync the visuals
  */
		if (userConfig.starting_playlist != '' && userConfig.starting_playlist != undefined) {
			/*
   	Set the active playlist to the starting playlist by the user
   */
			_config2.default.active_playlist = userConfig.starting_playlist;

			/*
   	Set the player to the first song in the playlist
   */
			_helpers2.default.changeSong(userConfig.playlists[userConfig.starting_playlist][0]);

			/*
   	Sync the main and song play pause buttons.
   */
			_visual2.default.syncMainPlayPause('paused');
			_visual2.default.syncSongPlayPause(_config2.default.active_playlist, 0, 'paused');
		}

		/*
  	Run after init callback
  */
		_helpers2.default.runCallback('after_init');
	}

	/**
  * Counts the number of playlists the user has configured. This ensures
  * that the user has at least 1 playlist so we can validate the songs
  * defined in the playlist are correct and they didn't enter an invalid
  * ID.
  *
  * @access private
  * @param {object} playlists 	-
  */
	function countPlaylists(playlists) {
		/*
  	Initialize the placeholders to iterate through the playlists
  	and find out how many we have to account for.
  */
		var size = 0,
		    key = void 0;

		/*
  	Iterate over playlists and if the user has the playlist defined,
  	increment the size of playlists.
  */
		for (key in playlists) {
			if (playlists.hasOwnProperty(key)) {
				size++;
			}
		}

		/*
  	Debug how many playlists are in the config.
  */
		_helpers2.default.writeDebugMessage('You have ' + size + ' playlist(s) in your config');

		/*
  	Return the number of playlists in the config.
  */
		return size;
	}

	/**
 * Ensures the indexes in the playlists are valid indexes. The song has
 * to exist in the Amplitude config to be played correctly.
 *
 * @access private
 */
	function checkValidSongsInPlaylists() {
		/*
  	Iterate over all of the config's playlists
  */
		for (var key in _config2.default.playlists) {
			/*
   	Checks if the playlist key is accurate.
   */
			if (_config2.default.playlists.hasOwnProperty(key)) {
				/*
    	Checks if the playlist has songs.
    */
				if (_config2.default.playlists[key].songs) {
					/*
     	Iterate over all of the songs in the playlist
     */
					for (var i = 0; i < _config2.default.playlists[key].songs.length; i++) {
						/*
      	Check to see if the index for the song in the playlist
      	exists in the songs config.
      */
						if (!_config2.default.songs[_config2.default.playlists[key].songs[i]]) {
							_helpers2.default.writeDebugMessage('The song index: ' + _config2.default.playlists[key].songs[i] + ' in playlist with key: ' + key + ' is not defined in your songs array!');
						}
					}
				}
			}
		}
	}

	/**
  * Initializes the shuffle statuses for each of the playlists. These will
  * be referenced when we shuffle individual playlists.
  *
  * @access private
  */
	function initializePlaylistShuffleStatuses() {
		/*
  	Iterate over all of the playlists the user defined adding
  	the playlist key to the shuffled playlist array and creating
  	and empty object to house the statuses.
  */
		for (var key in _config2.default.playlists) {
			_config2.default.shuffled_statuses[key] = false;
		}
	}

	/**
  * Initializes the repeat statuses for each of the playlists.  These will
  * be referenced when we repeat individual playlits.
  *
  * @access private
  */
	function initializePlaylistsRepeatStatuses() {
		/*
  	Iterate over all of the playlists the user defined adding
  	the playlist key to the repeated playlist array and creating
  	and empty object to house the statuses.
  */
		for (var key in _config2.default.playlists) {
			_config2.default.repeat_statuses[key] = false;
		}
	}

	/**
  * Initializes the shuffled playlist placeholders. These will be set for
  * playlists that are shuffled and contain the shuffled songs.
  *
  * @access private
 	 */
	function initializePlaylistShuffleLists() {
		/*
  	Iterate over all of the playlists the user defined adding
  	the playlist key to the shuffled playlists array and creating
  	and empty object to house the shuffled playlists
  */
		for (var key in _config2.default.playlists) {
			_config2.default.shuffled_playlists[key] = [];
		}
	}

	/**
  * Initializes the shuffled playlist indexes array. These will be set for
  * playlists that are shuffled and contain the active shuffled index.
  *
  * @access private
  */
	function initializePlaylistShuffleIndexes() {
		/*
  	Iterates over all of the playlists adding a key
  	to the shuffled_active_indexes array that contains
  	the active shuffled index.
  */
		for (var key in _config2.default.playlists) {
			_config2.default.shuffled_active_indexes[key] = 0;
		}
	}

	/**
  * Intializes the display for the first song in the playlist meta data.
  *
  * @access private
  */
	function initializeFirstSongInPlaylistMetaData() {
		/*
  	Iterates over all of the playlists setting the meta data for the
  	first song.
  */
		for (var key in _config2.default.playlists) {
			_visual2.default.setFirstSongInPlaylist(_config2.default.songs[_config2.default.playlists[key][0]], key);
		}
	}

	/**
  * Intializes the default live settings for all of the songs.
  *
  * @access priavet
  */
	function initializeDefaultLiveSettings() {
		for (var i = 0; i < _config2.default.songs.length; i++) {
			if (_config2.default.songs[i].live == undefined) {
				_config2.default.songs[i].live = false;
			}
		}
	}

	/*
 	Returns the publicly accessible methods
 */
	return {
		initialize: initialize,
		setConfig: setConfig,
		rebindDisplay: rebindDisplay
	};
}();

/**
 * AmplitudeJS Visual Sync
 * @module visual/AmplitudeVisualSync
*/


/**
 * AmplitudeJS Events
 * @module events/AmplitudeEvents
 */


/**
 * AmplitudeJS Core Module
 * @module core/AmplitudeCore
 */
exports.default = AmplitudeInitializer;
module.exports = exports['default'];

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _helpers = __webpack_require__(5);

var _helpers2 = _interopRequireDefault(_helpers);

var _visual = __webpack_require__(2);

var _visual2 = _interopRequireDefault(_visual);

var _core = __webpack_require__(3);

var _core2 = _interopRequireDefault(_core);

var _helpers3 = __webpack_require__(1);

var _helpers4 = _interopRequireDefault(_helpers3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * These functions handle the events that we bound to each element and
 * prepare for a function to be called. These kind of act like filters/middleware.
 *
 * @module events/AmplitudeHandlers
 */


/**
 * Imports the core module of Amplitude which handles the basic functions
 * @module core/AmplitudeCore
 */


/**
 * Imports the helpers for the event handlers.
 * @module events/AmplitudeEventsHelpers
 */
exports.default = {
	/**
  * When the time updates on the active song, we sync the current time displays
  *
  * HANDLER FOR: timeupdate
  *
  * @access public
  */
	updateTime: function updateTime() {
		/*
  	Help from: http://jsbin.com/badimipi/1/edit?html,js,output
  */
		if (_config2.default.active_song.buffered.length - 1 >= 0) {
			var bufferedEnd = _config2.default.active_song.buffered.end(_config2.default.active_song.buffered.length - 1);
			var duration = _config2.default.active_song.duration;

			_config2.default.buffered = bufferedEnd / duration * 100;
		}

		/*
  	Sync the buffered progress bars.
  */
		_visual2.default.syncBufferedProgressBars();

		/*
  	If the current song is not live, then
  	we can update the time information. Otherwise the
  	current time updates wouldn't mean much since the time
  	is infinite.
  */
		if (!_config2.default.active_metadata.live) {
			/*
   	Compute the current time
   */
			var currentTime = _helpers2.default.computeCurrentTimes();

			/*
   	Compute the song completion percentage
   */
			var songCompletionPercentage = _helpers2.default.computeSongCompletionPercentage();

			/*
   	Computes the song duration
   */
			var songDuration = _helpers2.default.computeSongDuration();

			/*
   	Sync the current time elements with the current
   	location of the song and the song duration elements with
   	the duration of the song.
   */
			_visual2.default.syncCurrentTime(currentTime, songCompletionPercentage);
			_visual2.default.syncSongDuration(currentTime, songDuration);

			/*
   	Runs the callback defined for the time update.
   */
			_helpers4.default.runCallback('time_update');
		}
	},

	/**
  * When the keydown event is fired, we determine which function should be run
  * based on what was passed in.
  *
  * HANDLER FOR: keydown
  *
  * @access public
  */
	keydown: function keydown(event) {
		_helpers2.default.runKeyEvent(event.which);
	},

	/**
  * When the song has ended, handles what to do next
  *
  * HANDLER FOR: ended
  *
  * @access public
  */
	songEnded: function songEnded() {
		if (_config2.default.continue_next) {
			/*
   	If the active playlist is not set, we set the
   	next song that's in the songs array.
   */
			if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
				_helpers2.default.setNext(true);
			} else {
				/*
    	Set the next song in the playlist
    */
				_helpers2.default.setNextPlaylist(_config2.default.active_playlist, true);
			}
		} else {
			if (!_config2.default.is_touch_moving) {
				/*
    	Sets all of the play/pause buttons to pause
    */
				_visual2.default.setPlayPauseButtonsToPause();

				/*
    	Stops the active song.
    */
				_core2.default.stop();
			}
		}
	},

	/**
  * As the song is buffered, we can display the buffered percentage in
  * a progress bar.
  *
  * HANDLER FOR: ended
  *
  * @access public
  */
	progress: function progress() {
		/*
  	Help from: http://jsbin.com/badimipi/1/edit?html,js,output
  */
		if (_config2.default.active_song.buffered.length - 1 >= 0) {
			var bufferedEnd = _config2.default.active_song.buffered.end(_config2.default.active_song.buffered.length - 1);
			var duration = _config2.default.active_song.duration;

			_config2.default.buffered = bufferedEnd / duration * 100;
		}

		/*
  	Sync the buffered progress bars.
  */
		_visual2.default.syncBufferedProgressBars();
	},

	/**
  * Handles an event on a play button in Amplitude.
  *
  * HANDLER FOR: 'amplitude-play'
  *
  * @access public
  * @TODO Finish commenting and re-structure
  */
	play: function play() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Gets the attribute for song index so we can check if
   	there is a need to change the song.  In some scenarios
   	there might be multiple play classes on the page. In that
   	case it is possible the user could click a different play
   	class and change the song.
   */
			var playButtonSongIndex = this.getAttribute('amplitude-song-index');
			var playButtonPlaylistIndex = this.getAttribute('amplitude-playlist');

			if (playButtonPlaylistIndex == null && playButtonSongIndex == null) {
				_helpers2.default.setSongPlayPause(_config2.default.active_playlist, _config2.default.active_index);
			}

			/*
   	*/
			if (playButtonPlaylistIndex != null && playButtonPlaylistIndex != '') {
				if (_helpers4.default.checkNewPlaylist(playButtonPlaylistIndex)) {
					_helpers4.default.setActivePlaylist(playButtonPlaylistIndex);

					if (playButtonSongIndex != null) {
						_helpers4.default.changeSong(playButtonSongIndex);
						_helpers2.default.setPlaylistPlayPause(playButtonPlaylistIndex);
					} else {
						_helpers4.default.changeSong(_config2.default.playlists[playButtonPlaylistIndex][0]);
						_helpers2.default.setPlaylistPlayPause(playButtonPlaylistIndex);
					}
				} else {
					if (playButtonSongIndex != null) {
						_helpers4.default.changeSong(playButtonSongIndex);
						_helpers2.default.setPlaylistPlayPause(playButtonPlaylistIndex);
					} else {
						_helpers4.default.changeSong(_config2.default.active_index);
						_helpers2.default.setPlaylistPlayPause(playButtonPlaylistIndex);
					}
				}
			}

			/*
   	*/
			if ((playButtonPlaylistIndex == null || playButtonPlaylistIndex == '') && playButtonSongIndex != null && playButtonSongIndex != '') {

				if (_helpers4.default.checkNewSong(playButtonSongIndex) || _config2.default.active_playlist != playButtonPlaylistIndex) {
					_helpers4.default.changeSong(playButtonSongIndex);
				}

				_helpers2.default.setSongPlayPause(playButtonPlaylistIndex, playButtonSongIndex);
			}

			/*
   	Start the visualizations for the song.
   	AMPFX-TODO: MAKE HANDLED BY AMPLITUDE FX
   */
			//privateStartVisualization();
		}
	},

	/**
  * Handles an event on a pause button
  *
  * HANDLER FOR: 'amplitude-pause'
  *
  * @access public
  * @TODO Finish commenting and optimize
  */
	pause: function pause() {
		if (!_config2.default.is_touch_moving) {
			var pauseButtonSongIndex = this.getAttribute('amplitude-song-index');
			var pauseButtonPlaylistIndex = this.getAttribute('amplitude-playlist');

			if (pauseButtonSongIndex == null && pauseButtonPlaylistIndex == null) {
				_helpers2.default.setSongPlayPause(_config2.default.active_playlist, _config2.default.active_index);
				_core2.default.pause();
			}

			if (pauseButtonPlaylistIndex != null || pauseButtonPlaylistIndex != '' && _config2.default.active_playlist == pauseButtonPlaylistIndex) {
				/*
    	The song was playing so we sync visually for the song
    	to be paused and we pause the song.
    */
				_visual2.default.syncMainPlayPause('paused');

				/*
    	If there is an active playlist, then
    	we need to sync that playlist's play pause
    	button to the state of paused.
    */
				_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'paused');

				/*
    	Sync the song play pause buttons
    */
				_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'paused');

				_core2.default.pause();
			}

			if ((pauseButtonPlaylistIndex == null || pauseButtonPlaylistIndex == '') && pauseButtonSongIndex == _config2.default.active_index) {
				/*
    	The song was playing so we sync visually for the song
    	to be paused and we pause the song.
    */
				_visual2.default.syncMainPlayPause('paused');

				/*
    	If there is an active playlist, then
    	we need to sync that playlist's play pause
    	button to the state of paused.
    */
				_visual2.default.syncPlaylistPlayPause(_config2.default.active_playlist, 'paused');

				/*
    	Sync the song play pause buttons
    */
				_visual2.default.syncSongPlayPause(_config2.default.active_playlist, _config2.default.active_index, 'paused');

				_core2.default.pause();
			}
		}
	},

	/**
  * Handles an event on a play/pause button
  *
  * HANDLER FOR: 'amplitude-play-pause'
  *
  * @access public
  */
	playPause: function playPause() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Checks to see if the element has an attribute for amplitude-main-play-pause
   	and syncs accordingly
   */
			if (this.getAttribute('amplitude-main-play-pause') != null) {
				_helpers2.default.setMainPlayPause();

				/*
    	Syncs playlist main play pause buttons
    */
			} else if (this.getAttribute('amplitude-playlist-main-play-pause') != null) {
				var playlist = this.getAttribute('amplitude-playlist');

				_helpers2.default.setPlaylistPlayPause(playlist);

				/*
    	Syncs amplitude individual song buttons
    */
			} else {
				var _playlist = this.getAttribute('amplitude-playlist');
				var songIndex = this.getAttribute('amplitude-song-index');

				_helpers2.default.setSongPlayPause(_playlist, songIndex);
			}
		}
	},

	/**
  * Handles an event on a stop element.
  *
  * HANDLER FOR: 'amplitude-stop'
  *
  * @access public
  * @TODO: AMP-FX Before stopping, make sure that AmplitudeFX visualization is stopped as well.
  */
	stop: function stop() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Sets all of the play/pause buttons to pause
   */
			_visual2.default.setPlayPauseButtonsToPause();

			/*
   	Stops the active song.
   */
			_core2.default.stop();
		}
	},

	/**
  * Handles an event for a mute element
  *
  * HANDLER FOR: 'amplitude-mute'
  *
  * @access public
  */
	mute: function mute() {
		if (!_config2.default.is_touch_moving) {
			/*
   	If the current volume in the config is 0, we set the volume to the
   	pre_mute level.  This means that the audio is already muted and
   	needs to be restored to the pre_mute level.
   		Otherwise, we set pre_mute volume to the current volume
   	and set the config volume to 0, muting the audio.
   */
			if (_config2.default.volume == 0) {
				_config2.default.active_song.muted = false;
				_config2.default.volume = _config2.default.pre_mute_volume;
				_visual2.default.syncMute(false);
			} else {
				_config2.default.active_song.muted = true;
				_config2.default.pre_mute_volume = _config2.default.volume;
				_config2.default.volume = 0;
				_visual2.default.syncMute(true);
			}

			/*
   	Calls the core function to set the volume to the computed value
   	based on the user's intent.
   */
			_core2.default.setVolume(_config2.default.volume);

			/*
   	Syncs the volume sliders so the visuals align up with the functionality.
   	If the volume is at 0, then the sliders should represent that so the user
   	has the right starting point.
   */
			_visual2.default.syncVolumeSliders(_config2.default.volume);
		}
	},

	/**
  * Handles a click on a volume up element.
  *
  * HANDLER FOR: 'amplitude-volume-up'
  *
  * @access public
  */
	volumeUp: function volumeUp() {
		if (!_config2.default.is_touch_moving) {
			/*
   	The volume range is from 0 to 1 for an audio element. We make this
   	a base of 100 for ease of working with.
   		If the new value is less than 100, we use the new calculated
   	value which gets converted to the proper unit for the audio element.
   		If the new value is greater than 100, we set the volume to 1 which
   	is the max for the audio element.
   */
			if (_config2.default.volume + _config2.default.volume_increment <= 100) {
				_config2.default.volume = _config2.default.volume + _config2.default.volume_increment;
			} else {
				_config2.default.volume = 100;
			}

			/*
   	Calls the core function to set the volume to the computed value
   	based on the user's intent.
   */
			_core2.default.setVolume(_config2.default.volume);

			/*
   	Syncs the volume sliders so the visuals align up with the functionality.
   	If the volume is at 0, then the sliders should represent that so the user
   	has the right starting point.
   */
			_visual2.default.syncVolumeSliders(_config2.default.volume);
		}
	},

	/**
  * Handles a click on a volume down element.
  *
  * HANDLER FOR: 'amplitude-volume-down'
  *
  * @access public
  */
	volumeDown: function volumeDown() {
		if (!_config2.default.is_touch_moving) {
			/*
   	The volume range is from 0 to 1 for an audio element. We make this
   	a base of 100 for ease of working with.
   		If the new value is less than 100, we use the new calculated
   	value which gets converted to the proper unit for the audio element.
   		If the new value is greater than 100, we set the volume to 1 which
   	is the max for the audio element.
   */
			if (_config2.default.volume - _config2.default.volume_increment > 0) {
				_config2.default.volume = _config2.default.volume - _config2.default.volume_increment;
			} else {
				_config2.default.volume = 0;
			}

			/*
   	Calls the core function to set the volume to the computed value
   	based on the user's intent.
   */
			_core2.default.setVolume(_config2.default.volume);

			/*
   	Syncs the volume sliders so the visuals align up with the functionality.
   	If the volume is at 0, then the sliders should represent that so the user
   	has the right starting point.
   */
			_visual2.default.syncVolumeSliders(_config2.default.volume);
		}
	},

	/**
  * Handles a change on the song slider
  *
  * HANDLER FOR: 'amplitude-song-slider'
  *
  * @access public
  */
	songSlider: function songSlider() {
		/*
  	Gets the percentage of the song we will be setting the location for.
  */
		var locationPercentage = this.value;

		/*
  	Checks to see if the element has an attribute for amplitude-main-play-pause
  	and syncs accordingly
  */
		if (this.getAttribute('amplitude-main-song-slider') != null) {
			/*
   	If the active song is not live, set the current time
   */
			if (!_config2.default.active_metadata.live) {
				var currentTime = _config2.default.active_song.duration * (locationPercentage / 100);

				if (isFinite(currentTime)) {
					_config2.default.active_song.currentTime = currentTime;
				}
			}

			_visual2.default.syncMainSliderLocation(locationPercentage);

			if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null) {
				_visual2.default.syncPlaylistSliderLocation(_config2.default.active_playlist, locationPercentage);
			}
		}

		/*
  	Syncs playlist main play pause buttons
  */
		if (this.getAttribute('amplitude-playlist-song-slider') != null) {
			var playlist = this.getAttribute('amplitude-playlist');

			/*
   	We don't want to song slide a playlist that's not the
   	active placylist.
   */
			if (_config2.default.active_playlist == playlist) {
				/*
    	If the active song is not live, set the current time
    */
				if (!_config2.default.active_metadata.live) {
					_config2.default.active_song.currentTime = _config2.default.active_song.duration * (locationPercentage / 100);
				}
				_visual2.default.syncMainSliderLocation(locationPercentage);
				_visual2.default.syncPlaylistSliderLocation(playlist, locationPercentage);
			}
		}

		/*
  	Syncs amplitude individual song buttons
  */
		if (this.getAttribute('amplitude-playlist-song-slider') == null && this.getAttribute('amplitude-main-song-slider') == null) {

			var _playlist2 = this.getAttribute('amplitude-playlist');
			var songIndex = this.getAttribute('amplitude-song-index');

			if (_config2.default.active_index == songIndex) {
				/*
    	If the active song is not live, set the current time
    */
				if (!_config2.default.active_metadata.live) {
					_config2.default.active_song.currentTime = _config2.default.active_song.duration * (locationPercentage / 100);
				}

				_visual2.default.syncMainSliderLocation();

				if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && _config2.default.active_playlist == _playlist2) {
					_visual2.default.syncPlaylistSliderLocation(_playlist2, location);
				}

				_visual2.default.syncSongSliderLocation(_playlist2, songIndex, location);
			}
		}
	},

	/**
  * Handles a change on the volume slider
  *
  * HANDLER FOR: 'amplitude-volume-slider'
  *
  * @access public
  */
	volumeSlider: function volumeSlider() {
		/*
  	Calls the core function to set the volume to the computed value
  	based on the user's intent.
  */
		_core2.default.setVolume(this.value);

		/*
  	Sync the volume slider locations
  */
		_visual2.default.syncVolumeSliderLocation(this.value);
	},

	/**
  * Handles an event on the next button
  *
  * HANDLER FOR: 'amplitude-next'
  *
  * @access public
  */
	next: function next() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Checks to see if the button is a playlist next button or
   	if it's a global playlist button.
   */
			if (this.getAttribute('amplitude-playlist') == '' || this.getAttribute('amplitude-playlist') == null) {

				/*
    	Check to see if the current state of the player
    	is in playlist mode or not playlist mode.
    */
				if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
					_helpers2.default.setNext();
				} else {
					_helpers2.default.setNextPlaylist(_config2.default.active_playlist);
				}
			} else {
				/*
    	Gets the playlist of the next button.
    */
				var playlist = this.getAttribute('amplitude-playlist');

				/*
    	Sets the next playlist
    */
				_helpers2.default.setNextPlaylist(playlist);
			}
		}
	},

	/**
  * Handles an event on the previous button
  *
  * HANDLER FOR: 'amplitude-prev'
  *
  * @access public
  */
	prev: function prev() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Checks to see if the previous button is a playlist previous
   	button or if it's a global playlist button.
   */
			if (this.getAttribute('amplitude-playlist') == '' || this.getAttribute('amplitude-playlist') == null) {

				/*
    	Check to see if the current playlist has been set
    	or null and set the previous song.
    */
				if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null) {
					_helpers2.default.setPrev();
				} else {
					_helpers2.default.setPrevPlaylist(_config2.default.active_playlist);
				}
			} else {
				/*
    	Gets the playlist of the previous button.
    */
				var playlist = this.getAttribute('amplitude-playlist');

				/*
    	Sets the previous playlist
    */
				_helpers2.default.setPrevPlaylist(playlist);
			}
		}
	},

	/**
  * Handles an event on the shuffle button
  *
  * HANDLER FOR: 'amplitude-shuffle'
  *
  * @access public
  */
	shuffle: function shuffle() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Check to see if the shuffle button belongs to a playlist
   */
			if (this.getAttribute('amplitude-playlist') == '' || this.getAttribute('amplitude-playlist') == null) {
				/*
    	Sets the shuffle button to null
    */
				_helpers2.default.setShuffle(null);
			} else {
				/*
    	Gets the playlist attribute of the shuffle button and
    	set shuffle to on for the playlist.
    */
				var playlist = this.getAttribute('amplitude-playlist');
				_helpers2.default.setShuffle(playlist);
			}
		}
	},

	/**
  * Handles an event on the repeat button
  *
  * HANDLER FOR: 'amplitude-repeat'
  *
  * @access private
  */
	repeat: function repeat() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Check to see if the repeat button belongs to a playlist
   */
			if (this.getAttribute('amplitude-playlist') == '' || this.getAttribute('amplitude-playlist') == null) {
				/*
    	Sets repeat to the opposite of what it was set to
    */
				_helpers2.default.setRepeat(!_config2.default.repeat, null);
			} else {
				/*
    	Gets the playlist attribute of the repeat button and
    	set repeat to on for the playlist.
    */
				var playlist = this.getAttribute('amplitude-playlist');
				_helpers2.default.setRepeat(!_config2.default.repeat_statuses[playlist], playlist);
			}
		}
	},

	/**
  * Handles an event on the repeat song button
  *
  * HANDLER FOR: 'amplitude-repeat-song'
  *
  * @access private
  */
	repeatSong: function repeatSong() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Sets repeat song to the opposite of what it was set to
   */
			_helpers2.default.setRepeatSong(!_config2.default.repeat_song);

			/*
   	Visually sync repeat song
   */
			_visual2.default.syncRepeatSong();
		}
	},

	/**
  * Handles an event on the playback speed button
  *
  * HANDLER FOR: 'amplitude-playback-speed'
  *
  * @access private
  */
	playbackSpeed: function playbackSpeed() {
		if (!_config2.default.is_touch_moving) {
			/*
   	We increment the speed by .5 everytime we click
   	the button to change the playback speed. Once we are
   	actively playing back at 2, we start back at 1 which
   	is normal speed.
   */
			switch (_config2.default.playback_speed) {
				case 1:
					_helpers2.default.setPlaybackSpeed(1.5);
					break;
				case 1.5:
					_helpers2.default.setPlaybackSpeed(2);
					break;
				case 2:
					_helpers2.default.setPlaybackSpeed(1);
					break;
			}

			/*
   	Visually sync the playback speed.
   */
			_visual2.default.syncPlaybackSpeed();
		}
	},

	/**
  * Handles an event on a skip to button.
  *
  * HANDLER FOR: 'amplitude-skip-to'
  *
  * @access private
  */
	skipTo: function skipTo() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Determines if the skip to button is in the scope of a playlist.
   */
			if (this.hasAttribute('amplitude-playlist')) {
				var playlist = this.getAttribute('amplitude-playlist');

				if (_helpers4.default.checkNewPlaylist(playlist)) {
					_helpers4.default.setActivePlaylist(playlist);
				}
				/*
    	Gets the location, playlist and song index that is being skipped
    	to.
    */
				var seconds = parseInt(this.getAttribute('amplitude-location'));
				var songIndex = parseInt(this.getAttribute('amplitude-song-index'));

				/*
    	Changes the song to where it's being skipped and then
    	play the song.
    */
				_helpers4.default.changeSong(songIndex);
				_core2.default.play();

				_visual2.default.syncMainPlayPause('playing');
				_visual2.default.syncPlaylistPlayPause(playlist, 'playing');
				_visual2.default.syncSongPlayPause(playlist, songIndex, 'playing');

				/*
    	Skip to the location in the song.
    */
				_core2.default.skipToLocation(seconds);
			} else {
				/*
    	Gets the location and song index that is being skipped
    	to.
    */
				var _seconds = parseInt(this.getAttribute('amplitude-location'));
				var _songIndex = parseInt(this.getAttribute('amplitude-song-index'));

				/*
    	Changes the song to where it's being skipped and then
    	play the song.
    */
				_helpers4.default.changeSong(_songIndex);
				_core2.default.play();

				_visual2.default.syncMainPlayPause('playing');
				_visual2.default.syncSongPlayPause(null, _songIndex, 'playing');

				/*
    	Skip to the location in the song.
    */
				_core2.default.skipToLocation(_seconds);
			}
		}
	}
};

/**
 * Imports the core helpers for Amplitude which help run some of AmplitudeJS functions
 * @module core/AmplitudeHelpers
 */


/**
 * Imports the visual sync module to keep the display in sync with AmplitudeJS
 * @module visual/AmplitudeVisualSync
 */
/**
 * Imports the config module
 * @module config
 */

module.exports = exports['default'];

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _init = __webpack_require__(6);

var _init2 = _interopRequireDefault(_init);

var _core = __webpack_require__(3);

var _core2 = _interopRequireDefault(_core);

var _helpers = __webpack_require__(1);

var _helpers2 = _interopRequireDefault(_helpers);

var _events = __webpack_require__(4);

var _events2 = _interopRequireDefault(_events);

var _helpers3 = __webpack_require__(5);

var _helpers4 = _interopRequireDefault(_helpers3);

var _visual = __webpack_require__(2);

var _visual2 = _interopRequireDefault(_visual);

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Amplitude should just be an interface to the public functions.
 * Everything else should be handled by other objects
 *
 * @module Amplitude
 */

/**
 * AmplitudeJS Visual Sync Module
 *
 * @module visual/AmplitudeVisualSync
 */


/**
 * AmplitudeJS Events Module
 *
 * @module events/AmplitudeEvents
 */


/**
 * AmplitudeJS Core Module
 *
 * @module core/AmplitudeCore
 */
var Amplitude = function () {
	/**
  * The main init function.  The user will call this through
  * Amplitude.init({}) and pass in their settings.
  *
  * Public Accessor: Amplitude.init( user_config_json );
  *
  * @access public
  * @param {object} userConfig 	- A JSON object of user defined values that helps configure and initialize AmplitudeJS.
  */
	function init(userConfig) {
		_init2.default.initialize(userConfig);
	}

	/**
  * Binds new elements that were added to the page.
  *
  * Public Accessor: Amplitude.bindNewElements()
  *
  * @access public
  */
	function bindNewElements() {
		_init2.default.rebindDisplay();
	}

	/**
  * Returns the active playlist.
  *
  * Public Accessor: Amplitude.getActivePlaylist()
  *
  * @access public
  */
	function getActivePlaylist() {
		return _config2.default.active_playlist;
	}

	/**
  * Returns the current playback speed.
  *
  * Public Accessor: Amplitude.getPlaybackSpeed()
  *
  * @access public
  */
	function getPlaybackSpeed() {
		return _config2.default.playback_speed;
	}

	/**
  * Gets the repeat state of the player.
  *
  * Public Accessor: Amplitude.getRepeat()
  *
  * @access public
  */
	function getRepeat() {
		return _config2.default.repeat;
	}

	/**
  * Returns the shuffle state of the player.
  *
  * Public Accessor: Amplitude.getShuffle()
  *
  * @access public
  */
	function getShuffle() {
		return _config2.default.shuffle_on;
	}

	/**
  * Returns the shuffle state of the playlist.
  *
  * Public Accessor: Amplitude.getShufflePlaylist( playlist )
  *
  * @access public
  * @param {string} playlist 	- The key representing the playlist ID to see if it's shuffled or not.
  */
	function getShufflePlaylist(playlist) {
		return _config2.default.shuffled_statuses[playlist];
	}

	/**
  * Sets the shuffle state for the player.
  *
  * Public Accessor: Amplitude.setShuffle()
  *
  * @access public
  */
	function setShuffle() {
		_helpers4.default.setShuffle(null);
	}

	/**
  * Sets the shuffle state for the playlist
  *
  * Public Accessor: Amplitude.setShufflePlaylist( playlistKey )
  *
  * @access public
 * @param {string} playlistKey 	- The key representing the playlist ID to to shuffle the playlist.
  */
	function setShufflePlaylist(playlistKey) {
		_helpers4.default.setShuffle(playlistKey);
	}

	/**
  * Sets the repeat state for the player.
 *
 * Public Accessor: Amplitude.setRepeat()
 *
 * @access public
  */
	function setRepeat() {
		if (!_config2.default.is_touch_moving) {
			/*
   	Sets repeat to the opposite of what it was set to
   */
			_helpers4.default.setRepeat(!_config2.default.repeat);

			/*
   	Visually sync repeat
   */
			_visual2.default.syncRepeat();
		}
	}

	/**
  * Sets the repeat state for the song.
  *
  * Public Accessor: Amplitude.setRepeatSong()
  *
  * @access public
  */
	function setRepeatSong() {
		if (!_config2.default.is_touch_moving) {
			/*
    Sets repeat to the opposite of what it was set to
   */
			_helpers4.default.setRepeatSong(!_config2.default.repeat_song);

			/*
    Visually sync repeat song
   */
			_visual2.default.syncRepeatSong();
		}
	}

	/**
  * Gets the default album art for the player
  *
  * Public Accessor: Amplitude.getDefaultAlbumArt()
  *
  * @access public
  */
	function getDefaultAlbumArt() {
		return _config2.default.default_album_art;
	}

	/**
  * Sets the default album art for the player
  *
  * Public Accessor: Amplitude.setDefaultAlbumArt( url )
  *
  * @access public
  * @param {string} url 	- A string representing the URL of the new default album art.
  */
	function setDefaultAlbumArt(url) {
		_config2.default.default_album_art = url;
	}

	/**
  * Allows the user to get the percentage of the song played.
  *
  * Public Accessor: Amplitude.getSongPlayedPercentage();
  *
  * @access public
  */
	function getSongPlayedPercentage() {
		/*
  	Returns the percentage of the song played.
  */
		return _config2.default.active_song.currentTime / _config2.default.active_song.duration * 100;
	}

	/**
  * Allows the user to set how far into the song they want to be. This is
  * helpful for implementing custom range sliders. Only works on the current song.
  *
  * Public Accessor: Amplitude.setSongPlayedPercentage( float );
  *
  * @access public
  * @param {number} percentage 	- The percentage of the song played
  */
	function setSongPlayedPercentage(percentage) {
		/*
  	Ensures the percentage is a number and is between 0 and 100.
  */
		if (typeof percentage == 'number' && percentage > 0 && percentage < 100) {
			/*
   	Sets the current time of the song to the percentage.
   */
			_config2.default.active_song.currentTime = _config2.default.active_song.duration * (percentage / 100);
		}
	}

	/**
  * Allows the user to turn on debugging.
  *
  * Public Accessor: Amplitude.setDebug( bool );
  *
  * @access public
  * @param {boolean} state 		- Turns debugging on and off.
  */
	function setDebug(state) {
		/*
  	Sets the global config debug on or off.
  */
		_config2.default.debug = state;
	}

	/**
  * Returns the active song meta data for the user to do what is
  * needed.
  *
  * Public Accessor: Amplitude.getActiveSongMetadata();
  *
  * @access public
  * @returns {object} JSON Object with the active song information
  */
	function getActiveSongMetadata() {
		return _config2.default.active_metadata;
	}

	/**
  * Returns a song in the songs array at that index
  *
  * Public Accessor: Amplitude.getSongByIndex( song_index )
  *
  * @access public
  * @param {number} index 	- The integer for the index of the song in the songs array.
  * @returns {object} JSON representation for the song at a specific index.
  */
	function getSongByIndex(index) {
		return _config2.default.songs[index];
	}

	/**
  * Returns a song at a playlist index
  *
  * Public Accessor: Amplitude.getSongAtPlaylistIndex( playlist, index
  *
  * @access public
  * @param {number} index 			- The integer for the index of the song in the playlist.
  * @param {string} playlist		- The key of the playlist we are getting the song at the index for
  * @returns {object} JSON representation for the song at a specific index.
  */
	function getSongAtPlaylistIndex(playlist, index) {
		var songIndex = _config2.default.playlists[playlist][index];

		return _config2.default.songs[songIndex];
	}

	/**
  * Adds a song to the end of the config array.  This will allow Amplitude
  * to play the song in a playlist type setting.
  *
  * Public Accessor: Amplitude.addSong( song_json )
  *
  * @access public
  * @param {object} song 	- JSON representation of a song.
  * @returns {number} New index of the song.
  */
	function addSong(song) {
		/*
  	Ensures we have a songs array to push to.
  */
		if (_config2.default.songs == undefined) {
			_config2.default.songs = [];
		}

		_config2.default.songs.push(song);
		return _config2.default.songs.length - 1;
	}

	/**
  * Adds a song to a playlist. This will allow Amplitude to play the song in the
  * playlist
  *
  * Public Accessor: Amplitude.addSongToPlaylist( song_json, playlist_key )
  *
  * @access public
  * @param {object} song 			- JSON representation of a song.
  * @param {string} playlist		- Playlist we are adding the song to.
  * @returns {mixed} New index of song in playlist or null if no playlist exists
  */
	function addSongToPlaylist(song, playlist) {
		/*
  	Ensures we have a songs array to push to. This is step 1.
  */
		if (_config2.default.songs == undefined) {
			_config2.default.songs = [];
		}

		_config2.default.songs.push(song);

		var songIndex = _config2.default.songs.length - 1;

		/*
  	Ensures the playlist is valid to push the song on to.
  */
		if (_config2.default.playlists[playlist] != undefined) {
			_config2.default.playlists[playlist].push(songIndex);

			return _config2.default.playlists[playlist].length - 1;
		} else {
			return null;
		}
	}

	/**
  * Removes a song from the song array
  *
  * Public Accessor: Amplitude.removeSong( index )
  *
  * @access public
  * @param {integer} index 			- Index of the song being removed
  * @returns {boolean} True if removed false if not.
  */
	function removeSong(index) {
		if (_config2.default.songs[index] != undefined) {
			_config2.default.songs.splice(index, 1);
			return true;
		} else {
			return false;
		}
	}

	/**
  * Removes a song from the playlist
  *
  * Public Accessor: Amplitude.removeSongFromPlaylist( index, playlist )
  *
  * @access public
  * @param {integer} index 			- Index of the song being removed from the playlist.
  * @param {string} playlist			- Playlist we are removing the song from.
  * @returns {boolean} True if removed false if not.
  */
	function removeSongFromPlaylist(index, playlist) {
		if (_config2.default.playlists[playlist] != undefined) {
			_config2.default.playlists[playlist].splice(index, 1);
		} else {
			return false;
		}
	}

	/**
  * When you pass a song object it plays that song right awawy.  It sets
  * the active song in the config to the song you pass in and synchronizes
  * the visuals.
  *
  * Public Accessor: Amplitude.playNow( song )
  *
  * @access public
  * @param {object} song 	- JSON representation of a song.
  */
	function playNow(song) {
		_core2.default.playNow(song);
	}

	/**
  * Plays a song at the index passed in from the songs array.
  *
  * Public Accessor: Amplitude.playSongAtIndex( index )
  *
  * @access public
  * @param {number} index 	- The number representing the song in the songs array.
  */
	function playSongAtIndex(index) {
		_core2.default.playSongAtIndex(index);
	}

	/**
  * Plays a song at the index passed in for the playlist provided. The index passed
  * in should be the index of the song in the playlist and not the songs array.
  *
  * @access public
  * @param {number} index 		- The number representing the song in the playlist array.
  * @param {string} playlist - The key string representing the playlist we are playing the song from.
  *
  */
	function playPlaylistSongAtIndex(index, playlist) {
		_core2.default.playPlaylistSongAtIndex(index, playlist);
	}

	/**
  * @TODO: Implement Add Song To Playlist Functionality
  */
	function addSongToPlaylist(song, playlist) {}

	/**
  * Allows the user to play whatever the active song is directly
  * through Javascript. Normally ALL of Amplitude functions that access
  * the core features are called through event handlers.
  *
  * Public Accessor: Amplitude.play();
  *
  * @access public
  */
	function play() {
		_core2.default.play();
	}

	/**
  * Allows the user to pause whatever the active song is directly
  * through Javascript. Normally ALL of Amplitude functions that access
  * the core features are called through event handlers.
  *
  * Public Accessor: Amplitude.pause();
  *
  * @access public
  */
	function pause() {
		_core2.default.pause();
	}

	/**
  * Returns the audio object used to play the audio
  *
  * Public Accessor: Amplitude.getAudio();
  *
  * @access public
  */
	function getAudio() {
		return _config2.default.active_song;
	}

	/**
  * Plays the next song either in the playlist or globally.
  *
  * Public Accessor: Amplitude.next( playlist );
  *
  * @access public
  * @param {string} [playlist = null] 	- The playlist key
  */
	function next() {
		var playlist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

		/*
  	If the playlist is empty or null, then we check the active
  	playlist
  */
		if (playlist == '' || playlist == null) {
			/*
   	If the active playlist is null, then we set the next global
   	song or we set the next in the playlist.
   */
			if (_config2.default.active_playlist == null || _config2.default.active_playlist == '') {
				_helpers4.default.setNext();
			} else {
				_helpers4.default.setNextPlaylist(_config2.default.active_playlist);
			}
		} else {
			/*
   	Set the next in the playlist for the key provided.
   */
			_helpers4.default.setNextPlaylist(playlist);
		}
	}

	/**
  * Plays the prev song either in the playlist or globally.
  *
  * Public Accessor: Amplitude.prev( playlist );
  *
  * @access public
  * @param {string} [playlist = null] 	- The playlist key
  */
	function prev() {
		var playlist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

		/*
  	If the playlist is empty or null, then we check the active
  	playlist
  */
		if (playlist == '' || playlist == null) {
			/*
   	If the active playlist is null, then we set the prev global
   	song or we set the prev in the playlist.
   */
			if (_config2.default.active_playlist == null || _config2.default.active_playlist == '') {
				_helpers4.default.setPrev();
			} else {
				_helpers4.default.setPrevPlaylist(_config2.default.active_playlist);
			}
		} else {
			/*
   	Set the prev in the playlist for the key provided.
   */
			_helpers4.default.setPrevPlaylist(playlist);
		}
	}

	/**
  * Gets all of the songs in the songs array
  *
  * Public Accessor: Amplitude.getSongs( );
  *
  * @access public
  */
	function getSongs() {
		return _config2.default.songs;
	}

	/**
  * Gets all of the songs in a playlist
  *
  * Public Accessor: Amplitude.getSongsInPlaylist( playlist );
  *
  * @access public
  * @param {string} playlist 	- The playlist key
  */
	function getSongsInPlaylist(playlist) {
		var songsArray = [];

		for (var i = 0; i < _config2.default.playlists[playlist].length; i++) {
			songsArray.push(_config2.default.songs[i]);
		}

		return songsArray;
	}

	/**
  * Get current state of songs. If shuffled, this will return the shuffled
  * songs.
  *
  * Public Accessor: Amplitude.getSongsState();
  *
  * @access public
  */
	function getSongsState() {
		if (_config2.default.shuffle_on) {
			return _config2.default.shuffle_list;
		} else {
			return _config2.default.songs;
		}
	}

	/**
  * Get current state of songs in playlist. If shuffled, this will return the
  * shuffled songs.
  *
  * Public Accessor: Amplitude.getSongsStatePlaylist( playlist );
  *
  * @access public
  * @param {string} playlist 	- The playlist key
  * @todo Finish commenting
  */
	function getSongsStatePlaylist(playlist) {
		var songsArray = [];

		if (_config2.default.shuffled_status[playlist]) {

			for (var i = 0; i < _config2.default.shuffled_playlists[playlist].length; i++) {
				songsArray.push(_config2.default.songs[i]);
			}
		} else {

			for (var _i = 0; _i < _config2.default.playlists[playlist].length; _i++) {
				songsArray.push(_config2.default.songs[_i]);
			}
		}

		return songsArray;
	}

	/**
  * Gets the active index of the player
  *
  * Public Accessor: Amplitude.getActiveIndex()
  *
  * @access public
  */
	function getActiveIndex() {
		return parseInt(_config2.default.active_index);
	}

	/**
  * Gets the active index with respect to the state of the player whether it is
  * shuffled or not.
  *
  * Public Accessor: Amplitude.getActiveIndexState()
  *
  * @access public
  */
	function getActiveIndexState() {
		if (_config2.default.shuffle_on) {
			return parseInt(_config2.default.shuffle_active_index);
		} else {
			return parseInt(_config2.default.active_index);
		}
	}

	/**
  * Get the version of AmplitudeJS
  *
  * Public Accessor: Amplitude.getVersion()
  *
  * @access public
  */
	function getVersion() {
		return _config2.default.version;
	}

	/**
  * Get the buffered amount for the current song
  *
  * Public Accessor: Amplitude.getBuffered()
  *
  * @access public
  */
	function getBuffered() {
		return _config2.default.buffered;
	}

	/**
  * Skip to a certain location in a selected song.
  *
  * Public Accessor: Amplitude.getBuffered()
  *
  * @access public
  * @param {number} seconds 						- The amount of seconds we should skip to in the song.
  * @param {number} songIndex 					- The index of the song in the songs array.
  * @param {string} [playlist = null]	- The playlist the song we are skipping to belogns to.
  */
	function skipTo(seconds, songIndex) {
		var playlist = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

		if (playlist != null) {
			if (_helpers2.default.checkNewPlaylist(playlist)) {
				_helpers2.default.setActivePlaylist(playlist);
			}
		}

		seconds = parseInt(seconds);

		/*
  	Changes the song to where it's being skipped and then
  	play the song.
  */
		_helpers2.default.changeSong(songIndex);
		_core2.default.play();

		_visual2.default.syncMainPlayPause('playing');

		if (playlist != null) {
			_visual2.default.syncPlaylistPlayPause(playlist, 'playing');
		}

		_visual2.default.syncSongPlayPause(playlist, songIndex, 'playing');

		/*
  	Skip to the location in the song.
  */
		_core2.default.skipToLocation(seconds);
	}

	/*
 	Returns all of the publically accesible methods.
 */
	return {
		init: init,
		bindNewElements: bindNewElements,
		getActivePlaylist: getActivePlaylist,
		getPlaybackSpeed: getPlaybackSpeed,
		getRepeat: getRepeat,
		getShuffle: getShuffle,
		getShufflePlaylist: getShufflePlaylist,
		setShuffle: setShuffle,
		setShufflePlaylist: setShufflePlaylist,
		setRepeat: setRepeat,
		setRepeatSong: setRepeatSong,
		getDefaultAlbumArt: getDefaultAlbumArt,
		setDefaultAlbumArt: setDefaultAlbumArt,
		getSongPlayedPercentage: getSongPlayedPercentage,
		setSongPlayedPercentage: setSongPlayedPercentage,
		setDebug: setDebug,
		getActiveSongMetadata: getActiveSongMetadata,
		getSongByIndex: getSongByIndex,
		getSongAtPlaylistIndex: getSongAtPlaylistIndex,
		addSong: addSong,
		addSongToPlaylist: addSongToPlaylist,
		removeSong: removeSong,
		removeSongFromPlaylist: removeSongFromPlaylist,
		playNow: playNow,
		playSongAtIndex: playSongAtIndex,
		playPlaylistSongAtIndex: playPlaylistSongAtIndex,
		play: play,
		pause: pause,
		audio: getAudio,
		next: next,
		prev: prev,
		getSongs: getSongs,
		getSongsInPlaylist: getSongsInPlaylist,
		getSongsState: getSongsState,
		getSongsStatePlaylist: getSongsStatePlaylist,
		getActiveIndex: getActiveIndex,
		getActiveIndexState: getActiveIndexState,
		getVersion: getVersion,
		getBuffered: getBuffered,
		skipTo: skipTo
	};
}();

/**
 * Imports the config module
 * @module config
 */


/**
 * AmplitudeJS Events Helpers Module
 *
 * @module events/AmplitudeEventsHelpers
 */


/**
 * AmplitudeJS Core Helpers Module
 *
 * @module core/AmplitudeCoreHelpers
 */
/**
 * @name 		Amplitude.js
 * @version 3.2.0
 * @author 	Dan Pastori (521 Dimensions) <dan@521dimensions.com>
*/

/**
 * AmplitudeJS Initializer Module
 *
 * @module init/AmplitudeInitializer
 */
exports.default = Amplitude;
module.exports = exports['default'];

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

var _helpers = __webpack_require__(1);

var _helpers2 = _interopRequireDefault(_helpers);

var _init = __webpack_require__(6);

var _init2 = _interopRequireDefault(_init);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * These helpers wrap around the basic methods of the Soundcloud API
 * and get the information we need from SoundCloud to make the songs
 * streamable through Amplitude
 *
 * @module soundcloud/AmplitudeSoundcloud
 */


/**
 * Imports the helper functions for the core module
 * @module core/AmplitudeHelers
 */
var AmplitudeSoundcloud = function () {

	/**
  * Defines the temporary user config used while we configure soundcloud
  * @type {object}
  */
	var tempUserConfig = {};

	/**
  * Loads the soundcloud SDK for use with Amplitude so the user doesn't have
  * to load it themselves.
  * With help from: http://stackoverflow.com/questions/950087/include-a-javascript-file-in-another-javascript-file
  *
  * @access public
  * @param {object} userConfig 	- The config defined by the user for AmplitudeJS
  */
	function loadSoundCloud(userConfig) {
		/*
  	Sets the temporary config to the config passed by the user so we can make changes
  	and not break the actual config.
  */
		tempUserConfig = userConfig;

		/*
  	Gets the head tag for the document and create a script element.
  */
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');

		script.type = 'text/javascript';

		/*
  	URL to the remote soundcloud SDK
  */
		script.src = 'https://connect.soundcloud.com/sdk.js';
		script.onreadystatechange = initSoundcloud;
		script.onload = initSoundcloud;

		/*
  	Add the script to the head of the document.
  */
		head.appendChild(script);
	}

	/**
  * Initializes soundcloud with the key provided.
  *
  * @access private
  */
	function initSoundcloud() {
		/*
  	Calls the SoundCloud initialize function
  	from their API and sends it the client_id
  	that the user passed in.
  */
		SC.initialize({
			client_id: _config2.default.soundcloud_client
		});

		/*
  	Gets the streamable URLs to run through Amplitue. This is
  	VERY important since Amplitude can't stream the copy and pasted
  	link from the SoundCloud page, but can resolve the streaming
  	URLs from the link.
  */
		getStreamableURLs();
	}

	/**
  * Gets the streamable URL from the URL provided for
  * all of the soundcloud links.  This will loop through
  * and set all of the information for the soundcloud
  * urls.
  *
  * @access private
  */
	function getStreamableURLs() {
		/*
  	Define the regex to find the soundcloud URLs
  */
		var soundcloud_regex = /^https?:\/\/(soundcloud.com|snd.sc)\/(.*)$/;

		for (var i = 0; i < _config2.default.songs.length; i++) {
			/*
   	If the URL matches soundcloud, we grab
   	that url and get the streamable link
   	if there is one.
   */
			if (_config2.default.songs[i].url.match(soundcloud_regex)) {
				_config2.default.soundcloud_song_count++;
				resolveStreamable(_config2.default.songs[i].url, i);
			}
		}
	}

	/**
  * Due to Soundcloud SDK being asynchronous, we need to scope the
  * index of the song in another function. The privateGetSoundcloudStreamableURLs
  * function does the actual iteration and scoping.
  *
  * @access private
  * @param {string} url 		- URL of the soundcloud song
  * @param {number} index 	- The index of the soundcloud song in the songs array.
  */
	function resolveStreamable(url, index) {
		SC.get('/resolve/?url=' + url, function (sound) {
			/*
   	If streamable we get the url and bind the client ID to the end
   	so Amplitude can just stream the song normally. We then overwrite
   	the url the user provided with the streamable URL.
   */
			if (sound.streamable) {
				_config2.default.songs[index].url = sound.stream_url + '?client_id=' + _config2.default.soundcloud_client;

				/*
    	If the user want's to use soundcloud art, we overwrite the
    	cover_art_url with the soundcloud artwork url.
    */
				if (_config2.default.soundcloud_use_art) {
					_config2.default.songs[index].cover_art_url = sound.artwork_url;
				}

				/*
    	Grab the extra metadata from soundcloud and bind it to the
    	song.  The user can get this through the public function:
    	getActiveSongMetadata
    */
				_config2.default.songs[index].soundcloud_data = sound;
			} else {
				/*
    	If not streamable, then we print a message to the user stating
    	that the song with name X and artist X is not streamable. This
    	gets printed ONLY if they have debug turned on.
    */
				_helpers2.default.writeDebugMessage(_config2.default.songs[index].name + ' by ' + _config2.default.songs[index].artist + ' is not streamable by the Soundcloud API');
			}
			/*
   	Increments the song ready counter.
   */
			_config2.default.soundcloud_songs_ready++;

			/*
   	When all songs are accounted for, then amplitude is ready
   	to rock and we set the rest of the config.
   */
			if (_config2.default.soundcloud_songs_ready == _config2.default.soundcloud_song_count) {
				_init2.default.setConfig(tempUserConfig);
			}
		});
	}

	/*
 	Returns the publically accessible methods
 */
	return {
		loadSoundCloud: loadSoundCloud
	};
}();

/**
 * Imports the initializer
 * @module init/AmplitudeInitializer
 */
/**
 * Imports the config module
 * @module config
 */
exports.default = AmplitudeSoundcloud;
module.exports = exports['default'];

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _config = __webpack_require__(0);

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * These methods help sync visual displays. They essentially make the visual sync
 * methods smaller and more maintainable.
 *
 * @module visual/AmplitudeVisualSyncHelpers
 */
var AmplitudeVisualSyncHelpers = function () {
	/**
  * Updates any elements that display the current hour for the song.
  *
  * @access public
  * @param {number} hours 	- An integer conaining how many hours into the song.
  */
	function syncCurrentHours(hours) {
		/*
  	Gets all of the song hour selectors.
  */
		var hourSelectors = [];

		if (_config2.default.active_playlist != null && _config2.default.active_playlist != '') {
			hourSelectors = ['.amplitude-current-hours[amplitude-main-current-hours="true"]', '.amplitude-current-hours[amplitude-playlist-current-hours="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]', '.amplitude-current-hours[amplitude-song-index="' + _config2.default.active_index + '"]'];
		} else {
			hourSelectors = ['.amplitude-current-hours[amplitude-main-current-hours="true"]', '.amplitude-current-hours[amplitude-song-index="' + _config2.default.active_index + '"]'];
		}

		/*
  	Ensures that there are some hour selectors.
  */
		if (document.querySelectorAll(hourSelectors.join()).length > 0) {
			/*
   	Get all of the hour selectors
   */
			var currentHourSelectors = document.querySelectorAll(hourSelectors.join());

			/*
   	Set the current hour selector's inner html to hours passed in.
   */
			for (var i = 0; i < currentHourSelectors.length; i++) {
				/*
    	If the selector is a main selector, we set the hours.
    */
				if (currentHourSelectors[i].getAttribute('amplitude-main-current-hours') == 'true') {
					currentHourSelectors[i].innerHTML = hours;
				} else {
					/*
     	If the active playlist is not null or empty
     	and the attribute of the playlist is equal to the
     	active playlist, then we set the inner html.
     */
					if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && currentHourSelectors[i].getAttribute('amplitude-playlist') == _config2.default.active_playlist) {
						currentHourSelectors[i].innerHTML = hours;
						/*
      	If the active playlist is not set and the selector
      	does not have a playlist then we set the hours. This
      	means that the current selector is an individual song
      	selector.
      */
					} else if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null && !currentHourSelectors[i].hasAttribute('amplitude-playlist')) {
						currentHourSelectors[i].innerHTML = hours;
						/*
      	If nothing else matches, set the selector's inner HTML to '00'
      */
					} else {
						currentHourSelectors[i].innerHTML = '0';
					}
				}
			}
		}
	}

	/*--------------------------------------------------------------------------
 	Resets the current hours displays to 0
 --------------------------------------------------------------------------*/
	function resetCurrentHours() {
		/*
  	Gets the hour display elements
  */
		var hourSelectors = document.querySelectorAll('.amplitude-current-hours');

		/*
  	Iterates over all of the hour selectors and sets the inner HTML
  	to 00.
  */
		for (var i = 0; i < hourSelectors.length; i++) {
			hourSelectors[i].innerHTML = '0';
		}
	}

	/**
  * Updates any elements that display the current minutes for the song.
  *
  * @access public
  * @param {number} minutes 	- An integer conaining how many minutes into the song.
  */
	function syncCurrentMinutes(minutes) {
		/*
  	Gets all of the song minute selectors.
  */
		var minuteSelectors = [];

		if (_config2.default.active_playlist != null && _config2.default.active_playlist != '') {
			minuteSelectors = ['.amplitude-current-minutes[amplitude-main-current-minutes="true"]', '.amplitude-current-minutes[amplitude-playlist-current-minutes="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]', '.amplitude-current-minutes[amplitude-song-index="' + _config2.default.active_index + '"]'];
		} else {
			minuteSelectors = ['.amplitude-current-minutes[amplitude-main-current-minutes="true"]', '.amplitude-current-minutes[amplitude-song-index="' + _config2.default.active_index + '"]'];
		}

		/*
  	Grabs the current minute selectors
  */
		var currentMinuteSelectors = document.querySelectorAll(minuteSelectors.join());

		/*
  	Set the current minute selector's inner html to minutes passed in.
  */
		for (var i = 0, l = currentMinuteSelectors.length; i < l; i++) {
			/*
   	If the selector is a main selector, we set the seconds.
   */
			if (currentMinuteSelectors[i].getAttribute('amplitude-main-current-minutes') == 'true') {
				currentMinuteSelectors[i].innerHTML = minutes;
			} else {
				/*
    	If the active playlist is not null or empty
    	and the attribute of the playlist is equal to the
    	active playlist, then we set the inner html.
    */
				if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && currentMinuteSelectors[i].getAttribute('amplitude-playlist') == _config2.default.active_playlist) {
					currentMinuteSelectors[i].innerHTML = minutes;
					/*
     	If the active playlist is not set and the selector
     	does not have a playlist then we set the minutes. This
     	means that the current selector is an individual song
     	selector.
     */
				} else if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null && !currentMinuteSelectors[i].hasAttribute('amplitude-playlist')) {
					currentMinuteSelectors[i].innerHTML = minutes;
					/*
     	If nothing else matches, set the selector's inner HTML to '00'
     */
				} else {
					currentMinuteSelectors[i].innerHTML = '00';
				}
			}
		}
	}

	/**
  * Resets the current minutes displays to 00
  *
  * @access public
  */
	function resetCurrentMinutes() {
		/*
  	Gets the minutes display elements
  */
		var minuteSelectors = document.querySelectorAll('.amplitude-current-minutes');

		/*
  	Iterates over all of the minute selectors and sets the inner HTML
  	to 00.
  */
		for (var i = 0; i < minuteSelectors.length; i++) {
			minuteSelectors[i].innerHTML = '00';
		}
	}

	/**
  * Updates any elements that display the current seconds for the song.
  *
  * @access public
  * @param {number} seconds	- An integer conaining how many seconds into the song.
  */
	function syncCurrentSeconds(seconds) {
		/*
  	Gets all of the song second selectors. If the active playlist
  	is not null, then we get the playlist selectors.
  */
		var secondSelectors = [];

		if (_config2.default.active_playlist != null && _config2.default.active_playlist != '') {
			secondSelectors = ['.amplitude-current-seconds[amplitude-main-current-seconds="true"]', '.amplitude-current-seconds[amplitude-playlist-current-seconds="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]', '.amplitude-current-seconds[amplitude-song-index="' + _config2.default.active_index + '"]'];
		} else {
			secondSelectors = ['.amplitude-current-seconds[amplitude-main-current-seconds="true"]', '.amplitude-current-seconds[amplitude-song-index="' + _config2.default.active_index + '"]'];
		}

		/*
  	Get all of the second selectors
  */
		var currentSecondSelectors = document.querySelectorAll(secondSelectors.join());

		/*
  	Iterate over all of the second selectors.
  */
		for (var i = 0, l = currentSecondSelectors.length; i < l; i++) {
			/*
   	If the selector is a main selector, we set the seconds.
   */
			if (currentSecondSelectors[i].getAttribute('amplitude-main-current-seconds') == 'true') {
				currentSecondSelectors[i].innerHTML = seconds;
			} else {
				/*
    	If the active playlist is not null or empty
    	and the attribute of the playlist is equal to the
    	active playlist, then we set the inner html.
    */
				if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && currentSecondSelectors[i].getAttribute('amplitude-playlist') == _config2.default.active_playlist) {
					currentSecondSelectors[i].innerHTML = seconds;
					/*
     	If the active playlist is not set and the selector
     	does not have a playlist then we set the seconds. This
     	means that the current selector is an individual song
     	selector.
     */
				} else if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null && !currentSecondSelectors[i].hasAttribute('amplitude-playlist')) {
					currentSecondSelectors[i].innerHTML = seconds;
					/*
     	If nothing else matches, set the selector's inner HTML to '00'
     */
				} else {
					currentSecondSelectors[i].innerHTML = '00';
				}
			}
		}
	}

	/**
  * Resets the current seconds displays to 00
  *
  * @access public
  */
	function resetCurrentSeconds() {
		/*
  	Gets the seconds display elements
  */
		var secondSelectors = document.querySelectorAll('.amplitude-current-seconds');

		/*
  	Iterates over all of the seconds selectors and sets the inner HTML
  	to 00.
  */
		for (var i = 0; i < secondSelectors.length; i++) {
			secondSelectors[i].innerHTML = '00';
		}
	}

	/**
  * Updates any elements that display the current time for the song. This
  * is a computed field that will be commonly used.
  *
  * @access public
  * @param {object} currentTime 	- A json object conaining the parts for the current time for the song.
  */
	function syncCurrentTime(currentTime) {
		/*
  	Gets all of the song time selectors.
  */
		var timeSelectors = ['.amplitude-current-time[amplitude-main-current-time="true"]', '.amplitude-current-time[amplitude-playlist-main-current-time="' + _config2.default.active_playlist + '"]', '.amplitude-current-time[amplitude-song-index="' + _config2.default.active_index + '"]'];

		/*
  	Get all of the time selectors.
  */
		var currentTimeSelectors = document.querySelectorAll(timeSelectors.join());

		/*
  	Set the time selector's inner html to the current time for the song. The current
  	time is computed by joining minutes and seconds.
  */
		var timeText = currentTime.minutes + ':' + currentTime.seconds;
		if (currentTime.hours > 0) {
			timeText = currentTime.hours + ':' + timeText;
		}
		for (var i = 0, l = currentTimeSelectors.length; i < l; i++) {
			currentTimeSelectors[i].innerHTML = timeText;
		}
	}

	/**
  * Resets the current time displays to 00:00
  *
  * @access public
  */
	function resetCurrentTime() {
		/*
  	Gets the time selector display elements
  */
		var timeSelectors = document.querySelectorAll('.amplitude-current-time');

		/*
  	Iterates over all of the time selectors and sets the inner HTML
  	to 00.
  */
		for (var i = 0; i < timeSelectors.length; i++) {
			timeSelectors[i].innerHTML = '00:00';
		}
	}

	/**
  * Syncs the song played progress bars. These are HTML5 progress elements.
  *
  * @access private
  * @param {number} songPlayedPercentage  	- The percentage of the song that has been played.
  */
	function syncSongPlayedProgressBar(songPlayedPercentage) {
		syncMainSongPlayedProgressBars(songPlayedPercentage);
		syncPlaylistSongPlayedProgressBars(songPlayedPercentage);
		syncIndividualSongPlayedProgressBars(songPlayedPercentage);
	}

	/**
  * Sync how much has been played with a progress bar. This is the main progress bar.
  *
  * @access private
  * @param {number} songPlayedPercentage 	- The percent of the song completed.
  */
	function syncMainSongPlayedProgressBars(songPlayedPercentage) {
		/*
  	Ensure that the song completion percentage is a number
  */
		if (!isNaN(songPlayedPercentage)) {
			/*
   	Get all of the song progress bars
   */
			var songPlayedProgressBars = document.querySelectorAll('.amplitude-song-played-progress[amplitude-main-song-played-progress="true"]');

			for (var i = 0; i < songPlayedProgressBars.length; i++) {
				var max = songPlayedProgressBars[i].max;

				songPlayedProgressBars[i].value = songPlayedPercentage / 100 * max;
			}
		}
	}

	/**
  * Sync how much has been played with a progress bar. This is the playlist progress bar.
  *
  * @access public
  * @param {number} songPlayedPercentage 	- The percent of the song completed.
  */
	function syncPlaylistSongPlayedProgressBars(songPlayedPercentage) {
		/*
  	Ensure that the song completion percentage is a number
  */
		if (!isNaN(songPlayedPercentage)) {
			/*
   	Get all of the song progress bars
   */
			var songPlayedProgressBars = document.querySelectorAll('.amplitude-song-played-progress[amplitude-playlist-song-played-progress="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]');

			for (var i = 0; i < songPlayedProgressBars.length; i++) {
				var max = songPlayedProgressBars[i].max;

				songPlayedProgressBars[i].value = songPlayedPercentage / 100 * max;
			}
		}
	}

	/**
  * Sync how much has been played with a progress bar. This is for an individual song.
  *
  * @access private
  * @param {number} songPlayedPercentage 	- The percent of the song completed.
  */
	function syncIndividualSongPlayedProgressBars(songPlayedPercentage) {
		/*
  	Ensure that the song completion percentage is a number
  */
		if (!isNaN(songPlayedPercentage)) {
			/*
   	If the active playlist is not null, we get the individual song
   	played progress for the playlist.
   */
			if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null) {
				/*
    	Get all of the song progress bars
    */
				var songPlayedProgressBars = document.querySelectorAll('.amplitude-song-played-progress[amplitude-playlist="' + _config2.default.active_playlist + '"][amplitude-song-index="' + _config2.default.active_index + '"]');

				for (var i = 0; i < songPlayedProgressBars.length; i++) {
					var max = songPlayedProgressBars[i].max;

					songPlayedProgressBars[i].value = songPlayedPercentage / 100 * max;
				}
			} else {
				/*
    	Get all of the song progress bars
    */
				var _songPlayedProgressBars = document.querySelectorAll('.amplitude-song-played-progress[amplitude-song-index="' + _config2.default.active_index + '"]');

				for (var _i = 0; _i < _songPlayedProgressBars.length; _i++) {
					var _max = _songPlayedProgressBars[_i].max;

					_songPlayedProgressBars[_i].value = songPlayedPercentage / 100 * _max;
				}
			}
		}
	}

	/**
  * Sets an element to be playing by removing the 'amplitude-paused' class
  * and adding the 'amplitude-playing' class
  *
  * @access public
  * @param {element} element 	- The element getting the playing class added.
  */
	function setElementPlay(element) {
		element.classList.add('amplitude-playing');
		element.classList.remove('amplitude-paused');
	}

	/**
  * Sets an element to be paused by adding the 'amplitude-paused' class
  * and removing the 'amplitude-playing' class
  *
  * @access public
  * @param {element} element 	- The element getting the paused class added.
  */
	function setElementPause(element) {
		element.classList.remove('amplitude-playing');
		element.classList.add('amplitude-paused');
	}

	/**
  * Updates any elements that display the duration hour for the song.
  *
  * @access public
  * @param {number} hours 		- An integer conaining how many hours are in the song
  */
	function syncDurationHours(hours) {
		/*
  	Gets all of the song hour selectors.
  */
		var hourSelectors = [];

		if (_config2.default.active_playlist != null && _config2.default.active_playlist != '') {
			hourSelectors = ['.amplitude-duration-hours[amplitude-main-duration-hours="true"]', '.amplitude-duration-hours[amplitude-playlist-duration-hours="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]', '.amplitude-duration-hours[amplitude-song-index="' + _config2.default.active_index + '"]'];
		} else {
			hourSelectors = ['.amplitude-duration-hours[amplitude-main-duration-hours="true"]', '.amplitude-duration-hours[amplitude-song-index="' + _config2.default.active_index + '"]'];
		}

		/*
  	Ensures that there are some hour selectors.
  */
		if (document.querySelectorAll(hourSelectors.join()).length > 0) {
			/*
   	Get all of the hour selectors
   */
			var durationHourSelectors = document.querySelectorAll(hourSelectors.join());

			/*
   	Set the duration hour selector's inner html to hours passed in.
   */
			for (var i = 0; i < durationHourSelectors.length; i++) {
				/*
    	If the selector is a main selector, we set the hours.
    */
				if (durationHourSelectors[i].getAttribute('amplitude-main-duration-hours') == 'true') {
					durationHourSelectors[i].innerHTML = hours;
				} else {
					/*
     	If the active playlist is not null or empty
     	and the attribute of the playlist is equal to the
     	active playlist, then we set the inner html.
     */
					if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && durationHourSelectors[i].getAttribute('amplitude-playlist') == _config2.default.active_playlist) {
						durationHourSelectors[i].innerHTML = hours;
						/*
      	If the active playlist is not set and the selector
      	does not have a playlist then we set the hours. This
      	means that the duration selector is an individual song
      	selector.
      */
					} else if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null && !durationHourSelectors[i].hasAttribute('amplitude-playlist')) {
						durationHourSelectors[i].innerHTML = hours;
						/*
      	If nothing else matches, set the selector's inner HTML to '00'
      */
					} else {
						durationHourSelectors[i].innerHTML = '0';
					}
				}
			}
		}
	}

	/**
  * Updates any elements that display the duration minutes for the song.
  *
  * @access public
  * @param {number} minutes 	- An integer conaining how many minutes into the song.
  */
	function syncDurationMinutes(minutes) {
		/*
  	Gets all of the song minute selectors.
  */
		var minuteSelectors = [];

		if (_config2.default.active_playlist != null && _config2.default.active_playlist != '') {
			minuteSelectors = ['.amplitude-duration-minutes[amplitude-main-duration-minutes="true"]', '.amplitude-duration-minutes[amplitude-playlist-duration-minutes="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]', '.amplitude-duration-minutes[amplitude-song-index="' + _config2.default.active_index + '"]'];
		} else {
			minuteSelectors = ['.amplitude-duration-minutes[amplitude-main-duration-minutes="true"]', '.amplitude-duration-minutes[amplitude-song-index="' + _config2.default.active_index + '"]'];
		}

		/*
  	Get all of the minute selectors
  */
		var durationMinuteSelectors = document.querySelectorAll(minuteSelectors.join());

		/*
  	Set the duration minute selector's inner html to minutes passed in.
  */
		for (var i = 0; i < durationMinuteSelectors.length; i++) {
			/*
   	If the selector is a main selector, we set the seconds.
   */
			if (durationMinuteSelectors[i].getAttribute('amplitude-main-duration-minutes') == 'true') {
				durationMinuteSelectors[i].innerHTML = minutes;
			} else {
				/*
    	If the active playlist is not null or empty
    	and the attribute of the playlist is equal to the
    	active playlist, then we set the inner html.
    */
				if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && durationMinuteSelectors[i].getAttribute('amplitude-playlist') == _config2.default.active_playlist) {
					durationMinuteSelectors[i].innerHTML = minutes;
					/*
     	If the active playlist is not set and the selector
     	does not have a playlist then we set the minutes. This
     	means that the duration selector is an individual song
     	selector.
     */
				} else if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null && !durationMinuteSelectors[i].hasAttribute('amplitude-playlist')) {
					durationMinuteSelectors[i].innerHTML = minutes;
					/*
     	If nothing else matches, set the selector's inner HTML to '00'
     */
				} else {
					durationMinuteSelectors[i].innerHTML = '00';
				}
			}
		}
	}

	/**
  * Updates any elements that display the duration seconds for the song.
  *
  * @access private
  * @param {number} seconds 	- An integer conaining how many seconds into the song.
  */
	function syncDurationSeconds(seconds) {
		/*
  	Gets all of the song second selectors. If the active playlist
  	is not null, then we get the playlist selectors.
  */
		var secondSelectors = [];

		if (_config2.default.active_playlist != null && _config2.default.active_playlist != '') {
			secondSelectors = ['.amplitude-duration-seconds[amplitude-main-duration-seconds="true"]', '.amplitude-duration-seconds[amplitude-playlist-duration-seconds="true"][amplitude-playlist="' + _config2.default.active_playlist + '"]', '.amplitude-duration-seconds[amplitude-song-index="' + _config2.default.active_index + '"]'];
		} else {
			secondSelectors = ['.amplitude-duration-seconds[amplitude-main-duration-seconds="true"]', '.amplitude-duration-seconds[amplitude-song-index="' + _config2.default.active_index + '"]'];
		}

		/*
  	Get all of the second selectors
  */
		var durationSecondSelectors = document.querySelectorAll(secondSelectors.join());

		/*
  	Iterate over all of the second selectors.
  */
		for (var i = 0; i < durationSecondSelectors.length; i++) {
			/*
   	If the selector is a main selector, we set the seconds.
   */
			if (durationSecondSelectors[i].getAttribute('amplitude-main-duration-seconds') == 'true') {
				durationSecondSelectors[i].innerHTML = seconds;
			} else {
				/*
    	If the active playlist is not null or empty
    	and the attribute of the playlist is equal to the
    	active playlist, then we set the inner html.
    */
				if (_config2.default.active_playlist != '' && _config2.default.active_playlist != null && durationSecondSelectors[i].getAttribute('amplitude-playlist') == _config2.default.active_playlist) {
					durationSecondSelectors[i].innerHTML = seconds;
					/*
     	If the active playlist is not set and the selector
     	does not have a playlist then we set the seconds. This
     	means that the duration selector is an individual song
     	selector.
     */
				} else if (_config2.default.active_playlist == '' || _config2.default.active_playlist == null && !durationSecondSelectors[i].hasAttribute('amplitude-playlist')) {
					durationSecondSelectors[i].innerHTML = seconds;
					/*
     	If nothing else matches, set the selector's inner HTML to '00'
     */
				} else {
					durationSecondSelectors[i].innerHTML = '00';
				}
			}
		}
	}

	/**
  * Updates any elements that display the duration time for the song. This
  * is a computed field that will be commonly used.
  *
  * @access public
  * @param {object} durationTime 	- A json object conaining the parts for the duration time for the song.
  */
	function syncDurationTime(durationTime) {
		/*
  	Gets all of the song time selectors.
  */
		var timeSelectors = ['.amplitude-duration-time[amplitude-main-duration-time="true"]', '.amplitude-duration-time[amplitude-playlist-main-duration-time="' + _config2.default.active_playlist + '"]', '.amplitude-duration-time[amplitude-song-index="' + _config2.default.active_index + '"]'];

		/*
  	Get all of the time selectors.
  */
		var durationTimeSelectors = document.querySelectorAll(timeSelectors.join());

		/*
  	Set the time selector's inner html to the duration time for the song. The duration
  	time is computed by joining minutes and seconds.
  */
		var durationText = '00:00';
		if (!isNaN(durationTime.minutes) && !isNaN(durationTime.seconds)) {
			durationText = durationTime.minutes + ':' + durationTime.seconds;
			if (!isNaN(durationTime.hours) && durationTime.hours > 0) {
				durationText = durationTime.hours + ':' + durationText;
			}
		}
		for (var i = 0; i < durationTimeSelectors.length; i++) {
			durationTimeSelectors[i].innerHTML = durationText;
		}
	}

	/**
  * Updates the elements that show how much time is remaining in the song.
  *
  * @access public
  * @param {object} currentTime 	- A json object containing the parts for the current time for the song.
  * @param {object} durationTime - A json object conaining the parts for the duration time for the song.
  */
	function syncCountDownTime(currentTime, songDuration) {
		/*
  	Initialize time remaining.
  */
		var timeRemaining = '00:00';

		/*
  	Ensure that all values are defined.
  */
		if (currentTime != undefined && songDuration != undefined) {
			/*
   	Initialize the total current seconds and total duration seconds
   */
			var totalCurrentSeconds = parseInt(currentTime.seconds) + parseInt(currentTime.minutes) * 60 + parseInt(currentTime.hours) * 60 * 60;
			var totalDurationSeconds = parseInt(songDuration.seconds) + parseInt(songDuration.minutes) * 60 + parseInt(songDuration.hours) * 60 * 60;

			/*
   	If the two variables are numbers we continue the computing.
   */
			if (!isNaN(totalCurrentSeconds) && !isNaN(totalDurationSeconds)) {
				/*
    	Find the total remaining seconds.
    */
				var timeRemainingTotalSeconds = totalDurationSeconds - totalCurrentSeconds;

				var remainingHours = Math.floor(timeRemainingTotalSeconds / 3600);
				var remainingMinutes = Math.floor((timeRemainingTotalSeconds - remainingHours * 3600) / 60);
				var remainingSeconds = timeRemainingTotalSeconds - remainingHours * 3600 - remainingMinutes * 60;

				timeRemaining = (remainingMinutes < 10 ? '0' + remainingMinutes : remainingMinutes) + ':' + (remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds);

				if (remainingHours > 0) {
					timeRemaining = remainingHours + ':' + timeRemaining;
				}
			}
		}

		/*
  	Gets all of the song time selectors.
  */
		var timeSelectors = ['.amplitude-time-remaining[amplitude-main-time-remaining="true"]', '.amplitude-time-remaining[amplitude-playlist-main-time-remaining="' + _config2.default.active_playlist + '"]', '.amplitude-time-remaining[amplitude-song-index="' + _config2.default.active_index + '"]'];

		/*
  	Get all of the time selectors.
  */
		var timeRemainingSelectors = document.querySelectorAll(timeSelectors.join());

		/*
  	Set the time selector's inner html to the duration time for the song. The duration
  	time is computed by joining minutes and seconds.
  */
		for (var i = 0; i < timeRemainingSelectors.length; i++) {
			timeRemainingSelectors[i].innerHTML = timeRemaining;
		}
	}

	/*
 	Return the publically available functions.
 */
	return {
		syncCurrentHours: syncCurrentHours,
		syncCurrentMinutes: syncCurrentMinutes,
		syncCurrentSeconds: syncCurrentSeconds,
		syncCurrentTime: syncCurrentTime,
		resetCurrentHours: resetCurrentHours,
		resetCurrentMinutes: resetCurrentMinutes,
		resetCurrentSeconds: resetCurrentSeconds,
		resetCurrentTime: resetCurrentTime,
		syncSongPlayedProgressBar: syncSongPlayedProgressBar,
		setElementPlay: setElementPlay,
		setElementPause: setElementPause,
		syncDurationHours: syncDurationHours,
		syncDurationMinutes: syncDurationMinutes,
		syncDurationSeconds: syncDurationSeconds,
		syncDurationTime: syncDurationTime,
		syncCountDownTime: syncCountDownTime
	};
}(); /**
      * Imports the config module
      * @module config
      */
exports.default = AmplitudeVisualSyncHelpers;
module.exports = exports['default'];

/***/ })
/******/ ]);
});
},{}],16:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (h) {
  return function (nodeName) {
    var cache = {};
    return function (decls) {
      return function (attributes, children) {
        attributes = attributes || {};
        children = attributes.children || children;
        var nodeDecls = typeof decls == "function" ? decls(attributes) : decls;
        var key = JSON.stringify(nodeDecls);
        cache[key] || (cache[key] = createStyle(nodeDecls));
        attributes.class = [attributes.class, cache[key]].filter(Boolean).join(" ");
        return h(nodeName, attributes, children);
      };
    };
  };
};

exports.keyframes = keyframes;
var _id = 0;
var sheet = document.head.appendChild(document.createElement("style")).sheet;

function hyphenate(str) {
  return str.replace(/[A-Z]/g, "-$&").toLowerCase();
}

function insert(rule) {
  sheet.insertRule(rule, sheet.cssRules.length);
}
function createStyle(obj) {
  var id = "p" + _id++;
  parse(obj, "." + id).forEach(insert);
  return id;
}
function wrap(stringToWrap, wrapper) {
  return wrapper + "{" + stringToWrap + "}";
}

function parse(obj, classname, isInsideObj) {
  var arr = [""];
  isInsideObj = isInsideObj || 0;
  for (var prop in obj) {
    var value = obj[prop];
    prop = hyphenate(prop);
    // Same as typeof value === 'object', but smaller
    if (!value.sub) {
      if (/^(:|>|\.|\*)/.test(prop)) {
        prop = classname + prop;
      }
      // replace & in "&:hover", "p>&"
      prop = prop.replace(/&/g, classname);
      arr.push(wrap(parse(value, classname, 1 && !/^@/.test(prop)).join(""), prop));
    } else {
      arr[0] += prop + ":" + value + ";";
    }
  }
  if (!isInsideObj) {
    arr[0] = wrap(arr[0], classname);
  }
  return arr;
}
function keyframes(obj) {
  var id = "p" + _id++;
  insert(wrap(parse(obj, id, 1).join(""), "@keyframes " + id));
  return id;
}
},{}],78:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.__extends = __extends;
exports.__rest = __rest;
exports.__decorate = __decorate;
exports.__param = __param;
exports.__metadata = __metadata;
exports.__awaiter = __awaiter;
exports.__generator = __generator;
exports.__exportStar = __exportStar;
exports.__values = __values;
exports.__read = __read;
exports.__spread = __spread;
exports.__await = __await;
exports.__asyncGenerator = __asyncGenerator;
exports.__asyncDelegator = __asyncDelegator;
exports.__asyncValues = __asyncValues;
exports.__makeTemplateObject = __makeTemplateObject;
exports.__importStar = __importStar;
exports.__importDefault = __importDefault;
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
        d.__proto__ = b;
    } || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = exports.__assign = function () {
    exports.__assign = __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) {
        decorator(target, key, paramIndex);
    };
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function () {
            if (t[0] & 1) throw t[1];return t[1];
        }, trys: [], ops: [] },
        f,
        y,
        t,
        g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
        return this;
    }), g;
    function verb(n) {
        return function (v) {
            return step([n, v]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0:case 1:
                    t = op;break;
                case 4:
                    _.label++;return { value: op[1], done: false };
                case 5:
                    _.label++;y = op[1];op = [0];continue;
                case 7:
                    op = _.ops.pop();_.trys.pop();continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];t = op;break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];_.ops.push(op);break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [6, e];y = 0;
        } finally {
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []),
        i,
        q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () {
        return this;
    }, i;
    function verb(n) {
        if (g[n]) i[n] = function (v) {
            return new Promise(function (a, b) {
                q.push([n, v, a, b]) > 1 || resume(n, v);
            });
        };
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) {
        throw e;
    }), verb("return"), i[Symbol.iterator] = function () {
        return this;
    }, i;
    function verb(n, f) {
        i[n] = o[n] ? function (v) {
            return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v;
        } : f;
    }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator],
        i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () {
        return this;
    }, i);
    function verb(n) {
        i[n] = o[n] && function (v) {
            return new Promise(function (resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function (v) {
            resolve({ value: v, done: d });
        }, reject);
    }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) {
        Object.defineProperty(cooked, "raw", { value: raw });
    } else {
        cooked.raw = raw;
    }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
}
},{}],79:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var hasRAF = typeof window !== 'undefined' && window.requestAnimationFrame !== undefined;
var prevTime = 0;
var onNextFrame = hasRAF ? function (callback) {
    return window.requestAnimationFrame(callback);
} : function (callback) {
    var currentTime = Date.now();
    var timeToCall = Math.max(0, 16.7 - (currentTime - prevTime));
    prevTime = currentTime + timeToCall;
    setTimeout(function () {
        return callback(prevTime);
    }, timeToCall);
};

function createRenderStep(startRenderLoop) {
    var functionsToRun = [];
    var functionsToRunNextFrame = [];
    var numThisFrame = 0;
    var isProcessing = false;
    var i = 0;
    return {
        cancel: function (callback) {
            var indexOfCallback = functionsToRunNextFrame.indexOf(callback);
            if (indexOfCallback !== -1) {
                functionsToRunNextFrame.splice(indexOfCallback, 1);
            }
        },
        process: function () {
            isProcessing = true;
            _a = [functionsToRunNextFrame, functionsToRun], functionsToRun = _a[0], functionsToRunNextFrame = _a[1];
            functionsToRunNextFrame.length = 0;
            numThisFrame = functionsToRun.length;
            for (i = 0; i < numThisFrame; i++) {
                functionsToRun[i]();
            }
            isProcessing = false;
            var _a;
        },
        schedule: function (callback, immediate) {
            if (immediate === void 0) {
                immediate = false;
            }
            startRenderLoop();
            var addToCurrentBuffer = immediate && isProcessing;
            var buffer = addToCurrentBuffer ? functionsToRun : functionsToRunNextFrame;
            if (buffer.indexOf(callback) === -1) {
                buffer.push(callback);
                if (addToCurrentBuffer) {
                    numThisFrame = functionsToRun.length;
                }
            }
        }
    };
}

var HAS_PERFORMANCE_NOW = typeof performance !== 'undefined' && performance.now !== undefined;
var currentTime = HAS_PERFORMANCE_NOW ? function () {
    return performance.now();
} : function () {
    return Date.now();
};
var willRenderNextFrame = false;
var MAX_ELAPSED = 40;
var defaultElapsed = 16.7;
var useDefaultElapsed = true;
var currentFramestamp = 0;
var elapsed = 0;
function startRenderLoop() {
    if (willRenderNextFrame) return;
    willRenderNextFrame = true;
    useDefaultElapsed = true;
    onNextFrame(processFrame);
}
var frameStart = createRenderStep(startRenderLoop);
var frameUpdate = createRenderStep(startRenderLoop);
var frameRender = createRenderStep(startRenderLoop);
var frameEnd = createRenderStep(startRenderLoop);
function processFrame(framestamp) {
    willRenderNextFrame = false;
    elapsed = useDefaultElapsed ? defaultElapsed : Math.max(Math.min(framestamp - currentFramestamp, MAX_ELAPSED), 1);
    if (!useDefaultElapsed) defaultElapsed = elapsed;
    currentFramestamp = framestamp;
    frameStart.process();
    frameUpdate.process();
    frameRender.process();
    frameEnd.process();
    if (willRenderNextFrame) useDefaultElapsed = false;
}
var onFrameStart = frameStart.schedule;
var onFrameUpdate = frameUpdate.schedule;
var onFrameRender = frameRender.schedule;
var onFrameEnd = frameEnd.schedule;
var cancelOnFrameStart = frameStart.cancel;
var cancelOnFrameUpdate = frameUpdate.cancel;
var cancelOnFrameRender = frameRender.cancel;
var cancelOnFrameEnd = frameEnd.cancel;
var timeSinceLastFrame = function () {
    return elapsed;
};
var currentFrameTime = function () {
    return currentFramestamp;
};

exports.currentTime = currentTime;
exports.onFrameStart = onFrameStart;
exports.onFrameUpdate = onFrameUpdate;
exports.onFrameRender = onFrameRender;
exports.onFrameEnd = onFrameEnd;
exports.cancelOnFrameStart = cancelOnFrameStart;
exports.cancelOnFrameUpdate = cancelOnFrameUpdate;
exports.cancelOnFrameRender = cancelOnFrameRender;
exports.cancelOnFrameEnd = cancelOnFrameEnd;
exports.timeSinceLastFrame = timeSinceLastFrame;
exports.currentFrameTime = currentFrameTime;
},{}],80:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function () {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var clamp = function (min, max) {
    return function (v) {
        return Math.max(Math.min(v, max), min);
    };
};
var contains = function (term) {
    return function (v) {
        return typeof v === 'string' && v.indexOf(term) !== -1;
    };
};
var isFirstChars = function (term) {
    return function (v) {
        return typeof v === 'string' && v.indexOf(term) === 0;
    };
};
var getValueFromFunctionString = function (value) {
    return value.substring(value.indexOf('(') + 1, value.lastIndexOf(')'));
};
var splitCommaDelimited = function (value) {
    return typeof value === 'string' ? value.split(/,\s*/) : [value];
};

var number = {
    test: function (v) {
        return typeof v === 'number';
    },
    parse: parseFloat,
    transform: function (v) {
        return v;
    }
};
var alpha = __assign({}, number, { transform: clamp(0, 1) });
var scale = __assign({}, number, { default: 1 });

var createUnitType = function (unit) {
    var containsUnit = contains(unit);
    return {
        test: function (v) {
            return typeof v === 'string' && containsUnit(v) && v.split(' ').length === 1;
        },
        parse: parseFloat,
        transform: function (v) {
            return "" + v + unit;
        }
    };
};
var degrees = createUnitType('deg');
var percent = createUnitType('%');
var px = createUnitType('px');
var vh = createUnitType('vh');
var vw = createUnitType('vw');

var clampRgbUnit = clamp(0, 255);
var onlyColorRegex = /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))$/i;
var isRgba = function (v) {
    return v.red !== undefined;
};
var isHsla = function (v) {
    return v.hue !== undefined;
};
var splitColorValues = function (terms) {
    var numTerms = terms.length;
    return function (v) {
        if (typeof v !== 'string') return v;
        var values = {};
        var valuesArray = splitCommaDelimited(getValueFromFunctionString(v));
        for (var i = 0; i < numTerms; i++) {
            values[terms[i]] = valuesArray[i] !== undefined ? parseFloat(valuesArray[i]) : 1;
        }
        return values;
    };
};
var rgbaTemplate = function (_a) {
    var red = _a.red,
        green = _a.green,
        blue = _a.blue,
        _b = _a.alpha,
        alpha$$1 = _b === void 0 ? 1 : _b;
    return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha$$1 + ")";
};
var hslaTemplate = function (_a) {
    var hue = _a.hue,
        saturation = _a.saturation,
        lightness = _a.lightness,
        _b = _a.alpha,
        alpha$$1 = _b === void 0 ? 1 : _b;
    return "hsla(" + hue + ", " + saturation + ", " + lightness + ", " + alpha$$1 + ")";
};
var rgbUnit = __assign({}, number, { transform: function (v) {
        return Math.round(clampRgbUnit(v));
    } });
var testRgbaString = isFirstChars('rgb');
var rgba = {
    test: function (v) {
        return typeof v === 'string' ? testRgbaString(v) : isRgba(v);
    },
    parse: splitColorValues(['red', 'green', 'blue', 'alpha']),
    transform: function (_a) {
        var red = _a.red,
            green = _a.green,
            blue = _a.blue,
            alpha$$1 = _a.alpha;
        return rgbaTemplate({
            red: rgbUnit.transform(red),
            green: rgbUnit.transform(green),
            blue: rgbUnit.transform(blue),
            alpha: alpha$$1
        });
    }
};
var testHslaString = isFirstChars('hsl');
var hsla = {
    test: function (v) {
        return typeof v === 'string' ? testHslaString(v) : isHsla(v);
    },
    parse: splitColorValues(['hue', 'saturation', 'lightness', 'alpha']),
    transform: function (_a) {
        var hue = _a.hue,
            saturation = _a.saturation,
            lightness = _a.lightness,
            alpha$$1 = _a.alpha;
        return hslaTemplate({
            hue: Math.round(hue),
            saturation: percent.transform(saturation),
            lightness: percent.transform(lightness),
            alpha: alpha$$1
        });
    }
};
var hex = __assign({}, rgba, { test: isFirstChars('#'), parse: function (v) {
        var r = '';
        var g = '';
        var b = '';
        if (v.length > 4) {
            r = v.substr(1, 2);
            g = v.substr(3, 2);
            b = v.substr(5, 2);
        } else {
            r = v.substr(1, 1);
            g = v.substr(2, 1);
            b = v.substr(3, 1);
            r += r;
            g += g;
            b += b;
        }
        return {
            red: parseInt(r, 16),
            green: parseInt(g, 16),
            blue: parseInt(b, 16),
            alpha: 1
        };
    } });
var color = {
    test: function (v) {
        return typeof v === 'string' && onlyColorRegex.test(v) || rgba.test(v) || hsla.test(v) || hex.test(v);
    },
    parse: function (v) {
        if (rgba.test(v)) {
            return rgba.parse(v);
        } else if (hsla.test(v)) {
            return hsla.parse(v);
        } else if (hex.test(v)) {
            return hex.parse(v);
        }
        return v;
    },
    transform: function (v) {
        if (isRgba(v)) {
            return rgba.transform(v);
        } else if (isHsla(v)) {
            return hsla.transform(v);
        }
        return v;
    }
};

var floatRegex = /(-)?(\d[\d\.]*)/g;
var colorRegex = /(#[0-9a-f]{6}|#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi;
var COLOR_TOKEN = '${c}';
var NUMBER_TOKEN = '${n}';
var complex = {
    test: function (v) {
        if (typeof v !== 'string') return false;
        var numValues = 0;
        var foundNumbers = v.match(floatRegex);
        var foundColors = v.match(colorRegex);
        if (foundNumbers) numValues += foundNumbers.length;
        if (foundColors) numValues += foundColors.length;
        return numValues > 1;
    },
    parse: function (v) {
        var input = v;
        var parsed = [];
        var foundColors = input.match(colorRegex);
        if (foundColors) {
            input = input.replace(colorRegex, COLOR_TOKEN);
            parsed.push.apply(parsed, foundColors.map(color.parse));
        }
        var foundNumbers = input.match(floatRegex);
        if (foundNumbers) {
            parsed.push.apply(parsed, foundNumbers.map(number.parse));
        }
        return parsed;
    },
    createTransformer: function (prop) {
        var template = prop;
        var token = 0;
        var foundColors = prop.match(colorRegex);
        var numColors = foundColors ? foundColors.length : 0;
        if (foundColors) {
            for (var i = 0; i < numColors; i++) {
                template = template.replace(foundColors[i], COLOR_TOKEN);
                token++;
            }
        }
        var foundNumbers = template.match(floatRegex);
        var numNumbers = foundNumbers ? foundNumbers.length : 0;
        if (foundNumbers) {
            for (var i = 0; i < numNumbers; i++) {
                template = template.replace(foundNumbers[i], NUMBER_TOKEN);
                token++;
            }
        }
        return function (v) {
            var output = template;
            for (var i = 0; i < token; i++) {
                output = output.replace(i < numColors ? COLOR_TOKEN : NUMBER_TOKEN, i < numColors ? color.transform(v[i]) : v[i]);
            }
            return output;
        };
    }
};

exports.number = number;
exports.scale = scale;
exports.alpha = alpha;
exports.degrees = degrees;
exports.percent = percent;
exports.px = px;
exports.vw = vw;
exports.vh = vh;
exports.rgba = rgba;
exports.rgbUnit = rgbUnit;
exports.hex = hex;
exports.hsla = hsla;
exports.color = color;
exports.complex = complex;
},{}],81:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var HEY_LISTEN = 'Hey, listen! ';
var warning = function () {};
var invariant = function () {};
if ('development' !== 'production') {
    exports.warning = warning = function (check, message) {
        if (!check && typeof console !== 'undefined') {
            console.warn(HEY_LISTEN + message);
        }
    };
    exports.invariant = invariant = function (check, message) {
        if (!check) {
            throw new Error(HEY_LISTEN.toUpperCase() + message);
        }
    };
}

exports.warning = warning;
exports.invariant = invariant;
},{}],82:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.buildStyles = exports.createStylerFactory = undefined;

var _framesync = require('framesync');

var _styleValueTypes = require('style-value-types');

var _tslib = require('tslib');

var _heyListen = require('hey-listen');

var createStyler = function (_a) {
    var onRead = _a.onRead,
        onRender = _a.onRender,
        _b = _a.aliasMap,
        aliasMap = _b === void 0 ? {} : _b,
        _c = _a.useCache,
        useCache = _c === void 0 ? true : _c;
    return function (props) {
        var state = {};
        var changedValues = [];
        var hasChanged = false;
        var setValue = function (unmappedKey, value) {
            var key = aliasMap[unmappedKey] || unmappedKey;
            var currentValue = state[key];
            state[key] = value;
            if (state[key] !== currentValue) {
                if (changedValues.indexOf(key) === -1) {
                    changedValues.push(key);
                }
                if (!hasChanged) {
                    hasChanged = true;
                    (0, _framesync.onFrameRender)(render);
                }
            }
        };
        function render(forceRender) {
            if (forceRender === void 0) {
                forceRender = false;
            }
            if (forceRender || hasChanged) {
                onRender(state, props, changedValues);
                hasChanged = false;
                changedValues.length = 0;
            }
            return this;
        }
        return {
            get: function (unmappedKey) {
                var key = aliasMap[unmappedKey] || unmappedKey;
                return key ? useCache && state[key] !== undefined ? state[key] : onRead(key, props) : state;
            },
            set: function (values, value) {
                if (typeof values === 'string') {
                    if (value !== undefined) {
                        setValue(values, value);
                    } else {
                        return function (v) {
                            return setValue(values, v);
                        };
                    }
                } else {
                    for (var key in values) {
                        if (values.hasOwnProperty(key)) {
                            setValue(key, values[key]);
                        }
                    }
                }
                return this;
            },
            render: render
        };
    };
};

var CAMEL_CASE_PATTERN = /([a-z])([A-Z])/g;
var REPLACE_TEMPLATE = '$1-$2';
var camelToDash = function (str) {
    return str.replace(CAMEL_CASE_PATTERN, REPLACE_TEMPLATE).toLowerCase();
};
var setDomAttrs = function (element, attrs) {
    for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            element.setAttribute(key, attrs[key]);
        }
    }
};

var camelCache = /*#__PURE__*/new Map();
var dashCache = /*#__PURE__*/new Map();
var prefixes = ['Webkit', 'Moz', 'O', 'ms', ''];
var numPrefixes = prefixes.length;
var testElement;
var testPrefix = function (key) {
    if (typeof document === 'undefined') return;
    testElement = testElement || document.createElement('div');
    for (var i = 0; i < numPrefixes; i++) {
        var prefix = prefixes[i];
        var noPrefix = prefix === '';
        var prefixedPropertyName = noPrefix ? key : prefix + key.charAt(0).toUpperCase() + key.slice(1);
        if (prefixedPropertyName in testElement.style) {
            camelCache.set(key, prefixedPropertyName);
            dashCache.set(key, "" + (noPrefix ? '' : '-') + camelToDash(prefixedPropertyName));
        }
    }
};
var prefixer = function (key, asDashCase) {
    if (asDashCase === void 0) {
        asDashCase = false;
    }
    var cache = asDashCase ? dashCache : camelCache;
    if (!cache.has(key)) testPrefix(key);
    return cache.get(key) || key;
};

var axes = ['', 'X', 'Y', 'Z'];
var order = ['translate', 'scale', 'rotate', 'skew', 'transformPerspective'];
var TRANSFORM_ORIGIN_X = 'transformOriginX';
var TRANSFORM_ORIGIN_Y = 'transformOriginY';
var transformProps = /*#__PURE__*/order.reduce(function (acc, key) {
    return axes.reduce(function (axesAcc, axesKey) {
        axesAcc.push(key + axesKey);
        return axesAcc;
    }, acc);
}, ['x', 'y', 'z']);
var transformPropDictionary = /*#__PURE__*/transformProps.reduce(function (dict, key) {
    dict[key] = true;
    return dict;
}, {});
var isTransformProp = function (key) {
    return transformPropDictionary[key] === true;
};
var sortTransformProps = function (a, b) {
    return transformProps.indexOf(a) - transformProps.indexOf(b);
};
var isTransformOriginProp = function (key) {
    return key === TRANSFORM_ORIGIN_X || key === TRANSFORM_ORIGIN_Y;
};

var valueTypes = {
    color: _styleValueTypes.color,
    backgroundColor: _styleValueTypes.color,
    outlineColor: _styleValueTypes.color,
    fill: _styleValueTypes.color,
    stroke: _styleValueTypes.color,
    borderColor: _styleValueTypes.color,
    borderTopColor: _styleValueTypes.color,
    borderRightColor: _styleValueTypes.color,
    borderBottomColor: _styleValueTypes.color,
    borderLeftColor: _styleValueTypes.color,
    borderRadius: _styleValueTypes.px,
    width: _styleValueTypes.px,
    maxWidth: _styleValueTypes.px,
    height: _styleValueTypes.px,
    maxHeight: _styleValueTypes.px,
    top: _styleValueTypes.px,
    left: _styleValueTypes.px,
    bottom: _styleValueTypes.px,
    right: _styleValueTypes.px,
    rotate: _styleValueTypes.degrees,
    rotateX: _styleValueTypes.degrees,
    rotateY: _styleValueTypes.degrees,
    rotateZ: _styleValueTypes.degrees,
    scale: _styleValueTypes.scale,
    scaleX: _styleValueTypes.scale,
    scaleY: _styleValueTypes.scale,
    scaleZ: _styleValueTypes.scale,
    skewX: _styleValueTypes.degrees,
    skewY: _styleValueTypes.degrees,
    distance: _styleValueTypes.px,
    translateX: _styleValueTypes.px,
    translateY: _styleValueTypes.px,
    translateZ: _styleValueTypes.px,
    perspective: _styleValueTypes.px,
    opacity: _styleValueTypes.alpha,
    transformOriginX: _styleValueTypes.percent,
    transformOriginY: _styleValueTypes.percent,
    transformOriginZ: _styleValueTypes.px
};
var getValueType = function (key) {
    return valueTypes[key];
};

var aliasMap = {
    x: 'translateX',
    y: 'translateY',
    z: 'translateZ',
    originX: 'transformOriginX',
    originY: 'transformOriginY',
    originZ: 'transformOriginZ'
};
var NUMBER = 'number';
var OBJECT = 'object';
var COLON = ':';
var SEMI_COLON = ';';
var TRANSFORM_ORIGIN = 'transform-origin';
var TRANSFORM = 'transform';
var TRANSLATE_Z = 'translateZ';
var TRANSFORM_NONE = ';transform: none';
var styleRule = function (key, value) {
    return "" + SEMI_COLON + key + COLON + value;
};
function buildStylePropertyString(state, changedValues, enableHardwareAcceleration, blacklist) {
    if (changedValues === void 0) {
        changedValues = true;
    }
    if (enableHardwareAcceleration === void 0) {
        enableHardwareAcceleration = true;
    }
    var valuesToChange = changedValues === true ? Object.keys(state) : changedValues;
    var propertyString = '';
    var transformString = '';
    var hasTransformOrigin = false;
    var transformIsDefault = true;
    var hasTransform = false;
    var transformHasZ = false;
    var numChangedValues = valuesToChange.length;
    for (var i = 0; i < numChangedValues; i++) {
        var key = valuesToChange[i];
        if (isTransformProp(key)) {
            hasTransform = true;
            for (var stateKey in state) {
                if (isTransformProp(stateKey) && valuesToChange.indexOf(stateKey) === -1) {
                    valuesToChange.push(stateKey);
                }
            }
            break;
        }
    }
    valuesToChange.sort(sortTransformProps);
    var totalNumChangedValues = valuesToChange.length;
    for (var i = 0; i < totalNumChangedValues; i++) {
        var key = valuesToChange[i];
        if (blacklist.has(key)) continue;
        var isTransformKey = isTransformProp(key);
        var value = state[key];
        var valueType = getValueType(key);
        if (isTransformKey) {
            if (valueType.default && value !== valueType.default || !valueType.default && value !== 0) {
                transformIsDefault = false;
            }
        }
        if (valueType && (typeof value === NUMBER || typeof value === OBJECT) && valueType.transform) {
            value = valueType.transform(value);
        }
        if (isTransformKey) {
            transformString += key + '(' + value + ') ';
            transformHasZ = key === TRANSLATE_Z ? true : transformHasZ;
        } else if (isTransformOriginProp(key)) {
            state[key] = value;
            hasTransformOrigin = true;
        } else {
            propertyString += styleRule(prefixer(key, true), value);
        }
    }
    if (hasTransformOrigin) {
        propertyString += styleRule(TRANSFORM_ORIGIN, (state.transformOriginX || 0) + " " + (state.transformOriginY || 0) + " " + (state.transformOriginZ || 0));
    }
    if (hasTransform) {
        if (!transformHasZ && enableHardwareAcceleration) {
            transformString += TRANSLATE_Z + "(0)";
        }
        propertyString += styleRule(TRANSFORM, transformIsDefault ? TRANSFORM_NONE : transformString);
    }
    return propertyString;
}

var SCROLL_LEFT = 'scrollLeft';
var SCROLL_TOP = 'scrollTop';
var scrollValues = /*#__PURE__*/new Set([SCROLL_LEFT, SCROLL_TOP]);
var cssStyler = /*#__PURE__*/createStyler({
    onRead: function (key, _a) {
        var element = _a.element,
            preparseOutput = _a.preparseOutput;
        var valueType = getValueType(key);
        if (isTransformProp(key)) {
            return valueType ? valueType.default || 0 : 0;
        } else if (scrollValues.has(key)) {
            return element[key];
        } else {
            var domValue = window.getComputedStyle(element, null).getPropertyValue(prefixer(key, true)) || 0;
            return preparseOutput && valueType && valueType.parse ? valueType.parse(domValue) : domValue;
        }
    },
    onRender: function (state, _a, changedValues) {
        var element = _a.element,
            enableHardwareAcceleration = _a.enableHardwareAcceleration;
        element.style.cssText += buildStylePropertyString(state, changedValues, enableHardwareAcceleration, scrollValues);
        if (changedValues.indexOf(SCROLL_LEFT) !== -1) element.scrollLeft = state.scrollLeft;
        if (changedValues.indexOf(SCROLL_TOP) !== -1) element.scrollTop = state.scrollTop;
    },
    aliasMap: aliasMap,
    uncachedValues: scrollValues
});
var css = function (element, props) {
    return cssStyler((0, _tslib.__assign)({ element: element, enableHardwareAcceleration: true, preparseOutput: true }, props));
};

var ZERO_NOT_ZERO = 0.0000001;
var percentToPixels = function (percent$$1, length) {
    return percent$$1 / 100 * length + 'px';
};
var build = function (state, dimensions, isPath, pathLength) {
    var hasTransform = false;
    var hasDashArray = false;
    var props = {};
    var dashArrayStyles = isPath ? {
        pathLength: '0',
        pathSpacing: "" + pathLength
    } : undefined;
    var scale$$1 = state.scale !== undefined ? state.scale || ZERO_NOT_ZERO : state.scaleX || 1;
    var scaleY = state.scaleY !== undefined ? state.scaleY || ZERO_NOT_ZERO : scale$$1 || 1;
    var transformOriginX = dimensions.width * ((state.originX || 50) / 100) + dimensions.x;
    var transformOriginY = dimensions.height * ((state.originY || 50) / 100) + dimensions.y;
    var scaleTransformX = -transformOriginX * (scale$$1 * 1);
    var scaleTransformY = -transformOriginY * (scaleY * 1);
    var scaleReplaceX = transformOriginX / scale$$1;
    var scaleReplaceY = transformOriginY / scaleY;
    var transform = {
        translate: "translate(" + state.translateX + ", " + state.translateY + ") ",
        scale: "translate(" + scaleTransformX + ", " + scaleTransformY + ") scale(" + scale$$1 + ", " + scaleY + ") translate(" + scaleReplaceX + ", " + scaleReplaceY + ") ",
        rotate: "rotate(" + state.rotate + ", " + transformOriginX + ", " + transformOriginY + ") ",
        skewX: "skewX(" + state.skewX + ") ",
        skewY: "skewY(" + state.skewY + ") "
    };
    for (var key in state) {
        if (state.hasOwnProperty(key)) {
            var value = state[key];
            if (isTransformProp(key)) {
                hasTransform = true;
            } else if (isPath && (key === 'pathLength' || key === 'pathSpacing') && typeof value === 'number') {
                hasDashArray = true;
                dashArrayStyles[key] = percentToPixels(value, pathLength);
            } else if (isPath && key === 'pathOffset') {
                props['stroke-dashoffset'] = percentToPixels(-value, pathLength);
            } else {
                props[camelToDash(key)] = value;
            }
        }
    }
    if (hasDashArray) {
        props['stroke-dasharray'] = dashArrayStyles.pathLength + ' ' + dashArrayStyles.pathSpacing;
    }
    if (hasTransform) {
        props.transform = '';
        for (var key in transform) {
            if (transform.hasOwnProperty(key)) {
                var defaultValue = key === 'scale' ? '1' : '0';
                props.transform += transform[key].replace(/undefined/g, defaultValue);
            }
        }
    }
    return props;
};

var valueTypes$1 = {
    fill: _styleValueTypes.color,
    stroke: _styleValueTypes.color,
    scale: _styleValueTypes.scale,
    scaleX: _styleValueTypes.scale,
    scaleY: _styleValueTypes.scale,
    opacity: _styleValueTypes.alpha,
    fillOpacity: _styleValueTypes.alpha,
    strokeOpacity: _styleValueTypes.alpha
};
var getValueType$1 = function (key) {
    return valueTypes$1[key];
};

var svgStyler = /*#__PURE__*/createStyler({
    onRead: function (key, _a) {
        var element = _a.element;
        if (!isTransformProp(key)) {
            return element.getAttribute(key);
        } else {
            var valueType = getValueType$1(key);
            return valueType ? valueType.default : 0;
        }
    },
    onRender: function (state, _a, changedValues) {
        var dimensions = _a.dimensions,
            element = _a.element,
            isPath = _a.isPath,
            pathLength = _a.pathLength;
        setDomAttrs(element, build(state, dimensions, isPath, pathLength));
    },
    aliasMap: {
        x: 'translateX',
        y: 'translateY',
        background: 'fill'
    }
});
var svg = function (element) {
    var _a = element.getBBox(),
        x = _a.x,
        y = _a.y,
        width = _a.width,
        height = _a.height;
    var props = {
        element: element,
        dimensions: { x: x, y: y, width: width, height: height },
        isPath: false
    };
    if (element.tagName === 'path') {
        props.isPath = true;
        props.pathLength = element.getTotalLength();
    }
    return svgStyler(props);
};

var viewport = /*#__PURE__*/createStyler({
    useCache: false,
    onRead: function (key) {
        return key === 'scrollTop' ? window.pageYOffset : window.pageXOffset;
    },
    onRender: function (_a) {
        var _b = _a.scrollTop,
            scrollTop = _b === void 0 ? 0 : _b,
            _c = _a.scrollLeft,
            scrollLeft = _c === void 0 ? 0 : _c;
        return window.scrollTo(scrollLeft, scrollTop);
    }
});

var cache = /*#__PURE__*/new WeakMap();
var createDOMStyler = function (node, props) {
    var styler;
    if (node instanceof HTMLElement) {
        styler = css(node, props);
    } else if (node instanceof SVGElement) {
        styler = svg(node);
    } else if (typeof window !== 'undefined' && node === window) {
        styler = viewport(node);
    }
    (0, _heyListen.invariant)(styler !== undefined, 'No valid node provided. Node must be HTMLElement, SVGElement or window.');
    cache.set(node, styler);
    return styler;
};
var getStyler = function (node, props) {
    return cache.has(node) ? cache.get(node) : createDOMStyler(node, props);
};
function index(nodeOrSelector, props) {
    var node = typeof nodeOrSelector === 'string' ? document.querySelector(nodeOrSelector) : nodeOrSelector;
    return getStyler(node, props);
}

exports.default = index;
exports.createStylerFactory = createStyler;
exports.buildStyles = buildStylePropertyString;
},{"framesync":79,"style-value-types":80,"tslib":78,"hey-listen":81}],29:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ValueReaction = exports.Action = exports.svg = exports.css = exports.transform = exports.easing = exports.calc = exports.stagger = exports.schedule = exports.parallel = exports.merge = exports.delay = exports.crossfade = exports.composite = exports.chain = exports.multitouch = exports.mouse = exports.pointer = exports.listen = exports.tween = exports.timeline = exports.spring = exports.physics = exports.everyFrame = exports.keyframes = exports.decay = exports.value = exports.multicast = exports.action = exports.styler = exports.valueTypes = undefined;

var _stylefire = require('stylefire');

Object.defineProperty(exports, 'styler', {
    enumerable: true,
    get: function () {
        return _interopRequireDefault(_stylefire).default;
    }
});

var _tslib = require('tslib');

var _framesync = require('framesync');

var _styleValueTypes = require('style-value-types');

var styleValueTypes = _interopRequireWildcard(_styleValueTypes);

var _heyListen = require('hey-listen');

var _stylefire2 = _interopRequireDefault(_stylefire);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.valueTypes = styleValueTypes;


var isNum = function (v) {
    return typeof v === 'number';
};
var isPoint = function (point) {
    return point.x !== undefined && point.y !== undefined;
};
var isPoint3D = function (point) {
    return point.z !== undefined;
};
var toDecimal = function (num, precision) {
    if (precision === void 0) {
        precision = 2;
    }
    precision = Math.pow(10, precision);
    return Math.round(num * precision) / precision;
};
var ZERO_POINT = {
    x: 0,
    y: 0,
    z: 0
};
var distance1D = function (a, b) {
    return Math.abs(a - b);
};
var angle = function (a, b) {
    if (b === void 0) {
        b = ZERO_POINT;
    }
    return radiansToDegrees(Math.atan2(b.y - a.y, b.x - a.x));
};
var degreesToRadians = function (degrees$$1) {
    return degrees$$1 * Math.PI / 180;
};
var dilate = function (a, b, dilation) {
    return a + (b - a) * dilation;
};
var distance = function (a, b) {
    if (b === void 0) {
        b = ZERO_POINT;
    }
    if (isNum(a) && isNum(b)) {
        return distance1D(a, b);
    } else if (isPoint(a) && isPoint(b)) {
        var xDelta = distance1D(a.x, b.x);
        var yDelta = distance1D(a.y, b.y);
        var zDelta = isPoint3D(a) && isPoint3D(b) ? distance1D(a.z, b.z) : 0;
        return Math.sqrt(Math.pow(xDelta, 2) + Math.pow(yDelta, 2) + Math.pow(zDelta, 2));
    }
    return 0;
};
var getProgressFromValue = function (from, to, value) {
    var toFromDifference = to - from;
    return toFromDifference === 0 ? 1 : (value - from) / toFromDifference;
};
var getValueFromProgress = function (from, to, progress) {
    return -progress * from + progress * to + from;
};
var pointFromAngleAndDistance = function (origin, angle, distance) {
    angle = degreesToRadians(angle);
    return {
        x: distance * Math.cos(angle) + origin.x,
        y: distance * Math.sin(angle) + origin.y
    };
};
var radiansToDegrees = function (radians) {
    return radians * 180 / Math.PI;
};
var smooth = function (newValue, oldValue, duration, smoothing) {
    if (smoothing === void 0) {
        smoothing = 0;
    }
    return toDecimal(oldValue + duration * (newValue - oldValue) / Math.max(smoothing, duration));
};
var speedPerFrame = function (xps, frameDuration) {
    return isNum(xps) ? xps / (1000 / frameDuration) : 0;
};
var speedPerSecond = function (velocity, frameDuration) {
    return frameDuration ? velocity * (1000 / frameDuration) : 0;
};
var stepProgress = function (steps, progress) {
    var segment = 1 / (steps - 1);
    var target = 1 - 1 / steps;
    var progressOfTarget = Math.min(progress / target, 1);
    return Math.floor(progressOfTarget / segment) * segment;
};

var calc = /*#__PURE__*/Object.freeze({
    isPoint: isPoint,
    isPoint3D: isPoint3D,
    angle: angle,
    degreesToRadians: degreesToRadians,
    dilate: dilate,
    distance: distance,
    getProgressFromValue: getProgressFromValue,
    getValueFromProgress: getValueFromProgress,
    pointFromAngleAndDistance: pointFromAngleAndDistance,
    radiansToDegrees: radiansToDegrees,
    smooth: smooth,
    speedPerFrame: speedPerFrame,
    speedPerSecond: speedPerSecond,
    stepProgress: stepProgress
});

var noop = function (v) {
    return v;
};
var appendUnit = function (unit) {
    return function (v) {
        return "" + v + unit;
    };
};
var applyOffset = function (from, to) {
    var hasReceivedFrom = true;
    if (to === undefined) {
        to = from;
        hasReceivedFrom = false;
    }
    var getOffset = function (v) {
        return v - from;
    };
    var applyOffsetTo = function (v) {
        return v + to;
    };
    return function (v) {
        if (hasReceivedFrom) {
            return applyOffsetTo(getOffset(v));
        } else {
            from = v;
            hasReceivedFrom = true;
            return to;
        }
    };
};
var blend = function (from, to, v) {
    var fromExpo = from * from;
    var toExpo = to * to;
    return Math.sqrt(v * (toExpo - fromExpo) + fromExpo);
};
var blendColor = function (from, to) {
    var fromColor = typeof from === 'string' ? _styleValueTypes.color.parse(from) : from;
    var toColor = typeof to === 'string' ? _styleValueTypes.color.parse(to) : to;
    var blended = (0, _tslib.__assign)({}, fromColor);
    var blendFunc = from.hue !== undefined || typeof from === 'string' && _styleValueTypes.hsla.test(from) ? getValueFromProgress : blend;
    return function (v) {
        blended = (0, _tslib.__assign)({}, blended);
        for (var key in blended) {
            if (key !== 'alpha' && blended.hasOwnProperty(key)) {
                blended[key] = blendFunc(fromColor[key], toColor[key], v);
            }
        }
        blended.alpha = getValueFromProgress(fromColor.alpha, toColor.alpha, v);
        return blended;
    };
};
var blendArray = function (from, to) {
    var output = from.slice();
    var numValues = output.length;
    var blendValue = from.map(function (fromThis, i) {
        var toThis = to[i];
        return typeof fromThis === 'number' ? function (v) {
            return getValueFromProgress(fromThis, toThis, v);
        } : blendColor(fromThis, toThis);
    });
    return function (v) {
        for (var i = 0; i < numValues; i++) {
            output[i] = blendValue[i](v);
        }
        return output;
    };
};
var clamp = function (min, max) {
    return function (v) {
        return Math.min(Math.max(v, min), max);
    };
};
var combineFunctions = function (a, b) {
    return function (v) {
        return b(a(v));
    };
};
var pipe = function () {
    var transformers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        transformers[_i] = arguments[_i];
    }
    return transformers.reduce(combineFunctions);
};
var conditional = function (check, apply) {
    return function (v) {
        return check(v) ? apply(v) : v;
    };
};
var slowInterpolate = function (input, output, rangeLength, rangeEasing) {
    var finalIndex = rangeLength - 1;
    if (input[0] > input[finalIndex]) {
        input.reverse();
        output.reverse();
    }
    return function (v) {
        if (v <= input[0]) {
            return output[0];
        }
        if (v >= input[finalIndex]) {
            return output[finalIndex];
        }
        var i = 1;
        for (; i < rangeLength; i++) {
            if (input[i] > v || i === finalIndex) {
                break;
            }
        }
        var progressInRange = getProgressFromValue(input[i - 1], input[i], v);
        var easedProgress = rangeEasing ? rangeEasing[i - 1](progressInRange) : progressInRange;
        return getValueFromProgress(output[i - 1], output[i], easedProgress);
    };
};
var fastInterpolate = function (minA, maxA, minB, maxB) {
    return function (v) {
        return (v - minA) * (maxB - minB) / (maxA - minA) + minB;
    };
};
var interpolate = function (input, output, rangeEasing) {
    var rangeLength = input.length;
    return rangeLength !== 2 ? slowInterpolate(input, output, rangeLength, rangeEasing) : fastInterpolate(input[0], input[1], output[0], output[1]);
};
var generateStaticSpring = function (alterDisplacement) {
    if (alterDisplacement === void 0) {
        alterDisplacement = noop;
    }
    return function (constant, origin) {
        return function (v) {
            var displacement = origin - v;
            var springModifiedDisplacement = -constant * (0 - alterDisplacement(Math.abs(displacement)));
            return displacement <= 0 ? origin + springModifiedDisplacement : origin - springModifiedDisplacement;
        };
    };
};
var linearSpring = /*#__PURE__*/generateStaticSpring();
var nonlinearSpring = /*#__PURE__*/generateStaticSpring(Math.sqrt);
var wrap = function (min, max) {
    return function (v) {
        var rangeSize = max - min;
        return ((v - min) % rangeSize + rangeSize) % rangeSize + min;
    };
};
var smooth$1 = function (strength) {
    if (strength === void 0) {
        strength = 50;
    }
    var previousValue = 0;
    var lastUpdated = 0;
    return function (v) {
        var currentFramestamp = (0, _framesync.currentFrameTime)();
        var timeDelta = currentFramestamp !== lastUpdated ? currentFramestamp - lastUpdated : 0;
        var newValue = timeDelta ? smooth(v, previousValue, timeDelta, strength) : previousValue;
        lastUpdated = currentFramestamp;
        previousValue = newValue;
        return newValue;
    };
};
var snap = function (points) {
    if (typeof points === 'number') {
        return function (v) {
            return Math.round(v / points) * points;
        };
    } else {
        var i_1 = 0;
        var numPoints_1 = points.length;
        return function (v) {
            var lastDistance = Math.abs(points[0] - v);
            for (i_1 = 1; i_1 < numPoints_1; i_1++) {
                var point = points[i_1];
                var distance$$1 = Math.abs(point - v);
                if (distance$$1 === 0) return point;
                if (distance$$1 > lastDistance) return points[i_1 - 1];
                if (i_1 === numPoints_1 - 1) return point;
                lastDistance = distance$$1;
            }
        };
    }
};
var steps = function (st, min, max) {
    if (min === void 0) {
        min = 0;
    }
    if (max === void 0) {
        max = 1;
    }
    return function (v) {
        var progress = getProgressFromValue(min, max, v);
        return getValueFromProgress(min, max, stepProgress(st, progress));
    };
};
var transformMap = function (childTransformers) {
    return function (v) {
        var output = (0, _tslib.__assign)({}, v);
        for (var key in childTransformers) {
            if (childTransformers.hasOwnProperty(key)) {
                var childTransformer = childTransformers[key];
                output[key] = childTransformer(v[key]);
            }
        }
        return output;
    };
};

var transformers = /*#__PURE__*/Object.freeze({
    appendUnit: appendUnit,
    applyOffset: applyOffset,
    blendColor: blendColor,
    blendArray: blendArray,
    clamp: clamp,
    pipe: pipe,
    conditional: conditional,
    interpolate: interpolate,
    generateStaticSpring: generateStaticSpring,
    linearSpring: linearSpring,
    nonlinearSpring: nonlinearSpring,
    wrap: wrap,
    smooth: smooth$1,
    snap: snap,
    steps: steps,
    transformMap: transformMap
});

var Chainable = /*#__PURE__*/function () {
    function Chainable(props) {
        if (props === void 0) {
            props = {};
        }
        this.props = props;
    }
    Chainable.prototype.applyMiddleware = function (middleware) {
        return this.create((0, _tslib.__assign)({}, this.props, { middleware: this.props.middleware ? [middleware].concat(this.props.middleware) : [middleware] }));
    };
    Chainable.prototype.pipe = function () {
        var funcs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            funcs[_i] = arguments[_i];
        }
        var pipedUpdate = funcs.length === 1 ? funcs[0] : pipe.apply(void 0, funcs);
        return this.applyMiddleware(function (update) {
            return function (v) {
                return update(pipedUpdate(v));
            };
        });
    };
    Chainable.prototype.while = function (predicate) {
        return this.applyMiddleware(function (update, complete) {
            return function (v) {
                return predicate(v) ? update(v) : complete();
            };
        });
    };
    Chainable.prototype.filter = function (predicate) {
        return this.applyMiddleware(function (update, complete) {
            return function (v) {
                return predicate(v) && update(v);
            };
        });
    };
    return Chainable;
}();

var Observer = /*#__PURE__*/function () {
    function Observer(_a, observer) {
        var middleware = _a.middleware,
            onComplete = _a.onComplete;
        var _this = this;
        this.isActive = true;
        this.update = function (v) {
            if (_this.observer.update) _this.updateObserver(v);
        };
        this.complete = function () {
            if (_this.observer.complete && _this.isActive) _this.observer.complete();
            if (_this.onComplete) _this.onComplete();
            _this.isActive = false;
        };
        this.error = function (err) {
            if (_this.observer.error && _this.isActive) _this.observer.error(err);
            _this.isActive = false;
        };
        this.observer = observer;
        this.updateObserver = function (v) {
            return observer.update(v);
        };
        this.onComplete = onComplete;
        if (observer.update && middleware && middleware.length) {
            middleware.forEach(function (m) {
                return _this.updateObserver = m(_this.updateObserver, _this.complete);
            });
        }
    }
    return Observer;
}();
var createObserver = function (observerCandidate, _a, onComplete) {
    var middleware = _a.middleware;
    if (typeof observerCandidate === 'function') {
        return new Observer({ middleware: middleware, onComplete: onComplete }, { update: observerCandidate });
    } else {
        return new Observer({ middleware: middleware, onComplete: onComplete }, observerCandidate);
    }
};

var Action = /*#__PURE__*/function (_super) {
    (0, _tslib.__extends)(Action, _super);
    function Action() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Action.prototype.create = function (props) {
        return new Action(props);
    };
    Action.prototype.start = function (observerCandidate) {
        if (observerCandidate === void 0) {
            observerCandidate = {};
        }
        var isComplete = false;
        var subscription = {
            stop: function () {
                return undefined;
            }
        };
        var _a = this.props,
            init = _a.init,
            observerProps = (0, _tslib.__rest)(_a, ["init"]);
        var observer = createObserver(observerCandidate, observerProps, function () {
            isComplete = true;
            subscription.stop();
        });
        var api = init(observer);
        subscription = api ? (0, _tslib.__assign)({}, subscription, api) : subscription;
        if (observerCandidate.registerParent) {
            observerCandidate.registerParent(subscription);
        }
        if (isComplete) subscription.stop();
        return subscription;
    };
    return Action;
}(Chainable);
var action = function (init) {
    return new Action({ init: init });
};

var BaseMulticast = /*#__PURE__*/function (_super) {
    (0, _tslib.__extends)(BaseMulticast, _super);
    function BaseMulticast() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.subscribers = [];
        return _this;
    }
    BaseMulticast.prototype.complete = function () {
        this.subscribers.forEach(function (subscriber) {
            return subscriber.complete();
        });
    };
    BaseMulticast.prototype.error = function (err) {
        this.subscribers.forEach(function (subscriber) {
            return subscriber.error(err);
        });
    };
    BaseMulticast.prototype.update = function (v) {
        for (var i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i].update(v);
        }
    };
    BaseMulticast.prototype.subscribe = function (observerCandidate) {
        var _this = this;
        var observer = createObserver(observerCandidate, this.props);
        this.subscribers.push(observer);
        var subscription = {
            unsubscribe: function () {
                var index = _this.subscribers.indexOf(observer);
                if (index !== -1) _this.subscribers.splice(index, 1);
            }
        };
        return subscription;
    };
    BaseMulticast.prototype.stop = function () {
        if (this.parent) this.parent.stop();
    };
    BaseMulticast.prototype.registerParent = function (subscription) {
        this.stop();
        this.parent = subscription;
    };
    return BaseMulticast;
}(Chainable);

var Multicast = /*#__PURE__*/function (_super) {
    (0, _tslib.__extends)(Multicast, _super);
    function Multicast() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Multicast.prototype.create = function (props) {
        return new Multicast(props);
    };
    return Multicast;
}(BaseMulticast);
var multicast = function () {
    return new Multicast();
};

var isValueList = function (v) {
    return Array.isArray(v);
};
var isSingleValue = function (v) {
    var typeOfV = typeof v;
    return typeOfV === 'string' || typeOfV === 'number';
};
var ValueReaction = /*#__PURE__*/function (_super) {
    (0, _tslib.__extends)(ValueReaction, _super);
    function ValueReaction(props) {
        var _this = _super.call(this, props) || this;
        _this.scheduleVelocityCheck = function () {
            return (0, _framesync.onFrameEnd)(_this.velocityCheck);
        };
        _this.velocityCheck = function () {
            if ((0, _framesync.currentFrameTime)() !== _this.lastUpdated) {
                _this.prev = _this.current;
            }
        };
        _this.prev = _this.current = props.value || 0;
        if (isSingleValue(_this.current)) {
            _this.updateCurrent = function (v) {
                return _this.current = v;
            };
            _this.getVelocityOfCurrent = function () {
                return _this.getSingleVelocity(_this.current, _this.prev);
            };
        } else if (isValueList(_this.current)) {
            _this.updateCurrent = function (v) {
                return _this.current = v.slice();
            };
            _this.getVelocityOfCurrent = function () {
                return _this.getListVelocity();
            };
        } else {
            _this.updateCurrent = function (v) {
                _this.current = {};
                for (var key in v) {
                    if (v.hasOwnProperty(key)) {
                        _this.current[key] = v[key];
                    }
                }
            };
            _this.getVelocityOfCurrent = function () {
                return _this.getMapVelocity();
            };
        }
        if (props.initialSubscription) _this.subscribe(props.initialSubscription);
        return _this;
    }
    ValueReaction.prototype.create = function (props) {
        return new ValueReaction(props);
    };
    ValueReaction.prototype.get = function () {
        return this.current;
    };
    ValueReaction.prototype.getVelocity = function () {
        return this.getVelocityOfCurrent();
    };
    ValueReaction.prototype.update = function (v) {
        _super.prototype.update.call(this, v);
        this.prev = this.current;
        this.updateCurrent(v);
        this.timeDelta = (0, _framesync.timeSinceLastFrame)();
        this.lastUpdated = (0, _framesync.currentFrameTime)();
        (0, _framesync.onFrameEnd)(this.scheduleVelocityCheck);
    };
    ValueReaction.prototype.subscribe = function (observerCandidate) {
        var sub = _super.prototype.subscribe.call(this, observerCandidate);
        this.update(this.current);
        return sub;
    };
    ValueReaction.prototype.getSingleVelocity = function (current, prev) {
        return typeof current === 'number' && typeof prev === 'number' ? speedPerSecond(current - prev, this.timeDelta) : speedPerSecond(parseFloat(current) - parseFloat(prev), this.timeDelta) || 0;
    };
    ValueReaction.prototype.getListVelocity = function () {
        var _this = this;
        return this.current.map(function (c, i) {
            return _this.getSingleVelocity(c, _this.prev[i]);
        });
    };
    ValueReaction.prototype.getMapVelocity = function () {
        var velocity = {};
        for (var key in this.current) {
            if (this.current.hasOwnProperty(key)) {
                velocity[key] = this.getSingleVelocity(this.current[key], this.prev[key]);
            }
        }
        return velocity;
    };
    return ValueReaction;
}(BaseMulticast);
var value = function (value, initialSubscription) {
    return new ValueReaction({ value: value, initialSubscription: initialSubscription });
};

var multi = function (_a) {
    var getCount = _a.getCount,
        getFirst = _a.getFirst,
        getOutput = _a.getOutput,
        mapApi = _a.mapApi,
        setProp = _a.setProp,
        startActions = _a.startActions;
    return function (actions) {
        return action(function (_a) {
            var update = _a.update,
                complete = _a.complete,
                error = _a.error;
            var numActions = getCount(actions);
            var output = getOutput();
            var updateOutput = function () {
                return update(output);
            };
            var numCompletedActions = 0;
            var subs = startActions(actions, function (a, name) {
                var hasCompleted = false;
                return a.start({
                    complete: function () {
                        if (!hasCompleted) {
                            hasCompleted = true;
                            numCompletedActions++;
                            if (numCompletedActions === numActions) (0, _framesync.onFrameUpdate)(complete);
                        }
                    },
                    error: error,
                    update: function (v) {
                        setProp(output, name, v);
                        (0, _framesync.onFrameUpdate)(updateOutput, true);
                    }
                });
            });
            return Object.keys(getFirst(subs)).reduce(function (api, methodName) {
                api[methodName] = mapApi(subs, methodName);
                return api;
            }, {});
        });
    };
};

var composite = /*#__PURE__*/multi({
    getOutput: function () {
        return {};
    },
    getCount: function (subs) {
        return Object.keys(subs).length;
    },
    getFirst: function (subs) {
        return subs[Object.keys(subs)[0]];
    },
    mapApi: function (subs, methodName) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return Object.keys(subs).reduce(function (output, propKey) {
                if (subs[propKey][methodName]) {
                    args[0] && args[0][propKey] !== undefined ? output[propKey] = subs[propKey][methodName](args[0][propKey]) : output[propKey] = (_a = subs[propKey])[methodName].apply(_a, args);
                }
                return output;
                var _a;
            }, {});
        };
    },
    setProp: function (output, name, v) {
        return output[name] = v;
    },
    startActions: function (actions, starter) {
        return Object.keys(actions).reduce(function (subs, key) {
            subs[key] = starter(actions[key], key);
            return subs;
        }, {});
    }
});

var parallel = /*#__PURE__*/multi({
    getOutput: function () {
        return [];
    },
    getCount: function (subs) {
        return subs.length;
    },
    getFirst: function (subs) {
        return subs[0];
    },
    mapApi: function (subs, methodName) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return subs.map(function (sub, i) {
                if (sub[methodName]) {
                    return Array.isArray(args[0]) ? sub[methodName](args[0][i]) : sub[methodName].apply(sub, args);
                }
            });
        };
    },
    setProp: function (output, name, v) {
        return output[name] = v;
    },
    startActions: function (actions, starter) {
        return actions.map(function (action, i) {
            return starter(action, i);
        });
    }
});
var parallel$1 = function () {
    var actions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        actions[_i] = arguments[_i];
    }
    return parallel(actions);
};

var createVectorTests = function (typeTests) {
    var testNames = Object.keys(typeTests);
    var isVectorProp = function (prop, key) {
        return prop !== undefined && !typeTests[key](prop);
    };
    var getVectorKeys = function (props) {
        return testNames.reduce(function (vectorKeys, key) {
            if (isVectorProp(props[key], key)) vectorKeys.push(key);
            return vectorKeys;
        }, []);
    };
    var testVectorProps = function (props) {
        return props && testNames.reduce(function (isVector, key) {
            return isVector || isVectorProp(props[key], key);
        }, false);
    };
    return { getVectorKeys: getVectorKeys, testVectorProps: testVectorProps };
};
var unitTypes = [_styleValueTypes.px, _styleValueTypes.percent, _styleValueTypes.degrees, _styleValueTypes.vh, _styleValueTypes.vw];
var findUnitType = function (prop) {
    return unitTypes.find(function (type) {
        return type.test(prop);
    });
};
var isUnitProp = function (prop) {
    return Boolean(findUnitType(prop));
};
var createAction = function (action, props) {
    return action(props);
};
var reduceArrayValue = function (i) {
    return function (props, key) {
        props[key] = props[key][i];
        return props;
    };
};
var createArrayAction = function (action, props, vectorKeys) {
    var firstVectorKey = vectorKeys[0];
    var actionList = props[firstVectorKey].map(function (v, i) {
        var childActionProps = vectorKeys.reduce(reduceArrayValue(i), (0, _tslib.__assign)({}, props));
        return getActionCreator(v)(action, childActionProps);
    });
    return parallel$1.apply(void 0, actionList);
};
var reduceObjectValue = function (key) {
    return function (props, propKey) {
        props[propKey] = props[propKey][key];
        return props;
    };
};
var createObjectAction = function (action, props, vectorKeys) {
    var firstVectorKey = vectorKeys[0];
    var actionMap = Object.keys(props[firstVectorKey]).reduce(function (map, key) {
        var childActionProps = vectorKeys.reduce(reduceObjectValue(key), (0, _tslib.__assign)({}, props));
        map[key] = getActionCreator(props[firstVectorKey][key])(action, childActionProps);
        return map;
    }, {});
    return composite(actionMap);
};
var createUnitAction = function (action, _a) {
    var from = _a.from,
        to = _a.to,
        props = (0, _tslib.__rest)(_a, ["from", "to"]);
    var unitType = findUnitType(from) || findUnitType(to);
    var transform = unitType.transform,
        parse = unitType.parse;
    return action((0, _tslib.__assign)({}, props, { from: typeof from === 'string' ? parse(from) : from, to: typeof to === 'string' ? parse(to) : to })).pipe(transform);
};
var createColorAction = function (action, _a) {
    var from = _a.from,
        to = _a.to,
        props = (0, _tslib.__rest)(_a, ["from", "to"]);
    return action((0, _tslib.__assign)({}, props, { from: 0, to: 1 })).pipe(blendColor(from, to), _styleValueTypes.color.transform);
};
var createComplexAction = function (action, _a) {
    var from = _a.from,
        to = _a.to,
        props = (0, _tslib.__rest)(_a, ["from", "to"]);
    var valueTemplate = _styleValueTypes.complex.createTransformer(from);
    (0, _heyListen.invariant)(valueTemplate(from) === _styleValueTypes.complex.createTransformer(to)(from), "Values '" + from + "' and '" + to + "' are of different format, or a value might have changed value type.");
    return action((0, _tslib.__assign)({}, props, { from: 0, to: 1 })).pipe(blendArray(_styleValueTypes.complex.parse(from), _styleValueTypes.complex.parse(to)), valueTemplate);
};
var createVectorAction = function (action, typeTests) {
    var _a = createVectorTests(typeTests),
        testVectorProps = _a.testVectorProps,
        getVectorKeys = _a.getVectorKeys;
    var vectorAction = function (props) {
        var isVector = testVectorProps(props);
        if (!isVector) return action(props);
        var vectorKeys = getVectorKeys(props);
        var testKey = vectorKeys[0];
        var testProp = props[testKey];
        return getActionCreator(testProp)(action, props, vectorKeys);
    };
    return vectorAction;
};
var getActionCreator = function (prop) {
    var actionCreator = createAction;
    if (typeof prop === 'number') {
        actionCreator = createAction;
    } else if (Array.isArray(prop)) {
        actionCreator = createArrayAction;
    } else if (isUnitProp(prop)) {
        actionCreator = createUnitAction;
    } else if (_styleValueTypes.color.test(prop)) {
        actionCreator = createColorAction;
    } else if (_styleValueTypes.complex.test(prop)) {
        actionCreator = createComplexAction;
    } else if (typeof prop === 'object') {
        actionCreator = createObjectAction;
    }
    return actionCreator;
};

var frame = function () {
    return action(function (_a) {
        var update = _a.update;
        var isActive = true;
        var startTime = (0, _framesync.currentTime)();
        var nextFrame = function () {
            if (!isActive) return;
            update(Math.max((0, _framesync.currentFrameTime)() - startTime, 0));
            (0, _framesync.onFrameUpdate)(nextFrame);
        };
        (0, _framesync.onFrameUpdate)(nextFrame);
        return {
            stop: function () {
                return isActive = false;
            }
        };
    });
};

var decay = function (props) {
    if (props === void 0) {
        props = {};
    }
    return action(function (_a) {
        var complete = _a.complete,
            update = _a.update;
        var _b = props.velocity,
            velocity = _b === void 0 ? 0 : _b,
            _c = props.from,
            from = _c === void 0 ? 0 : _c,
            _d = props.power,
            power = _d === void 0 ? 0.8 : _d,
            _e = props.timeConstant,
            timeConstant = _e === void 0 ? 350 : _e,
            _f = props.restDelta,
            restDelta = _f === void 0 ? 0.5 : _f,
            modifyTarget = props.modifyTarget;
        var elapsed = 0;
        var amplitude = power * velocity;
        var idealTarget = Math.round(from + amplitude);
        var target = typeof modifyTarget === 'undefined' ? idealTarget : modifyTarget(idealTarget);
        var timer = frame().start(function () {
            elapsed += (0, _framesync.timeSinceLastFrame)();
            var delta = -amplitude * Math.exp(-elapsed / timeConstant);
            var isMoving = delta > restDelta || delta < -restDelta;
            var current = isMoving ? target + delta : target;
            update(current);
            if (!isMoving) {
                timer.stop();
                complete();
            }
        });
        return {
            stop: function () {
                return timer.stop();
            }
        };
    });
};
var vectorDecay = /*#__PURE__*/createVectorAction(decay, {
    from: _styleValueTypes.number.test,
    modifyTarget: function (func) {
        return typeof func === 'function';
    },
    velocity: _styleValueTypes.number.test
});

var DEFAULT_OVERSHOOT_STRENGTH = 1.525;
var createReversedEasing = function (easing) {
    return function (p) {
        return 1 - easing(1 - p);
    };
};
var createMirroredEasing = function (easing) {
    return function (p) {
        return p <= 0.5 ? easing(2 * p) / 2 : (2 - easing(2 * (1 - p))) / 2;
    };
};
var linear = function (p) {
    return p;
};
var createExpoIn = function (power) {
    return function (p) {
        return Math.pow(p, power);
    };
};
var easeIn = /*#__PURE__*/createExpoIn(2);
var easeOut = /*#__PURE__*/createReversedEasing(easeIn);
var easeInOut = /*#__PURE__*/createMirroredEasing(easeIn);
var circIn = function (p) {
    return 1 - Math.sin(Math.acos(p));
};
var circOut = /*#__PURE__*/createReversedEasing(circIn);
var circInOut = /*#__PURE__*/createMirroredEasing(circOut);
var createBackIn = function (power) {
    return function (p) {
        return p * p * ((power + 1) * p - power);
    };
};
var backIn = /*#__PURE__*/createBackIn(DEFAULT_OVERSHOOT_STRENGTH);
var backOut = /*#__PURE__*/createReversedEasing(backIn);
var backInOut = /*#__PURE__*/createMirroredEasing(backIn);
var createAnticipateEasing = function (power) {
    var backEasing = createBackIn(power);
    return function (p) {
        return (p *= 2) < 1 ? 0.5 * backEasing(p) : 0.5 * (2 - Math.pow(2, -10 * (p - 1)));
    };
};
var anticipate = /*#__PURE__*/createAnticipateEasing(DEFAULT_OVERSHOOT_STRENGTH);
var NEWTON_ITERATIONS = 8;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;
var K_SPLINE_TABLE_SIZE = 11;
var K_SAMPLE_STEP_SIZE = 1.0 / (K_SPLINE_TABLE_SIZE - 1.0);
var FLOAT_32_SUPPORTED = typeof Float32Array !== 'undefined';
var a = function (a1, a2) {
    return 1.0 - 3.0 * a2 + 3.0 * a1;
};
var b = function (a1, a2) {
    return 3.0 * a2 - 6.0 * a1;
};
var c = function (a1) {
    return 3.0 * a1;
};
var getSlope = function (t, a1, a2) {
    return 3.0 * a(a1, a2) * t * t + 2.0 * b(a1, a2) * t + c(a1);
};
var calcBezier = function (t, a1, a2) {
    return ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
};
function cubicBezier(mX1, mY1, mX2, mY2) {
    var sampleValues = FLOAT_32_SUPPORTED ? new Float32Array(K_SPLINE_TABLE_SIZE) : new Array(K_SPLINE_TABLE_SIZE);
    var _precomputed = false;
    var binarySubdivide = function (aX, aA, aB) {
        var i = 0;
        var currentX;
        var currentT;
        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
                aB = currentT;
            } else {
                aA = currentT;
            }
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
        return currentT;
    };
    var newtonRaphsonIterate = function (aX, aGuessT) {
        var i = 0;
        var currentSlope = 0;
        var currentX;
        for (; i < NEWTON_ITERATIONS; ++i) {
            currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) {
                return aGuessT;
            }
            currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    };
    var calcSampleValues = function () {
        for (var i = 0; i < K_SPLINE_TABLE_SIZE; ++i) {
            sampleValues[i] = calcBezier(i * K_SAMPLE_STEP_SIZE, mX1, mX2);
        }
    };
    var getTForX = function (aX) {
        var intervalStart = 0.0;
        var currentSample = 1;
        var lastSample = K_SPLINE_TABLE_SIZE - 1;
        var dist = 0.0;
        var guessForT = 0.0;
        var initialSlope = 0.0;
        for (; currentSample != lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += K_SAMPLE_STEP_SIZE;
        }
        --currentSample;
        dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        guessForT = intervalStart + dist * K_SAMPLE_STEP_SIZE;
        initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT);
        } else if (initialSlope === 0.0) {
            return guessForT;
        } else {
            return binarySubdivide(aX, intervalStart, intervalStart + K_SAMPLE_STEP_SIZE);
        }
    };
    var precompute = function () {
        _precomputed = true;
        if (mX1 != mY1 || mX2 != mY2) {
            calcSampleValues();
        }
    };
    var resolver = function (aX) {
        var returnValue;
        if (!_precomputed) {
            precompute();
        }
        if (mX1 === mY1 && mX2 === mY2) {
            returnValue = aX;
        } else if (aX === 0) {
            returnValue = 0;
        } else if (aX === 1) {
            returnValue = 1;
        } else {
            returnValue = calcBezier(getTForX(aX), mY1, mY2);
        }
        return returnValue;
    };
    return resolver;
}

var easing = /*#__PURE__*/Object.freeze({
    createReversedEasing: createReversedEasing,
    createMirroredEasing: createMirroredEasing,
    linear: linear,
    createExpoIn: createExpoIn,
    easeIn: easeIn,
    easeOut: easeOut,
    easeInOut: easeInOut,
    circIn: circIn,
    circOut: circOut,
    circInOut: circInOut,
    createBackIn: createBackIn,
    backIn: backIn,
    backOut: backOut,
    backInOut: backInOut,
    createAnticipateEasing: createAnticipateEasing,
    anticipate: anticipate,
    cubicBezier: cubicBezier
});

var scrubber = function (_a) {
    var _b = _a.from,
        from = _b === void 0 ? 0 : _b,
        _c = _a.to,
        to = _c === void 0 ? 1 : _c,
        _d = _a.ease,
        ease = _d === void 0 ? linear : _d;
    return action(function (_a) {
        var update = _a.update;
        return {
            seek: function (progress) {
                return update(progress);
            }
        };
    }).pipe(ease, function (v) {
        return getValueFromProgress(from, to, v);
    });
};
var vectorScrubber = /*#__PURE__*/createVectorAction(scrubber, {
    ease: function (func) {
        return typeof func === 'function';
    },
    from: _styleValueTypes.number.test,
    to: _styleValueTypes.number.test
});

var clampProgress = /*#__PURE__*/clamp(0, 1);
var tween = function (props) {
    if (props === void 0) {
        props = {};
    }
    return action(function (_a) {
        var update = _a.update,
            complete = _a.complete;
        var _b = props.duration,
            duration = _b === void 0 ? 300 : _b,
            _c = props.ease,
            ease = _c === void 0 ? easeOut : _c,
            _d = props.flip,
            flip = _d === void 0 ? 0 : _d,
            _e = props.loop,
            loop = _e === void 0 ? 0 : _e,
            _f = props.yoyo,
            yoyo = _f === void 0 ? 0 : _f;
        var _g = props.from,
            from = _g === void 0 ? 0 : _g,
            _h = props.to,
            to = _h === void 0 ? 1 : _h,
            _j = props.elapsed,
            elapsed = _j === void 0 ? 0 : _j,
            _k = props.playDirection,
            playDirection = _k === void 0 ? 1 : _k,
            _l = props.flipCount,
            flipCount = _l === void 0 ? 0 : _l,
            _m = props.yoyoCount,
            yoyoCount = _m === void 0 ? 0 : _m,
            _o = props.loopCount,
            loopCount = _o === void 0 ? 0 : _o;
        var playhead = vectorScrubber({ from: from, to: to, ease: ease }).start(update);
        var progress = 0;
        var tweenTimer;
        var isActive = false;
        var reverseTween = function () {
            return playDirection *= -1;
        };
        var isTweenComplete = function () {
            var isComplete = playDirection === 1 ? isActive && elapsed >= duration : isActive && elapsed <= 0;
            if (!isComplete) return false;
            if (isComplete && !loop && !flip && !yoyo) return true;
            var isStepTaken = false;
            if (loop && loopCount < loop) {
                elapsed = 0;
                loopCount++;
                isStepTaken = true;
            } else if (flip && flipCount < flip) {
                elapsed = duration - elapsed;
                _a = [to, from], from = _a[0], to = _a[1];
                playhead = vectorScrubber({ from: from, to: to, ease: ease }).start(update);
                flipCount++;
                isStepTaken = true;
            } else if (yoyo && yoyoCount < yoyo) {
                reverseTween();
                yoyoCount++;
                isStepTaken = true;
            }
            return !isStepTaken;
            var _a;
        };
        var updateTween = function () {
            progress = clampProgress(getProgressFromValue(0, duration, elapsed));
            playhead.seek(progress);
        };
        var startTimer = function () {
            isActive = true;
            tweenTimer = frame().start(function () {
                elapsed += (0, _framesync.timeSinceLastFrame)() * playDirection;
                updateTween();
                if (isTweenComplete() && complete) {
                    tweenTimer.stop();
                    (0, _framesync.onFrameUpdate)(complete, true);
                }
            });
        };
        var stopTimer = function () {
            isActive = false;
            if (tweenTimer) tweenTimer.stop();
        };
        startTimer();
        return {
            isActive: function () {
                return isActive;
            },
            getElapsed: function () {
                return clamp(0, duration)(elapsed);
            },
            getProgress: function () {
                return progress;
            },
            stop: function () {
                stopTimer();
            },
            pause: function () {
                stopTimer();
                return this;
            },
            resume: function () {
                startTimer();
                return this;
            },
            seek: function (newProgress) {
                elapsed = getValueFromProgress(0, duration, newProgress);
                (0, _framesync.onFrameUpdate)(updateTween, true);
                return this;
            },
            reverse: function () {
                reverseTween();
                return this;
            }
        };
    });
};

var clampProgress$1 = /*#__PURE__*/clamp(0, 1);
var defaultEasings = function (values, easing) {
    return values.map(function () {
        return easing || easeOut;
    }).splice(0, values.length - 1);
};
var defaultTimings = function (values) {
    var numValues = values.length;
    return values.map(function (value, i) {
        return i !== 0 ? i / (numValues - 1) : 0;
    });
};
var interpolateScrubbers = function (input, scrubbers, update) {
    var rangeLength = input.length;
    var finalInputIndex = rangeLength - 1;
    var finalScrubberIndex = finalInputIndex - 1;
    var subs = scrubbers.map(function (scrub) {
        return scrub.start(update);
    });
    return function (v) {
        if (v <= input[0]) {
            subs[0].seek(0);
        }
        if (v >= input[finalInputIndex]) {
            subs[finalScrubberIndex].seek(1);
        }
        var i = 1;
        for (; i < rangeLength; i++) {
            if (input[i] > v || i === finalInputIndex) break;
        }
        var progressInRange = getProgressFromValue(input[i - 1], input[i], v);
        subs[i - 1].seek(clampProgress$1(progressInRange));
    };
};
var keyframes = function (_a) {
    var easings = _a.easings,
        _b = _a.ease,
        ease = _b === void 0 ? linear : _b,
        times = _a.times,
        values = _a.values,
        tweenProps = (0, _tslib.__rest)(_a, ["easings", "ease", "times", "values"]);
    easings = Array.isArray(easings) ? easings : defaultEasings(values, easings);
    times = times || defaultTimings(values);
    var scrubbers = easings.map(function (easing, i) {
        return vectorScrubber({
            from: values[i],
            to: values[i + 1],
            ease: easing
        });
    });
    return tween((0, _tslib.__assign)({}, tweenProps, { ease: ease })).applyMiddleware(function (update) {
        return interpolateScrubbers(times, scrubbers, update);
    });
};

var physics = function (props) {
    if (props === void 0) {
        props = {};
    }
    return action(function (_a) {
        var complete = _a.complete,
            update = _a.update;
        var _b = props.acceleration,
            acceleration = _b === void 0 ? 0 : _b,
            _c = props.friction,
            friction = _c === void 0 ? 0 : _c,
            _d = props.velocity,
            velocity = _d === void 0 ? 0 : _d,
            springStrength = props.springStrength,
            to = props.to;
        var _e = props.restSpeed,
            restSpeed = _e === void 0 ? 0.001 : _e,
            _f = props.from,
            from = _f === void 0 ? 0 : _f;
        var current = from;
        var timer = frame().start(function () {
            var elapsed = Math.max((0, _framesync.timeSinceLastFrame)(), 16);
            if (acceleration) velocity += speedPerFrame(acceleration, elapsed);
            if (friction) velocity *= Math.pow(1 - friction, elapsed / 100);
            if (springStrength !== undefined && to !== undefined) {
                var distanceToTarget = to - current;
                velocity += distanceToTarget * speedPerFrame(springStrength, elapsed);
            }
            current += speedPerFrame(velocity, elapsed);
            update(current);
            var isComplete = restSpeed !== false && (!velocity || Math.abs(velocity) <= restSpeed);
            if (isComplete) {
                timer.stop();
                complete();
            }
        });
        return {
            set: function (v) {
                current = v;
                return this;
            },
            setAcceleration: function (v) {
                acceleration = v;
                return this;
            },
            setFriction: function (v) {
                friction = v;
                return this;
            },
            setSpringStrength: function (v) {
                springStrength = v;
                return this;
            },
            setSpringTarget: function (v) {
                to = v;
                return this;
            },
            setVelocity: function (v) {
                velocity = v;
                return this;
            },
            stop: function () {
                return timer.stop();
            }
        };
    });
};
var vectorPhysics = /*#__PURE__*/createVectorAction(physics, {
    acceleration: _styleValueTypes.number.test,
    friction: _styleValueTypes.number.test,
    velocity: _styleValueTypes.number.test,
    from: _styleValueTypes.number.test,
    to: _styleValueTypes.number.test,
    springStrength: _styleValueTypes.number.test
});

var spring = function (props) {
    if (props === void 0) {
        props = {};
    }
    return action(function (_a) {
        var update = _a.update,
            complete = _a.complete;
        var _b = props.velocity,
            velocity = _b === void 0 ? 0.0 : _b;
        var _c = props.from,
            from = _c === void 0 ? 0.0 : _c,
            _d = props.to,
            to = _d === void 0 ? 0.0 : _d,
            _e = props.stiffness,
            stiffness = _e === void 0 ? 100 : _e,
            _f = props.damping,
            damping = _f === void 0 ? 10 : _f,
            _g = props.mass,
            mass = _g === void 0 ? 1.0 : _g,
            _h = props.restSpeed,
            restSpeed = _h === void 0 ? 0.01 : _h,
            _j = props.restDelta,
            restDelta = _j === void 0 ? 0.01 : _j;
        var initialVelocity = velocity ? -(velocity / 1000) : 0.0;
        var t = 0;
        var delta = to - from;
        var position = from;
        var prevPosition = position;
        var springTimer = frame().start(function () {
            var timeDelta = (0, _framesync.timeSinceLastFrame)();
            t += timeDelta;
            var dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
            var angularFreq = Math.sqrt(stiffness / mass) / 1000;
            prevPosition = position;
            if (dampingRatio < 1) {
                var envelope = Math.exp(-dampingRatio * angularFreq * t);
                var expoDecay = angularFreq * Math.sqrt(1.0 - dampingRatio * dampingRatio);
                position = to - envelope * ((initialVelocity + dampingRatio * angularFreq * delta) / expoDecay * Math.sin(expoDecay * t) + delta * Math.cos(expoDecay * t));
            } else {
                var envelope = Math.exp(-angularFreq * t);
                position = to - envelope * (delta + (initialVelocity + angularFreq * delta) * t);
            }
            velocity = speedPerSecond(position - prevPosition, timeDelta);
            var isBelowVelocityThreshold = Math.abs(velocity) <= restSpeed;
            var isBelowDisplacementThreshold = Math.abs(to - position) <= restDelta;
            if (isBelowVelocityThreshold && isBelowDisplacementThreshold) {
                position = to;
                update(position);
                springTimer.stop();
                complete();
            } else {
                update(position);
            }
        });
        return {
            stop: function () {
                return springTimer.stop();
            }
        };
    });
};
var vectorSpring = /*#__PURE__*/createVectorAction(spring, {
    from: _styleValueTypes.number.test,
    to: _styleValueTypes.number.test,
    stiffness: _styleValueTypes.number.test,
    damping: _styleValueTypes.number.test,
    mass: _styleValueTypes.number.test,
    velocity: _styleValueTypes.number.test
});

var DEFAULT_DURATION = 300;
var flattenTimings = function (instructions) {
    var flatInstructions = [];
    var lastArg = instructions[instructions.length - 1];
    var isStaggered = typeof lastArg === 'number';
    var staggerDelay = isStaggered ? lastArg : 0;
    var segments = isStaggered ? instructions.slice(0, -1) : instructions;
    var numSegments = segments.length;
    var offset = 0;
    segments.forEach(function (item, i) {
        flatInstructions.push(item);
        if (i !== numSegments - 1) {
            var duration = item.duration || DEFAULT_DURATION;
            offset += staggerDelay;
            flatInstructions.push("-" + (duration - offset));
        }
    });
    return flatInstructions;
};
var flattenArrayInstructions = function (instructions, instruction) {
    Array.isArray(instruction) ? instructions.push.apply(instructions, flattenTimings(instruction)) : instructions.push(instruction);
    return instructions;
};
var convertDefToProps = function (props, def, i) {
    var duration = props.duration,
        easings = props.easings,
        times = props.times,
        values = props.values;
    var numValues = values.length;
    var prevTimeTo = times[numValues - 1];
    var timeFrom = def.at === 0 ? 0 : def.at / duration;
    var timeTo = (def.at + def.duration) / duration;
    if (i === 0) {
        values.push(def.from);
        times.push(timeFrom);
    } else {
        if (prevTimeTo !== timeFrom) {
            if (def.from !== undefined) {
                values.push(values[numValues - 1]);
                times.push(timeFrom);
                easings.push(linear);
            }
            var from = def.from !== undefined ? def.from : values[numValues - 1];
            values.push(from);
            times.push(timeFrom);
            easings.push(linear);
        } else if (def.from !== undefined) {
            values.push(def.from);
            times.push(timeFrom);
            easings.push(linear);
        }
    }
    values.push(def.to);
    times.push(timeTo);
    easings.push(def.ease || easeInOut);
    return props;
};
var timeline = function (instructions, _a) {
    var _b = _a === void 0 ? {} : _a,
        duration = _b.duration,
        elapsed = _b.elapsed,
        ease = _b.ease,
        loop = _b.loop,
        flip = _b.flip,
        yoyo = _b.yoyo;
    var playhead = 0;
    var calculatedDuration = 0;
    var flatInstructions = instructions.reduce(flattenArrayInstructions, []);
    var animationDefs = [];
    flatInstructions.forEach(function (instruction) {
        if (typeof instruction === 'string') {
            playhead += parseFloat(instruction);
        } else if (typeof instruction === 'number') {
            playhead = instruction;
        } else {
            var def = (0, _tslib.__assign)({}, instruction, { at: playhead });
            def.duration = def.duration === undefined ? DEFAULT_DURATION : def.duration;
            animationDefs.push(def);
            playhead += def.duration;
            calculatedDuration = Math.max(calculatedDuration, def.at + def.duration);
        }
    });
    var tracks = {};
    var numDefs = animationDefs.length;
    for (var i = 0; i < numDefs; i++) {
        var def = animationDefs[i];
        var track = def.track;
        if (track === undefined) {
            throw new Error('No track defined');
        }
        if (!tracks.hasOwnProperty(track)) tracks[track] = [];
        tracks[track].push(def);
    }
    var trackKeyframes = {};
    for (var key in tracks) {
        if (tracks.hasOwnProperty(key)) {
            var keyframeProps = tracks[key].reduce(convertDefToProps, {
                duration: calculatedDuration,
                easings: [],
                times: [],
                values: []
            });
            trackKeyframes[key] = keyframes((0, _tslib.__assign)({}, keyframeProps, { duration: duration || calculatedDuration, ease: ease,
                elapsed: elapsed,
                loop: loop,
                yoyo: yoyo,
                flip: flip }));
        }
    }
    return composite(trackKeyframes);
};

var listen = function (element, events, options) {
    return action(function (_a) {
        var update = _a.update;
        var eventNames = events.split(' ').map(function (eventName) {
            element.addEventListener(eventName, update, options);
            return eventName;
        });
        return {
            stop: function () {
                return eventNames.forEach(function (eventName) {
                    return element.removeEventListener(eventName, update, options);
                });
            }
        };
    });
};

var defaultPointerPos = function () {
    return {
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        x: 0,
        y: 0
    };
};
var eventToPoint = function (e, point) {
    if (point === void 0) {
        point = defaultPointerPos();
    }
    point.clientX = point.x = e.clientX;
    point.clientY = point.y = e.clientY;
    point.pageX = e.pageX;
    point.pageY = e.pageY;
    return point;
};

var points = [/*#__PURE__*/defaultPointerPos()];
var isTouchDevice = false;
if (typeof document !== 'undefined') {
    var updatePointsLocation = function (_a) {
        var touches = _a.touches;
        isTouchDevice = true;
        var numTouches = touches.length;
        points.length = 0;
        for (var i = 0; i < numTouches; i++) {
            var thisTouch = touches[i];
            points.push(eventToPoint(thisTouch));
        }
    };
    listen(document, 'touchstart touchmove', true).start(updatePointsLocation);
}
var multitouch = function (_a) {
    var _b = _a === void 0 ? {} : _a,
        _c = _b.preventDefault,
        preventDefault = _c === void 0 ? true : _c,
        _d = _b.scale,
        scale = _d === void 0 ? 1.0 : _d,
        _e = _b.rotate,
        rotate = _e === void 0 ? 0.0 : _e;
    return action(function (_a) {
        var update = _a.update;
        var output = {
            touches: points,
            scale: scale,
            rotate: rotate
        };
        var initialDistance = 0.0;
        var initialRotation = 0.0;
        var isGesture = points.length > 1;
        if (isGesture) {
            var firstTouch = points[0],
                secondTouch = points[1];
            initialDistance = distance(firstTouch, secondTouch);
            initialRotation = angle(firstTouch, secondTouch);
        }
        var updatePoint = function () {
            if (isGesture) {
                var firstTouch = points[0],
                    secondTouch = points[1];
                var newDistance = distance(firstTouch, secondTouch);
                var newRotation = angle(firstTouch, secondTouch);
                output.scale = scale * (newDistance / initialDistance);
                output.rotate = rotate + (newRotation - initialRotation);
            }
            update(output);
        };
        var onMove = function (e) {
            if (preventDefault || e.touches.length > 1) e.preventDefault();
            (0, _framesync.onFrameUpdate)(updatePoint);
        };
        var updateOnMove = listen(document, 'touchmove', { passive: !preventDefault }).start(onMove);
        if (isTouchDevice) (0, _framesync.onFrameUpdate)(updatePoint);
        return {
            stop: function () {
                (0, _framesync.cancelOnFrameUpdate)(updatePoint);
                updateOnMove.stop();
            }
        };
    });
};
var getIsTouchDevice = function () {
    return isTouchDevice;
};

var point = /*#__PURE__*/defaultPointerPos();
var isMouseDevice = false;
if (typeof document !== 'undefined') {
    var updatePointLocation = function (e) {
        isMouseDevice = true;
        eventToPoint(e, point);
    };
    listen(document, 'mousedown mousemove', true).start(updatePointLocation);
}
var mouse = function (_a) {
    var _b = (_a === void 0 ? {} : _a).preventDefault,
        preventDefault = _b === void 0 ? true : _b;
    return action(function (_a) {
        var update = _a.update;
        var updatePoint = function () {
            return update(point);
        };
        var onMove = function (e) {
            if (preventDefault) e.preventDefault();
            (0, _framesync.onFrameUpdate)(updatePoint);
        };
        var updateOnMove = listen(document, 'mousemove').start(onMove);
        if (isMouseDevice) (0, _framesync.onFrameUpdate)(updatePoint);
        return {
            stop: function () {
                (0, _framesync.cancelOnFrameUpdate)(updatePoint);
                updateOnMove.stop();
            }
        };
    });
};

var getFirstTouch = function (_a) {
    var firstTouch = _a[0];
    return firstTouch;
};
var pointer = function (props) {
    if (props === void 0) {
        props = {};
    }
    return getIsTouchDevice() ? multitouch(props).pipe(function (_a) {
        var touches = _a.touches;
        return touches;
    }, getFirstTouch) : mouse(props);
};
var index = function (_a) {
    if (_a === void 0) {
        _a = {};
    }
    var x = _a.x,
        y = _a.y,
        props = (0, _tslib.__rest)(_a, ["x", "y"]);
    if (x !== undefined || y !== undefined) {
        var applyXOffset_1 = applyOffset(x || 0);
        var applyYOffset_1 = applyOffset(y || 0);
        var delta_1 = { x: 0, y: 0 };
        return pointer(props).pipe(function (point) {
            delta_1.x = applyXOffset_1(point.x);
            delta_1.y = applyYOffset_1(point.y);
            return delta_1;
        });
    } else {
        return pointer(props);
    }
};

var chain = function () {
    var actions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        actions[_i] = arguments[_i];
    }
    return action(function (_a) {
        var update = _a.update,
            complete = _a.complete;
        var i = 0;
        var current;
        var playCurrent = function () {
            current = actions[i].start({
                complete: function () {
                    i++;
                    i >= actions.length ? complete() : playCurrent();
                },
                update: update
            });
        };
        playCurrent();
        return {
            stop: function () {
                return current && current.stop();
            }
        };
    });
};

var crossfade = function (a, b) {
    return action(function (observer) {
        var balance = 0;
        var fadable = parallel$1(a, b).start((0, _tslib.__assign)({}, observer, { update: function (_a) {
                var va = _a[0],
                    vb = _a[1];
                observer.update(getValueFromProgress(va, vb, balance));
            } }));
        return {
            setBalance: function (v) {
                return balance = v;
            },
            stop: function () {
                return fadable.stop();
            }
        };
    });
};

var delay = function (timeToDelay) {
    return action(function (_a) {
        var complete = _a.complete;
        var timeout = setTimeout(complete, timeToDelay);
        return {
            stop: function () {
                return clearTimeout(timeout);
            }
        };
    });
};

var merge = function () {
    var actions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        actions[_i] = arguments[_i];
    }
    return action(function (observer) {
        var subs = actions.map(function (thisAction) {
            return thisAction.start(observer);
        });
        return {
            stop: function () {
                return subs.forEach(function (sub) {
                    return sub.stop();
                });
            }
        };
    });
};

var schedule = function (scheduler, schedulee) {
    return action(function (_a) {
        var update = _a.update,
            complete = _a.complete;
        var latest;
        var schedulerSub = scheduler.start({
            update: function () {
                return latest !== undefined && update(latest);
            },
            complete: complete
        });
        var scheduleeSub = schedulee.start({
            update: function (v) {
                return latest = v;
            },
            complete: complete
        });
        return {
            stop: function () {
                schedulerSub.stop();
                scheduleeSub.stop();
            }
        };
    });
};

var stagger = function (actions, interval) {
    var intervalIsNumber = typeof interval === 'number';
    var actionsWithDelay = actions.map(function (a, i) {
        var timeToDelay = intervalIsNumber ? interval * i : interval(i);
        return chain(delay(timeToDelay), a);
    });
    return parallel$1.apply(void 0, actionsWithDelay);
};

var css = function (element, props) {
    (0, _heyListen.warning)(false, 'css() is deprecated, use styler instead');
    return (0, _stylefire2.default)(element, props);
};
var svg = function (element, props) {
    (0, _heyListen.warning)(false, 'svg() is deprecated, use styler instead');
    return (0, _stylefire2.default)(element, props);
};

exports.action = action;
exports.multicast = multicast;
exports.value = value;
exports.decay = vectorDecay;
exports.keyframes = keyframes;
exports.everyFrame = frame;
exports.physics = vectorPhysics;
exports.spring = vectorSpring;
exports.timeline = timeline;
exports.tween = tween;
exports.listen = listen;
exports.pointer = index;
exports.mouse = mouse;
exports.multitouch = multitouch;
exports.chain = chain;
exports.composite = composite;
exports.crossfade = crossfade;
exports.delay = delay;
exports.merge = merge;
exports.parallel = parallel$1;
exports.schedule = schedule;
exports.stagger = stagger;
exports.calc = calc;
exports.easing = easing;
exports.transform = transformers;
exports.css = css;
exports.svg = svg;
exports.Action = Action;
exports.ValueReaction = ValueReaction;
},{"tslib":78,"framesync":79,"style-value-types":80,"hey-listen":81,"stylefire":82}],31:[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isNum = function (v) { return typeof v === 'number'; };
exports.isPoint = function (point) {
    return point.x !== undefined && point.y !== undefined;
};
exports.isPoint3D = function (point) {
    return point.z !== undefined;
};
var toDecimal = function (num, precision) {
    if (precision === void 0) { precision = 2; }
    precision = Math.pow(10, precision);
    return Math.round(num * precision) / precision;
};
var ZERO_POINT = {
    x: 0,
    y: 0,
    z: 0
};
var distance1D = function (a, b) { return Math.abs(a - b); };
exports.angle = function (a, b) {
    if (b === void 0) { b = ZERO_POINT; }
    return exports.radiansToDegrees(Math.atan2(b.y - a.y, b.x - a.x));
};
exports.degreesToRadians = function (degrees) { return degrees * Math.PI / 180; };
exports.dilate = function (a, b, dilation) { return a + ((b - a) * dilation); };
exports.distance = function (a, b) {
    if (b === void 0) { b = ZERO_POINT; }
    if (isNum(a) && isNum(b)) {
        return distance1D(a, b);
    }
    else if (exports.isPoint(a) && exports.isPoint(b)) {
        var xDelta = distance1D(a.x, b.x);
        var yDelta = distance1D(a.y, b.y);
        var zDelta = (exports.isPoint3D(a) && exports.isPoint3D(b)) ? distance1D(a.z, b.z) : 0;
        return Math.sqrt((Math.pow(xDelta, 2)) + (Math.pow(yDelta, 2)) + (Math.pow(zDelta, 2)));
    }
    return 0;
};
exports.getProgressFromValue = function (from, to, value) {
    var toFromDifference = to - from;
    return toFromDifference === 0 ? 1 : (value - from) / toFromDifference;
};
exports.getValueFromProgress = function (from, to, progress) {
    return (-progress * from) + (progress * to) + from;
};
exports.pointFromAngleAndDistance = function (origin, angle, distance) {
    angle = exports.degreesToRadians(angle);
    return {
        x: distance * Math.cos(angle) + origin.x,
        y: distance * Math.sin(angle) + origin.y
    };
};
exports.radiansToDegrees = function (radians) { return radians * 180 / Math.PI; };
exports.smooth = function (newValue, oldValue, duration, smoothing) {
    if (smoothing === void 0) { smoothing = 0; }
    return toDecimal(oldValue + (duration * (newValue - oldValue) / Math.max(smoothing, duration)));
};
exports.speedPerFrame = function (xps, frameDuration) {
    return (isNum(xps)) ? xps / (1000 / frameDuration) : 0;
};
exports.speedPerSecond = function (velocity, frameDuration) {
    return frameDuration ? velocity * (1000 / frameDuration) : 0;
};
exports.stepProgress = function (steps, progress) {
    var segment = 1 / (steps - 1);
    var target = 1 - (1 / steps);
    var progressOfTarget = Math.min(progress / target, 1);
    return Math.floor(progressOfTarget / segment) * segment;
};
//# sourceMappingURL=calc.js.map
},{}],30:[function(require,module,exports) {
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var framesync_1 = require("framesync");
var style_value_types_1 = require("style-value-types");
var calc_1 = require("./calc");
var noop = function (v) { return v; };
exports.appendUnit = function (unit) { return function (v) { return "" + v + unit; }; };
exports.applyOffset = function (from, to) {
    var hasReceivedFrom = true;
    if (to === undefined) {
        to = from;
        hasReceivedFrom = false;
    }
    var getOffset = function (v) { return v - from; };
    var applyOffsetTo = function (v) { return v + to; };
    return function (v) {
        if (hasReceivedFrom) {
            return applyOffsetTo(getOffset(v));
        }
        else {
            from = v;
            hasReceivedFrom = true;
            return to;
        }
    };
};
var blend = function (from, to, v) {
    var fromExpo = from * from;
    var toExpo = to * to;
    return Math.sqrt(v * (toExpo - fromExpo) + fromExpo);
};
exports.blendColor = function (from, to) {
    var fromColor = typeof from === 'string' ? style_value_types_1.color.parse(from) : from;
    var toColor = typeof to === 'string' ? style_value_types_1.color.parse(to) : to;
    var blended = __assign({}, fromColor);
    var blendFunc = from.hue !== undefined ||
        (typeof from === 'string' && style_value_types_1.hsla.test(from))
        ? calc_1.getValueFromProgress
        : blend;
    return function (v) {
        blended = __assign({}, blended);
        for (var key in blended) {
            if (key !== 'alpha' && blended.hasOwnProperty(key)) {
                blended[key] = blendFunc(fromColor[key], toColor[key], v);
            }
        }
        blended.alpha = calc_1.getValueFromProgress(fromColor.alpha, toColor.alpha, v);
        return blended;
    };
};
exports.blendArray = function (from, to) {
    var output = from.slice();
    var numValues = output.length;
    var blendValue = from.map(function (fromThis, i) {
        var toThis = to[i];
        return typeof fromThis === 'number'
            ? function (v) { return calc_1.getValueFromProgress(fromThis, toThis, v); }
            : exports.blendColor(fromThis, toThis);
    });
    return function (v) {
        for (var i = 0; i < numValues; i++) {
            output[i] = blendValue[i](v);
        }
        return output;
    };
};
exports.clamp = function (min, max) { return function (v) {
    return Math.min(Math.max(v, min), max);
}; };
var combineFunctions = function (a, b) { return function (v) { return b(a(v)); }; };
exports.pipe = function () {
    var transformers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        transformers[_i] = arguments[_i];
    }
    return transformers.reduce(combineFunctions);
};
exports.conditional = function (check, apply) { return function (v) {
    return check(v) ? apply(v) : v;
}; };
var slowInterpolate = function (input, output, rangeLength, rangeEasing) {
    var finalIndex = rangeLength - 1;
    if (input[0] > input[finalIndex]) {
        input.reverse();
        output.reverse();
    }
    return function (v) {
        if (v <= input[0]) {
            return output[0];
        }
        if (v >= input[finalIndex]) {
            return output[finalIndex];
        }
        var i = 1;
        for (; i < rangeLength; i++) {
            if (input[i] > v || i === finalIndex) {
                break;
            }
        }
        var progressInRange = calc_1.getProgressFromValue(input[i - 1], input[i], v);
        var easedProgress = rangeEasing
            ? rangeEasing[i - 1](progressInRange)
            : progressInRange;
        return calc_1.getValueFromProgress(output[i - 1], output[i], easedProgress);
    };
};
var fastInterpolate = function (minA, maxA, minB, maxB) { return function (v) { return ((v - minA) * (maxB - minB)) / (maxA - minA) + minB; }; };
exports.interpolate = function (input, output, rangeEasing) {
    var rangeLength = input.length;
    return rangeLength !== 2
        ? slowInterpolate(input, output, rangeLength, rangeEasing)
        : fastInterpolate(input[0], input[1], output[0], output[1]);
};
exports.generateStaticSpring = function (alterDisplacement) {
    if (alterDisplacement === void 0) { alterDisplacement = noop; }
    return function (constant, origin) { return function (v) {
        var displacement = origin - v;
        var springModifiedDisplacement = -constant * (0 - alterDisplacement(Math.abs(displacement)));
        return displacement <= 0
            ? origin + springModifiedDisplacement
            : origin - springModifiedDisplacement;
    }; };
};
exports.linearSpring = exports.generateStaticSpring();
exports.nonlinearSpring = exports.generateStaticSpring(Math.sqrt);
exports.wrap = function (min, max) { return function (v) {
    var rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}; };
exports.smooth = function (strength) {
    if (strength === void 0) { strength = 50; }
    var previousValue = 0;
    var lastUpdated = 0;
    return function (v) {
        var currentFramestamp = framesync_1.currentFrameTime();
        var timeDelta = currentFramestamp !== lastUpdated ? currentFramestamp - lastUpdated : 0;
        var newValue = timeDelta
            ? calc_1.smooth(v, previousValue, timeDelta, strength)
            : previousValue;
        lastUpdated = currentFramestamp;
        previousValue = newValue;
        return newValue;
    };
};
exports.snap = function (points) {
    if (typeof points === 'number') {
        return function (v) { return Math.round(v / points) * points; };
    }
    else {
        var i_1 = 0;
        var numPoints_1 = points.length;
        return function (v) {
            var lastDistance = Math.abs(points[0] - v);
            for (i_1 = 1; i_1 < numPoints_1; i_1++) {
                var point = points[i_1];
                var distance = Math.abs(point - v);
                if (distance === 0)
                    return point;
                if (distance > lastDistance)
                    return points[i_1 - 1];
                if (i_1 === numPoints_1 - 1)
                    return point;
                lastDistance = distance;
            }
        };
    }
};
exports.steps = function (st, min, max) {
    if (min === void 0) { min = 0; }
    if (max === void 0) { max = 1; }
    return function (v) {
        var progress = calc_1.getProgressFromValue(min, max, v);
        return calc_1.getValueFromProgress(min, max, calc_1.stepProgress(st, progress));
    };
};
exports.transformMap = function (childTransformers) { return function (v) {
    var output = __assign({}, v);
    for (var key in childTransformers) {
        if (childTransformers.hasOwnProperty(key)) {
            var childTransformer = childTransformers[key];
            output[key] = childTransformer(v[key]);
        }
    }
    return output;
}; };
//# sourceMappingURL=transformers.js.map
},{"framesync":79,"style-value-types":80,"./calc":31}],7:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _hyperapp = require('hyperapp');

var _picostyle = require('picostyle');

var _picostyle2 = _interopRequireDefault(_picostyle);

var _popmotion = require('popmotion');

var _transformers = require('popmotion/lib/transformers');

var _calc = require('popmotion/lib/calc');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function makeInteractive(element, _ref) {
  var playPause = _ref.playPause,
      nextSong = _ref.nextSong,
      previousSong = _ref.previousSong;

  var THRESHOLD = 10;

  var handleStyler = (0, _popmotion.styler)(element);
  var handle = {
    x: (0, _popmotion.value)(0, handleStyler.set('x')),
    y: (0, _popmotion.value)(0, handleStyler.set('y'))
  };

  var oneDirectionalPointer = function oneDirectionalPointer(axis) {
    return (0, _popmotion.pointer)(_defineProperty({}, axis, 0)).pipe(function (v) {
      return v[axis];
    });
  };

  var currentHandle = void 0;
  var direction = 'none';
  var stopPointer = void 0;
  var axis = void 0;
  var springCurve = void 0;

  (0, _popmotion.listen)(element, 'mousedown touchstart').start(function (e) {
    var _pointer$start = (0, _popmotion.pointer)({ x: 0, y: 0 }).start(function (_ref2) {
      var x = _ref2.x,
          y = _ref2.y;

      if (Math.abs(x) > THRESHOLD) {
        axis = 'x';
        direction = x < 0 ? 'left' : 'right';
        stop();
      } else if (Math.abs(y) > THRESHOLD) {
        axis = 'y';
        direction = y < 0 ? 'top' : 'bottom';
        stop();
      }

      if (direction === 'none') return;

      switch (direction) {
        case 'top':
          springCurve = (0, _transformers.nonlinearSpring)(1, 0);
          break;
        case 'bottom':
          springCurve = (0, _transformers.nonlinearSpring)(0.2, 0);
          break;
        case 'right':
        case 'left':
          springCurve = (0, _transformers.nonlinearSpring)(3, 0);
      }

      currentHandle = handle[axis];

      stopPointer = (0, _popmotion.chain)(oneDirectionalPointer(axis), (0, _calc.smooth)(30)).pipe(springCurve).start(currentHandle);
    }),
        stop = _pointer$start.stop;
  });

  (0, _popmotion.listen)(document, 'mouseup touchend').start(function (e) {
    stopPointer.stop();

    switch (direction) {
      case 'top':
        playPause();
        break;
      case 'left':
        previousSong();
        break;
      case 'right':
        nextSong();
        break;
      default:
        console.log('clicked!');
    }
    direction = 'none';
    axis = 'none';
    (0, _popmotion.spring)({
      from: currentHandle.get(),
      velocity: currentHandle.getVelocity()
    }).start(currentHandle);
  });
}

var style = (0, _picostyle2.default)(_hyperapp.h);

var Bubble = style('div')(function (props) {
  return {
    backgroundColor: props.playingState ? '#fce9c7' : '#fcfcff',
    transition: 'background-color 100ms',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    padding: '0.4em',
    display: 'flex',
    position: 'relative',
    height: '4em',
    cursor: 'default',
    boxShadow: '0 1px 17px -3px rgba(0,0,0, 0.1)'
  };
});

var Indicator = function Indicator() {
  return style('div')({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    position: 'absolute',
    left: '0px',
    top: '0px',
    marginTop: '0.4em'
  })({}, style('div')({
    height: '4px',
    width: '30px',
    backgroundColor: '#848484',
    borderRadius: '100px'
  }));
};
var SongCover = style('img')({
  height: '100%',
  borderRadius: '15px',
  boxSizing: 'border-box',
  border: '1px solid rgba(0, 0, 0, 0.16)',
  pointerEvents: 'none'
});

var Song = style('div')({
  fontWeight: 'bold'
});

var Artist = style('div')({
  fontWeight: 'normal'
});

var Info = style('div')({
  paddingLeft: '1em',
  alignSelf: 'center'
});

var Wrapper = style('div')({
  width: '100%',
  display: 'flex',
  position: 'absolute',
  bottom: '0px',
  padding: '1em',
  boxSizing: 'border-box',
  justifyContent: 'center'
});

var ScrubBar = function ScrubBar(props) {
  return (0, _hyperapp.h)(
    Wrapper,
    null,
    (0, _hyperapp.h)(
      Bubble,
      { playingState: props.playingState, oncreate: function (props) {
          return function (element) {
            return makeInteractive(element, props);
          };
        }(props) },
      (0, _hyperapp.h)(Indicator, null),
      (0, _hyperapp.h)(SongCover, { draggable: 'false', src: props.image }),
      (0, _hyperapp.h)(
        Info,
        null,
        (0, _hyperapp.h)(
          Song,
          null,
          props.playingState ? '► ' : '',
          props.name
        ),
        (0, _hyperapp.h)(
          Artist,
          null,
          props.artist
        )
      )
    )
  );
};

exports.default = ScrubBar;
},{"hyperapp":14,"picostyle":16,"popmotion":29,"popmotion/lib/transformers":30,"popmotion/lib/calc":31}],35:[function(require,module,exports) {
module.exports = "placeholder.7de1884c.jpg";
},{}],27:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _placeholder = require('./public/placeholder.jpg');

var _placeholder2 = _interopRequireDefault(_placeholder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
  name: 'Wowa CC0',
  artist: 'Wowa',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Bach Collection',
  artist: '...',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Wowa CC0',
  artist: 'Wowa',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Bach Collection',
  artist: '...',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Wowa CC0',
  artist: 'Wowa',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Bach Collection',
  artist: '...',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Wowa CC0',
  artist: 'Wowa',
  albumCoverUrl: _placeholder2.default
}, {
  name: 'Bach Collection',
  artist: '...',
  albumCoverUrl: _placeholder2.default
}];
},{"./public/placeholder.jpg":35}],8:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _hyperapp = require('hyperapp');

var _picostyle = require('picostyle');

var _picostyle2 = _interopRequireDefault(_picostyle);

var _albums = require('../albums.js');

var _albums2 = _interopRequireDefault(_albums);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var style = (0, _picostyle2.default)(_hyperapp.h);

var Header = function Header() {
  return style('header')({
    fontSize: '2em',
    maxWidth: '1100px',
    margin: '1em',
    '@media (min-width: 1000px)': {
      fontSize: '3em'
    },
    '@media (min-width: 1250px)': {
      margin: '0 auto'
    },
    ' .sub': {
      fontSize: '0.6em',
      marginTop: '-2em'
    }
  })({}, [(0, _hyperapp.h)(
    'h1',
    null,
    'Flamous'
  ), (0, _hyperapp.h)(
    'p',
    { 'class': 'sub' },
    'The best of Public Domain music.'
  )]);
};

var Gallery = function Gallery(props) {
  return style('div')({
    width: '100%',
    padding: '1em',
    boxSizing: 'border-box',
    marginBottom: '6em'
  })({}, (0, _hyperapp.h)(
    FlexWrapper,
    null,
    props.data.map(function (item) {
      return (0, _hyperapp.h)(Item, { image: item.albumCoverUrl, name: item.name, artist: item.artist });
    })
  ));
};
var FlexWrapper = style('div')({
  display: 'flex',
  flexWrap: 'wrap',
  maxWidth: '1250px',
  margin: '0 auto'
});

var Item = function Item(props) {
  return style('div')({
    color: '#212121',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.3em',
    padding: '1em',
    width: '50%',
    minWidth: '150px',
    // maxWidth: '250px',
    '@media (min-width: 1000px)': {
      width: '250px',
      maxWidth: '33%'
    },
    position: 'relative',
    flexGrow: '1',
    boxSizing: 'border-box',
    ' .secondary': {
      marginTop: '-1em',
      color: '#848484'
    }
  })({}, [(0, _hyperapp.h)(Cover, { src: props.image }), (0, _hyperapp.h)(
    'p',
    null,
    props.name
  ), (0, _hyperapp.h)(
    'p',
    { 'class': 'secondary' },
    'by ',
    props.artist
  )]);
};

var Cover = function Cover(props) {
  return style('img')({
    width: '100%'
  })({
    src: props.src
  });
};

var Page = style('article')({
  height: '100%',
  width: '100%',
  overflowY: 'auto',
  color: '#212121'
});

var Home = function Home() {
  return (0, _hyperapp.h)(
    Page,
    null,
    (0, _hyperapp.h)(Header, null),
    (0, _hyperapp.h)(Gallery, { data: _albums2.default })
  );
};

exports.default = Home;
},{"hyperapp":14,"picostyle":16,"../albums.js":27}],38:[function(require,module,exports) {
module.exports = "0.0abd2334.jpg";
},{}],39:[function(require,module,exports) {
module.exports = "1.21199a7a.jpg";
},{}],40:[function(require,module,exports) {
module.exports = "2.4aabedd5.jpg";
},{}],41:[function(require,module,exports) {
module.exports = "3.5d94764e.jpg";
},{}],42:[function(require,module,exports) {
module.exports = "4.81d24bb5.jpg";
},{}],43:[function(require,module,exports) {
module.exports = "5.afbcc001.jpg";
},{}],44:[function(require,module,exports) {
module.exports = "6.39e6b3a8.jpg";
},{}],45:[function(require,module,exports) {
module.exports = "7.9c63c940.jpg";
},{}],21:[function(require,module,exports) {
module.exports = {
  "0": require("./0.jpg"),
  "1": require("./1.jpg"),
  "2": require("./2.jpg"),
  "3": require("./3.jpg"),
  "4": require("./4.jpg"),
  "5": require("./5.jpg"),
  "6": require("./6.jpg"),
  "7": require("./7.jpg")
};
},{"./0.jpg":38,"./1.jpg":39,"./2.jpg":40,"./3.jpg":41,"./4.jpg":42,"./5.jpg":43,"./6.jpg":44,"./7.jpg":45}],46:[function(require,module,exports) {
module.exports = "0.ca5c42b4.mp3";
},{}],47:[function(require,module,exports) {
module.exports = "1.de706ed2.mp3";
},{}],48:[function(require,module,exports) {
module.exports = "2.765be34b.mp3";
},{}],49:[function(require,module,exports) {
module.exports = "3.186c9339.mp3";
},{}],50:[function(require,module,exports) {
module.exports = "4.db0b0919.mp3";
},{}],51:[function(require,module,exports) {
module.exports = "5.3df0ff33.mp3";
},{}],52:[function(require,module,exports) {
module.exports = "6.c7c83925.mp3";
},{}],53:[function(require,module,exports) {
module.exports = "7.91917103.mp3";
},{}],22:[function(require,module,exports) {
module.exports = {
  "0": require("./0.mp3"),
  "1": require("./1.mp3"),
  "2": require("./2.mp3"),
  "3": require("./3.mp3"),
  "4": require("./4.mp3"),
  "5": require("./5.mp3"),
  "6": require("./6.mp3"),
  "7": require("./7.mp3")
};
},{"./0.mp3":46,"./1.mp3":47,"./2.mp3":48,"./3.mp3":49,"./4.mp3":50,"./5.mp3":51,"./6.mp3":52,"./7.mp3":53}],6:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('./public/128/*.jpg');

var _2 = _interopRequireDefault(_);

var _3 = require('./public/songs/*.mp3');

var _4 = _interopRequireDefault(_3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
  id: 0,
  name: 'Trumpets in Your Ears',
  artist: 'Wowa & Chris Rede',
  album: 'Wowa CC0',
  url: _4.default[0],
  cover_art_url: _2.default[0]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 1,
  name: 'Pipo Interludo',
  artist: 'Pipo & Wowa',
  album: 'Wowa CC0',
  url: _4.default[1],
  cover_art_url: _2.default[1]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 2,
  name: 'Blue Sky',
  artist: 'Wowa & Chris Rede',
  album: 'Wowa CC0',
  url: _4.default[2],
  cover_art_url: _2.default[2]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 3,
  name: 'Voisin',
  artist: 'Wowa',
  album: 'Wowa CC0',
  url: _4.default[3],
  cover_art_url: _2.default[3]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 4,
  name: 'Piratos',
  artist: 'Wowa & Chris Rede',
  album: 'Wowa CC0',
  url: _4.default[4],
  cover_art_url: _2.default[4]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 5,
  name: 'Viviq',
  artist: 'Wowa',
  album: 'Wowa CC0',
  url: _4.default[5],
  cover_art_url: _2.default[5]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 6,
  name: 'Kring',
  artist: 'Wowa',
  album: 'Wowa CC0',
  url: _4.default[6],
  cover_art_url: _2.default[6]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}, {
  id: 7,
  name: 'Just Cool',
  artist: 'Wowa & eckskwisit',
  album: 'Wowa CC0',
  url: _4.default[7],
  cover_art_url: _2.default[7]
  // audio: new Audio(),
  // length: null,
  // currentPosition: null
}];
},{"./public/128/*.jpg":21,"./public/songs/*.mp3":22}],9:[function(require,module,exports) {
module.exports = "song_placeholder.8d83acaa.svg";
},{}],4:[function(require,module,exports) {
'use strict';

var _hyperapp = require('hyperapp');

var _amplitudejs = require('amplitudejs');

var _amplitudejs2 = _interopRequireDefault(_amplitudejs);

var _picostyle = require('picostyle');

var _picostyle2 = _interopRequireDefault(_picostyle);

var _ScrubBar = require('./components/ScrubBar.js');

var _ScrubBar2 = _interopRequireDefault(_ScrubBar);

var _Home = require('./components/Home.js');

var _Home2 = _interopRequireDefault(_Home);

var _songs = require('./songs.js');

var _songs2 = _interopRequireDefault(_songs);

var _song_placeholder = require('./public/song_placeholder.svg');

var _song_placeholder2 = _interopRequireDefault(_song_placeholder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var style = (0, _picostyle2.default)(_hyperapp.h); // import { h, app } from 'hyperapp'
// import songList from './songs.js'
// import ScrubBar from './components/ScrubBar.js'

// console.log(songList)

// const state = {
//   pages: [ // High level state of pages
//   ],
//   music: {
//     history: [],
//     isPlaying: false,
//     shuffle: true,
//     playingContext: null,
//     songs: songList
//   }
// }

// const actions = {
//   addPage: () => ({pages}) => ({
//     pages: (pages.push({id: pages.length}), pages)
//   }),
//   removePage: () => ({pages}) => ({
//     pages: (pages.pop(), pages)
//   }),
//   music: {
//     play: (id) => (state) => {
//       console.log(state)
//       console.log(id)
//       switch (id) {
//         case undefined:
//           if (state.playingContext) {
//             console.log('would continue to play song')
//           }
//           if (!state.playingContext) {
//             console.log('would start shuffle play')
//           }
//           break

//         default:
//           console.log('default')
//       }
//     },
//     pause: () => ({playingContext}) => {
//       if (!playingContext) {
//         console.log('nothing to pause')
//         return
//       }

//       console.log('would pause now')
//     }
//   }
// }

// const Page = ({id: pageNumber, addPage, removePage}) =>
//   h('div', { class: 'page-container' }, [
//     h('h1', {}, pageNumber),
//     h('button', {onclick: addPage}, '+ Add Page'),
//     h('button', {onclick: removePage}, '- Remove Page')
//   ])

// // const view = ({pages}, {addPage, removePage, music: {play, pause}}) =>
// //   h('div', {}, [
// //     h('h1', {}, 'Lowest level'),
// //     h('button', {onclick: () => play()}, 'play'),
// //     h('button', {onclick: () => pause()}, 'pause'),
// //     h('button', {onclick: addPage}, '+ Add Page'),
// //     // console.log(state)
// //     pages.map(({id}) => (
// //       Page({id, addPage, removePage})
// //     ))
// //   ])

// const view =
//   <main>
//     <ScrubBar />
//     <p>This is some Bodytext</p>
//   </main>

// console.info(ScrubBar)
// app(state, actions, view, document.body)

var AppShell = style('div')({
  height: '100%',
  width: '100%',
  position: 'relative'
});

_amplitudejs2.default.setDebug(true);
_amplitudejs2.default.init({
  songs: _songs2.default,
  default_album_art: _song_placeholder2.default,
  callbacks: {
    song_change: function song_change() {
      var meta = JSON.parse(JSON.stringify(_amplitudejs2.default.getActiveSongMetadata())); // Deep copy so we don't modify the original object
      var image = new window.Image();

      if (meta.cover_art_url) {
        image.src = meta.cover_art_url;

        if (!image.complete) {
          meta.cover_art_url = _song_placeholder2.default;
          image.onload = function () {
            meta.cover_art_url = image.src;
            flamous.updateMetaData(meta);
          };
        }
      }

      flamous.updateMetaData(meta);
    },
    before_play: function before_play() {
      flamous.setPlayState(true);
    },
    before_pause: function before_pause() {
      flamous.setPlayState(false);
    }
  }
});

var flamous = (0, _hyperapp.app)({
  playingState: false,
  playingContext: {
    artist: _songs2.default[0].artist,
    name: _songs2.default[0].name,
    cover_art_url: _songs2.default[0].cover_art_url || _amplitudejs2.default.getDefaultAlbumArt()
  }
}, {
  updateMetaData: function updateMetaData(metaData) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: metaData.name,
        artist: metaData.artist,
        artwork: [{
          src: metaData.cover_art_url
        }]
      });
    }

    return {
      playingContext: {
        artist: metaData.artist,
        name: metaData.name,
        cover_art_url: metaData.cover_art_url || _amplitudejs2.default.getDefaultAlbumArt()
      }
    };
  },
  setPlayState: function setPlayState(isPlaying) {
    return {
      playingState: isPlaying
    };
  }
}, function (_ref) {
  var playingContext = _ref.playingContext,
      playingState = _ref.playingState;
  return (0, _hyperapp.h)(
    AppShell,
    null,
    (0, _hyperapp.h)(_Home2.default, null),
    (0, _hyperapp.h)(_ScrubBar2.default, {
      playingState: playingState,
      playPause: playPause,
      nextSong: _amplitudejs2.default.next,
      previousSong: _amplitudejs2.default.prev,
      artist: playingContext.artist,
      name: playingContext.name,
      image: playingContext.cover_art_url })
  );
}, document.body);

function playPause() {
  console.log(_amplitudejs2.default.audio());
  if (!_amplitudejs2.default.audio().paused) {
    console.info('paused');
    _amplitudejs2.default.pause();
  } else {
    console.info('playing');
    _amplitudejs2.default.play();
  }
}

if ('mediaSession' in navigator) {
  var meta = navigator.mediaSession.setActionHandler;
  meta('play', _amplitudejs2.default.play);
  meta('pause', _amplitudejs2.default.pause);
  meta('previoustrack', _amplitudejs2.default.prev);
  meta('nexttrack', _amplitudejs2.default.next);
}
},{"hyperapp":14,"amplitudejs":15,"picostyle":16,"./components/ScrubBar.js":7,"./components/Home.js":8,"./songs.js":6,"./public/song_placeholder.svg":9}],91:[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';

var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };

  module.bundle.hotData = null;
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '36309' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();

      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');

      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);

      removeErrorOverlay();

      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;

  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';

  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},[91,4], null)
//# sourceMappingURL=src.4631146b.map