/**
 * TakeNote
 * List-based WYSIWYG editor
 * --
 * @author Jan Kuca <jan@jankuca.com>, http://jankuca.com
 */


goog.provide('takeNote.Editor');

goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.dom.Range');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('takeNote.Types');
goog.require('takeNote.Walker');


// dependency fix (warning, bad type annotation, unknown type goog.events.EventTarget)
goog.addDependency('', [
	'goog.events.EventTarget',
	'goog.events.EventHandler',
	'goog.debug.ErrorHandler'
], []);


/**
 * @const
 * @type {string}
 */
takeNote.DEFAULT_BLOCK_TYPE = 'text';


/**
 * @constructor
 * @param {Element} area The editing area
 */
takeNote.Editor = function (area) {
	if (!area) {
		throw new Error('Editor area element does not exist.');
	}

	this.active = false;

	/** @protected */
	this.area_ = area;

	/**
	 * @type {string}
	 * @protected
	 */
	this.block_type_key_ = takeNote.DEFAULT_BLOCK_TYPE;

	/**
	 * UID for plugin instances
	 * Required for plugin matching when exporting the contents
	 * @type {number}
	 */
	this.plugin_counter_ = 0;

	/**
	 * Plugins in use
	 * @type {Array.<Object>}
	 */
	this.plugins_by_id_ = [];

	/**
	 * Map of plugin states
	 * Updated when serializing the editor via getXML
	 * @type {Array.<*>}
	 */
	this.plugin_states_ = [];
};

/**
 * Returns the editing area element passed to the constructor
 * @return {!Element}
 */
takeNote.Editor.prototype.getArea = function () {
	return this.area_;
};

/**
 * Takes an XML string and loads its contents into the editor area
 * @param {string} xml The XML string to load
 * @param {Document=} document The document object to use to create elements
 */
takeNote.Editor.prototype.load = function (xml, document) {
	document = document || window.document;

	var walker = new takeNote.Walker(
		this.getDocumentFromXML(xml).firstChild, false);
	var area = document.createDocumentFragment();

	var open_cnt = null;
	var open_list = area;
	walker.onblockstart = function (block) {
		var type = takeNote.Types[block.type];
		if (!type) {
			// Ignore unknown block types
			return false;
		}

		var node = document.createElement('li');
		goog.dom.dataset.set(node, 'type', block.type);
		if (block.list) {
			goog.dom.dataset.set(node, 'list', block.list);
		}
		var cnt = goog.isFunction(type.toDOM) ? type.toDOM(block) : document.createElement(type.tagName);
		var child_list = document.createElement('ul');
		goog.dom.appendChild(node, cnt);
		goog.dom.appendChild(node, child_list);
		goog.dom.appendChild(open_list, node);
		open_cnt = cnt
		open_list = child_list;
	};
	walker.onblockend = function (block) {
		var parent_list = open_list.parentNode.parentNode;
		if (open_list.childNodes.length === 0) {
			goog.dom.removeNode(open_list);
		}
		open_cnt = null;
		open_list = parent_list || area;
	};
	walker.oninlinestart = function (inline) {
		var type = takeNote.Types[inline.type];
		if (!type) {
			// Ignore unknown inline types
			return false;
		}

		var node = document.createElement(type.tagName);
		if (type.className) {
			node.className = type.className;
		}
		goog.dom.appendChild(open_cnt, node);
		open_cnt = node;
	};
	walker.oninlineend = function (inline) {
		open_cnt = open_cnt.parentNode;
	};
	walker.ontext = function (text) {
		var node = document.createTextNode(text);
		goog.dom.appendChild(open_cnt, node);
	};
	walker.walk();

	this.area_.innerHTML = '';
	goog.dom.appendChild(this.area_, area);
};

/**
 * Converts an XML string to a Document
 * @param {string} xml The XML string to convert to a Document
 * @return {Document}
 */
takeNote.Editor.prototype.getDocumentFromXML = function (xml) {
	var doc;
	if (typeof DOMParser !== 'undefined') {
		doc = new DOMParser().parseFromString(xml, 'text/xml');
	} else {
		doc = new ActiveXObject('Microsoft.XMLDOM');
	  doc.async = 'false';
	  doc.loadXML(xml); 
	}
	return doc;
};

/**
 * Converts an HTML string to a Document
 * @param {string} html The HTML string to convert to a Document
 * @return {Element}
 */
takeNote.Editor.prototype.getDocumentFromHTML = function (html) {
    var container = document.createElement('div');
    container.innerHTML = html;
    return container;
};

/**
 * Converts the area contents into XML and returns it
 * @param {function(string)} callback The callback function to which to pass the XML
 * @param {boolean=} prettyprint Whether to print indentation and line breaks
 */
takeNote.Editor.prototype.getXML = function (callback, prettyprint) {
	var self = this;

	this.requestPluginStates_(function () {
		var walker = new takeNote.Walker(self.area_, true);
		var xml = '<?xml version="1.0" encoding="utf-8"?>';
		xml += "\n" + '<root>';
		var level = 1;
		walker.onblockstart = function (block) {
			var type = takeNote.Types[block.type];

			var plugin_key = goog.dom.dataset.get(block.node, 'plugin');
			if (plugin_key) {
				block.plugin = takeNote.Plugins[plugin_key];
			}
			var plugin_id = goog.dom.dataset.get(block.node, 'plugin_id');
			if (plugin_id) {
				block.plugin_state = self.plugin_states_[Number(plugin_id)];
			}

			xml += prettyprint ? "\n" + goog.string.repeat('  ', level) : '';
			if (type.toXML) {
				xml += type.toXML(block) || '';
			} else {
				xml += '<' + block.type;
				if (block.list) {
					xml += ' list="' + block.list + '"';
				}
				xml += '>';
			}
			level += 1;
		};
		walker.ontext = function (text) {
			xml += '<![CDATA[' + text + ']]>';
		};
		walker.oninlinestart = function (inline) {
			xml += '<' + inline.type + '>';
		};
		walker.oninlineend = function (inline) {
			xml += '</' + inline.type + '>';
		};
		walker.onblockend = function (block) {
			level -= 1;
			xml += '</' + block.type + '>';
		};
		walker.walk();
		xml += prettyprint ? "\n" : '';
		xml += '</root>' + "\n";

		callback(xml);
	});
};

takeNote.Editor.prototype.requestPluginStates_ = function (callback) {
	var states = this.plugin_states_;
	var plugins = this.plugins_by_id_;
	var ii = plugins.length;
	(function iter(i) {
		if (i < ii) {
			var plugin = plugins[i];
			if (!plugin) {
				iter(++i);
			} else if (goog.isFunction(plugin['getState'])) {
				states[i] = plugin['getState'](function (async_result) {
					states[i] = async_result;
					iter(++i);
				});
				if (states[i]) {
					iter(++i)
				}
			}
		} else {
			callback();
		}
	}(0));
};

/**
 * Toggles an inline type
 * @param {string} key
 */
takeNote.Editor.prototype.setInlineType = function (key) {
	var blocks = this.getCurrentBlocks_();
	if (!blocks.length) {
		// Implies the selection being outside the editor area
		return;
	}

	var range = /** @type {!goog.dom.AbstractRange} */ goog.dom.Range.createFromWindow();
	var start_node = range.getStartNode();
	var end_node = range.getEndNode();
	var end_offset = range.getEndOffset();
	var in_range = false;
	blocks.some(function (block) {
		var cont = block.firstChild;
		var r = range.clone();
		var native_r = r.getBrowserRangeObject();
		if (!in_range) {
			if (goog.dom.contains(cont, start_node)) {
				if (goog.dom.contains(cont, end_node)) {
					this.applyInlineTypeToRange_(r, key);
					return true;
				}

				in_range = true;
				native_r.setEnd(cont, cont.childNodes.length);
				this.applyInlineTypeToRange_(r, key);
			}
		} else {
			native_r.setStart(cont, 0);
			if (goog.dom.contains(cont, end_node)) {
				native_r.setEnd(end_node, end_offset);
				this.applyInlineTypeToRange_(r, key);
				return true;
			} else {
				native_r.setEnd(cont, cont.childNodes.length);
				this.applyInlineTypeToRange_(r, key);
			}
		}
	}, this);

	//var saved = goog.dom.Range.createFromWindow().saveUsingCarets();
	//this.applyInlineTypeToRange_(range, key);
	//saved.restore();
};

/**
 * Finds a way to apply an inline type to a range and does just that
 * @param {!goog.dom.AbstractRange} range The range to apply the type to
 * @param {string} key An inline type key
 */
takeNote.Editor.prototype.applyInlineTypeToRange_ = function (range, key) {
	var type = takeNote.Types[key];

	if (range.isCollapsed()) {
		alert('not implemented');
	} else {
		var cont = range.getContainer();
		var frag = range.getBrowserRangeObject().cloneContents();
		
		// standalone? (text<tag>selection</tag>text)
		// cont = selection
		if (cont.nodeType === cont.TEXT_NODE) {
			var cont_parent = cont.parentNode; // cont_parent = <tag>
			if (cont_parent.tagName === type.tagName && (cont_parent.className || null) === (type.className || null)) {
				frag = document.createDocumentFragment();
				frag.appendChild(cont_parent);
			}
		}

		var olds = Array.prototype.slice.call(
			goog.dom.getElementsByTagNameAndClass(type.tagName, type.className, frag));
		var ii = olds.length;
		if (ii) {
			var old;
			for (var i = 0; old = olds[i]; ++i) {
				while (old.firstChild) {
					old.parentNode.insertBefore(old.firstChild, old);
				}
				old.parentNode.removeChild(old);
			}
			range.replaceContentsWithNode(frag);
		} else {
			var node = goog.dom.createDom(type.tagName);
			if (type.className) {
				node.className = type.className;
			}
			node.appendChild(frag);
			range.replaceContentsWithNode(node);
		}
	}
};

/**
 * @param {!Object} type An inline type
 * @return {!Element}
 */
takeNote.Editor.prototype.createInlineTypeNode_ = function (type) {
	var node = goog.dom.createDom(type.tagName);
	if (type.className) {
		node.className = type.className;
	}
	return node;
};

/**
 * Toggles a block type
 * @param {string} key
 */
takeNote.Editor.prototype.setBlockType = function (key) {
	var type = takeNote.Types[key];

	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		var current_cnt = block.firstChild;
		var cnt = goog.dom.createDom(type.tagName, null);

		var range = goog.dom.Range
			.createFromNodeContents(current_cnt)
			.getBrowserRangeObject();

		goog.dom.dataset.set(block, 'type', key);
		goog.dom.append(cnt, current_cnt.childNodes);
		goog.dom.insertSiblingBefore(cnt, current_cnt);
		goog.dom.removeNode(current_cnt);
	});

	this.block_type_key_ = key;
	saved.restore();
};

/**
 * Toggles a list type of the current block
 * @param {?string} key
 * @param {boolean=} dont_overwrite Whether the operation should not
 *   be performed when the current block already has a list type set
 */
takeNote.Editor.prototype.setListType = function (key, dont_overwrite) {
	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		var current_type = goog.dom.dataset.get(block, 'list');
		if (!dont_overwrite || !current_type) {
			if (key === null) {
				goog.dom.dataset.remove(block, 'list');
			} else {
				goog.dom.dataset.set(block, 'list', key);
			}
			block.className += ' a';
			block.className = '';
		}
	});

	saved.restore();
};

/**
 * Activates/deactivates the editor
 * @param {boolean} active
 */
takeNote.Editor.prototype.setActive = function (active) {
	if (active) {
		if (!this.area_.innerHTML) {
			this.erase();
		}
		this.addListeners_();
	}

	goog.dom.setProperties(this.area_, {
		'contentEditable': active
	});
	this.active = active;
};

/**
 * Erases the area and creates one block of the default type
 */
takeNote.Editor.prototype.erase = function () {
	this.area_.innerHTML = '';
	this.blockTypeKey_ = takeNote.DEFAULT_BLOCK_TYPE;
	this.addBlock(this.block_type_key_);
};

/**
 * Inserts a new block after the active one
 * @param {string=} key Type key of the new block.
 *   Defaults to the currently active type or its "next" setting.
 * @param {boolean=} dont_move_caret Whether the caret should be moved
 *   into the newly created block
 * @return {Element} The newly created block
 */
takeNote.Editor.prototype.addBlock = function (key, dont_move_caret) {
	key = key || this.getNextBlockTypeKey_();
	var type = takeNote.Types[key];

	var block = goog.dom.createDom('li');
	var cnt = goog.dom.createDom(type.tagName);
	goog.dom.appendChild(block, cnt);
	goog.dom.dataset.set(block, 'type', key);

	var current_blocks = this.getCurrentBlocks_();
	var current_block = current_blocks[0];
	if (current_block) {
		// Keep previous list type
		var list_type = goog.dom.dataset.get(current_block, 'list');
		if (list_type) {
			block.setAttribute('data-list', list_type);
		}

		var current_cnt = current_block.firstChild;
		if (current_cnt.lastChild) {
			// Empty block
			var range = goog.dom.Range.createFromWindow().getBrowserRangeObject();
			range.setEnd(current_cnt, current_cnt.childNodes.length);
			goog.dom.appendChild(cnt, range.extractContents());
		}
		goog.dom.insertSiblingAfter(block, current_block);
	} else {
		// Either the area is empty or the caret is outside of the area.
		goog.dom.appendChild(this.area_, block);
	}
	// Set the caret
	if (!dont_move_caret) {
		goog.dom.Range.createCaret(cnt, 0).select();
	}

	return block;
};

/**
 * Inserts a new "standalone" block after the active one
 *   A standalone block is a block which is not editable.
 *   It is intended to be used for third-party components.
 * @param {string} key Type key of the new block.
 *   Defaults to the currently active type or its "next" setting.
 * @param {string=} plugin_key Plugin key to use
 * @param {Object=} plugin Plugin object
 * @return {Element} The newly created block
 */
takeNote.Editor.prototype.addStandaloneBlock = function (key, plugin_key, plugin) {
	var block = this.addBlock(key, true);
	block.setAttribute('contenteditable', false);
	if (plugin_key) {
		goog.dom.dataset.set(block, 'plugin', plugin_key);
	}

	if (plugin) {
		var plugin_id = this.plugin_counter_++;
		this.plugins_by_id_[plugin_id] = plugin;
		goog.dom.dataset.set(block, 'plugin_id', String(plugin_id));
	}

	this.fixArea_();
	return block;
};

/**
 * Indents the current block
 */
takeNote.Editor.prototype.indentCurrentBlock = function () {
	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		var prev = /** @type {Element} */ block.previousSibling;
		// Do not indent first-child items
		if (!prev) {
			return;
		}

		goog.dom.appendChild(this.getChildList_(prev), block);
	});

	saved.restore();
};

/**
 * Outdents the current block
 */
takeNote.Editor.prototype.outdentCurrentBlock = function () {
	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var self = this;
	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		var parent = block.parentNode;
		// Check for minimal indentation
		if (parent === self.area_) {
			return;
		}

		goog.dom.insertSiblingAfter(block, parent.parentNode);

		// Remove empty child list
		if (parent.childNodes.length === 0) {
			goog.dom.removeNode(parent);
		}
	});

	saved.restore();
};

/**
 * Moves the current block up within its parent list
 */
takeNote.Editor.prototype.moveBlockUp = function () {
	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		var prev = block.previousSibling;
		if (prev) {
			goog.dom.insertSiblingBefore(block, prev);
		}
	});

	saved.restore();
};

/**
 * Moves the current block down within its parent list
 */
takeNote.Editor.prototype.moveBlockDown = function () {
	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		var next = block.nextSibling;
		if (next) {
			goog.dom.insertSiblingAfter(block, next);
		}
	});

	saved.restore();
};

/**
 * Returns a child list element of the given block. If there is not one,
 *   it is created.
 * @param {!Element} block
 * @return {!Element} The child list element
 */
takeNote.Editor.prototype.getChildList_ = function (block) {
	var list = block.lastChild;
	if (list.tagName !== goog.dom.TagName.UL) {
		list = goog.dom.createDom('ul');
		list.setAttribute('contenteditable', true);
		goog.dom.appendChild(block, list);
	}
	return /** @type {!Element} */ list;
};

/**
 * @return {string}
 */
takeNote.Editor.prototype.getNextBlockTypeKey_ = function () {
	var type = takeNote.Types[this.block_type_key_];
	if (type.nextBlockType) {
		return type.nextBlockType;
	}
	return this.block_type_key_;
};

/**
 * @return {Array.<Element>} The deepest blocks containing the current selection.
 */
takeNote.Editor.prototype.getCurrentBlocks_ = function () {
	var range = goog.dom.Range.createFromWindow();
	if (range === null) {
		return [];
	}

	return this.getBlocksFromRange_(range);
};

takeNote.Editor.prototype.getBlocksFromRange_ = function (range) {
	var cont = range.getContainer();

	// Check if we are in the area
	if (!goog.dom.contains(this.area_, cont)) {
		return [];
	}
	// Empty area?
	if (cont === this.area_ && this.area_.childNodes.length === 0) {
		return [];
	}


	// Multiple blocks
	if (cont.tagName === goog.dom.TagName.UL) {
		var blocks = [];
		var possible_blocks = cont.getElementsByTagName(goog.dom.TagName.LI);
		var reached_range = false;
		var start = range.getStartNode();
		var end = range.getEndNode();
		Array.prototype.some.call(possible_blocks, function (block) {
			if (!reached_range) {
				if (goog.dom.contains(block, start)) {
					reached_range = true;
					blocks.push(block);
				}
			} else {
				blocks.push(block);
				return goog.dom.contains(block, end);
			}
		});
		return blocks;
	}

	// Find the closest parent block
	do {
		if (cont.tagName === goog.dom.TagName.LI) {
			return /** @type {Array.<Element>} */ [ cont ];
		}
		cont = cont.parentNode;
	} while (cont !== this.area_);
	return []; // Unreachable
};

/**
 * Adds event listeners needed for the editor to work
 */
takeNote.Editor.prototype.addListeners_ = function () {
	goog.events.listen(this.area_, goog.events.EventType.KEYDOWN, this.onKeyDown_, false, this);
	goog.events.listen(this.area_, goog.events.EventType.KEYUP, this.onKeyUp_, false, this);
};

/**
 * Handles keydown events
 * @param {goog.events.Event} e
 */
takeNote.Editor.prototype.onKeyDown_ = function (e) {
	switch (e.keyCode) {
		case goog.events.KeyCodes.ENTER:
			e.preventDefault();
			this.addBlock();
			break;
		case goog.events.KeyCodes.TAB:
			e.preventDefault();
			if (e.shiftKey) {
				this.outdentCurrentBlock();
			} else {
				this.indentCurrentBlock();
			}
			break;
		case goog.events.KeyCodes.BACKSPACE:
			var block = this.getCurrentBlocks_()[0];
			var range = goog.dom.Range.createFromWindow();
			if (range.isCollapsed() && range.getStartNode().parentNode === block.firstChild && range.getStartOffset() === 0) {
				var prev = goog.dom.dataset.get(block, 'list');
				if (prev) {
					this.setListType(null);
					e.preventDefault();
				}
			}
			break;
		case goog.events.KeyCodes.UP:
			if ((e.ctrlKey && e.metaKey) || (e.ctrlKey && e.shiftKey)) {
				this.moveBlockUp();
				e.preventDefault();
			}
			break;
		case goog.events.KeyCodes.DOWN:
			if ((e.ctrlKey && e.metaKey) || (e.ctrlKey && e.shiftKey)) {
				this.moveBlockDown();
				e.preventDefault();
			}
			break;
	}
};

/**
 * Handles keyup events
 * @param {goog.events.Event} e
 */
takeNote.Editor.prototype.onKeyUp_ = function (e) {
	this.fixArea_();
	switch (e.keyCode) {
		case goog.events.KeyCodes.BACKSPACE:
		case goog.events.KeyCodes.DELETE:
			this.removeAppleSpans_();
			break;
	}
};

/**
 * Fixes the editing area
 */
takeNote.Editor.prototype.fixArea_ = function () {
	var area = this.area_;
	if (!area.lastChild || area.lastChild.nodeType !== area.ELEMENT_NODE) {
		var cnt = /** @type {!Element} */ this.addBlock(takeNote.DEFAULT_BLOCK_TYPE).firstChild;
		for (var i = 0; area.firstChild
			&& area.firstChild.nodeType !== area.ELEMENT_NODE; ++i) {
			goog.dom.insertChildAt(cnt, area.firstChild, i);
		}
		if (i) {
			goog.dom.Range.createCaret(cnt, i).select();
		}
	} else {
		var last_block = /** @type {!Element} */ area.lastChild;
		if (goog.dom.dataset.get(last_block, 'type') !== takeNote.DEFAULT_BLOCK_TYPE) {
			var block = this.addBlock(takeNote.DEFAULT_BLOCK_TYPE, true);
			goog.dom.appendChild(area, block);
		}
	}
};

/**
 * Replaces each span.Apple-style-span element with its contents
 */
takeNote.Editor.prototype.removeAppleSpans_ = function () {
	var apples = goog.dom.getElementsByTagNameAndClass(
		'span', 'Apple-style-span', this.area_);
	var i = apples.length;
	var apple, child;
	while (apple = apples[--i]) {
		var o = apple.childNodes.length;
		while (child = apple.childNodes[--o]) {
			goog.dom.insertSiblingBefore(child, apple);
		}
		goog.dom.removeNode(apple);
	}
};

/**
 * Normalizes (concantates text nodes in) the current block
 */
takeNote.Editor.prototype.normalizeCurrentBlock_ = function () {
	var blocks = this.getCurrentBlocks_();
	blocks.forEach(function (block) {
		block.firstChild.normalize();
	});
};
