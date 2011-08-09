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
takeNote.DEFAULT_BLOCK_TYPE = 'paragraph';

takeNote.ListTypes = [
	[ 'dash', /^-\s/ ],
	[ 'arrow', /^->\s/ ],
	[ 'fat-arrow', /^=>\s/ ]
];

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
	this.blockTypeKey_ = takeNote.DEFAULT_BLOCK_TYPE;
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
 */
takeNote.Editor.prototype.load = function (xml) {
	var doc = this.getDocumentFromXML(xml);
	var walker = new takeNote.Walker(doc.firstChild, false);
	var area = document.createDocumentFragment();

	var open_cnt = null;
	var open_list = area;
	walker.onblockstart = function (block) {
		var type = takeNote.Types[block.type];
		var node = goog.dom.createDom('li');
		goog.dom.dataset.set(node, 'type', block.type);
		if (block.list) {
			goog.dom.dataset.set(node, 'list', block.type);
		}
		var cnt = goog.dom.createDom(type.tagName);
		var child_list = goog.dom.createDom('ul');
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
		var node = goog.dom.createDom(type.tagName);
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
 * Converts the area contents into XML and returns it
 * @param {boolean=} prettyprint Whether to print indentation and line breaks
 * @return {string} The XML
 */
takeNote.Editor.prototype.getXML = function (prettyprint) {
	var walker = new takeNote.Walker(this.area_, true);
	var xml = '<?xml version="1.0" encoding="utf-8"?>';
	xml += "\n" + '<root>';
	var level = 1;
	walker.onblockstart = function (block) {
		xml += prettyprint ? "\n" + goog.string.repeat('  ', level) : '';
		xml += '<' + block.type;
		if (block.list) {
			xml += ' list="' + block.list + '"';
		}
		xml += '>';
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
	return xml;
};

/**
 * Toggles an inline type
 * @param {string} key
 */
takeNote.Editor.prototype.setInlineType = function (key) {
	try {
		var block = this.getCurrentBlock_();
		if (!block) {
			// Implies the selection being outside the editor area
			return;
		}
	} catch (err) {
		// More than one block is selected.
		// Implies the selection being only in the editor area
	}

	var range = /** @type {!goog.dom.AbstractRange} */ goog.dom.Range.createFromWindow();
	this.applyInlineTypeToRange_(range, key);
};

/**
 * Finds a way to apply an inline type to a range and does just that
 * @param {!goog.dom.AbstractRange} range The range to apply the type to
 * @param {string} key An inline type key
 */
takeNote.Editor.prototype.applyInlineTypeToRange_ = function (range, key) {
	var type = takeNote.Types[key];

	var cont = range.getContainer();

	if (!range.isCollapsed()) {
		var contents = cont;
		if (cont.tagName !== goog.dom.TagName.UL
			&& cont.tagName !== goog.dom.TagName.LI) {
			contents = range.getBrowserRangeObject().cloneContents();
		}
		var olds = goog.dom.getElementsByTagNameAndClass(
			type.tagName, type.className, contents);
		var i = olds.length;
		// If there are parts of the range of the target type, remove them.
		if (i !== 0) {
			var old, child;
			while (old = olds[--i]) {
				while (child = old.firstChild) {
					(old.parentNode || contents).insertBefore(child, old);
				}
				goog.dom.removeNode(old);
			}

			if (cont !== contents) {
				range.replaceContentsWithNode(contents);
			}
		} else {
			var type_node = this.createInlineTypeNode_(type);
			try {
				range.surroundContents(type_node);
			} catch (err) {
				// BAD_BOUNDARYPOINTS_ERR

				// Determine whether more than one block is selected
				// Being inside the editor area is implied thus we do not need to worry about that.
				/*var start_block = goog.dom.getAncestorByTagName(range.getStartNode(), goog.dom.TagName.LI);
				var end_block = goog.dom.getAncestorByTagName(range.getEndNode(), goog.dom.TagName.LI);
				if (start_block === end_block) {
					// We cannot just surround the selection. That already failed above.
				} else {*/

				var iterator = range.__iterator__();
				var node, r;
				
				if (cont.tagName === goog.dom.TagName.UL) {
					
				}

				node = iterator.next(); // start node
				r = goog.dom.Range.createFromNodeContents(node);
				r.getBrowserRangeObject().setStart(node, range.getStartOffset());
				this.applyInlineTypeToRange_(r, key);

				var prev = node;
				while (node !== range.getEndNode()) {
					if (node.tagName === goog.dom.TagName.LI
						&& prev.tagName === goog.dom.TagName.LI) {
						// begining of a block inside the selection
						r = /** @type {!goog.dom.AbstractRange} */ goog.dom.Range.createFromNodeContents(node);
						this.applyInlineTypeToRange_(r, key);
					}
					prev = node;
					node = iterator.next();
				}

				// node === range.getEndNode()
				r = /** @type {!goog.dom.AbstractRange} */ goog.dom.Range.createFromNodeContents(node);
				r.getBrowserRangeObject().setEnd(node, range.getEndOffset());
				this.applyInlineTypeToRange_(r, key);
			}
		}
	} else {
		// todo: apply type to the word the caret is currently in
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

	var block = this.getCurrentBlock_();
	var current_cnt = block.firstChild;
	var cnt = goog.dom.createDom(type.tagName, null);

	var saved = goog.dom.Range.createFromWindow().saveUsingCarets();

	var range = goog.dom.Range
		.createFromNodeContents(current_cnt)
		.getBrowserRangeObject();

	goog.dom.dataset.set(block, 'type', key);
	goog.dom.appendChild(cnt, range.extractContents());
	goog.dom.insertSiblingBefore(cnt, current_cnt);
	goog.dom.removeNode(current_cnt);

	this.blockTypeKey_ = key;
	saved.restore();
};

/**
 * Toggles a list type of the current block
 * @param {string} key
 * @param {boolean=} dont_overwrite Whether the operation should not
 *   be performed when the current block already has a list type set
 * @param {boolean=} rm_prefix Whether the prefix (e.g. '-> ') should be trimmed
 */
takeNote.Editor.prototype.setListType = function (key, dont_overwrite, rm_prefix) {
	var block = this.getCurrentBlock_();
	var current_type = goog.dom.dataset.get(block, 'list');
	if (!dont_overwrite || !current_type) {
		goog.dom.dataset.set(block, 'list', key);

		if (rm_prefix) {
			var cnt = block.firstChild;
			var node = cnt.firstChild;
			while (node && node.nodeType !== node.TEXT_NODE) {
				node = node.firstChild;
			}
			if (node) {
				node.data = node.data.replace(/^\W+\s/, '');
			}
		}
	}
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
	this.addBlock(this.blockTypeKey_);
};

/**
 * Inserts a new block after the active one
 * @param {string=} key Type key of the new block.
 *   Defaults to the currently active type or its "next" setting.
 * @param {boolean=} dont_move_caret Whether the caret should be moved
 *   into the newly created block
 * @return {Node} The newly created block
 */
takeNote.Editor.prototype.addBlock = function (key, dont_move_caret) {
	key = key || this.getNextBlockTypeKey_();
	var type = takeNote.Types[key];

	var block = goog.dom.createDom('li');
	var cnt = goog.dom.createDom(type.tagName);
	goog.dom.appendChild(block, cnt);
	goog.dom.dataset.set(block, 'type', key);

	var current_block = this.getCurrentBlock_();
	if (current_block) {
		var current_cnt = current_block.firstChild;
		if (current_cnt.lastChild) {
			// Empty block
			var range = goog.dom.Range.createFromWindow().getBrowserRangeObject();
			range.setEnd(current_cnt.lastChild, current_cnt.lastChild.length);
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
 * Indents the current block
 */
takeNote.Editor.prototype.indentCurrentBlock = function () {
	var block = this.getCurrentBlock_();
	if (block) {
		var prev = /** @type {Element} */ block.previousSibling;
		// Do not indent first-child items
		if (!prev) {
			return;
		}

		var saved = goog.dom.Range.createFromWindow().saveUsingCarets();
		goog.dom.appendChild(this.getChildList_(prev), block);
		saved.restore();
	}
};

/**
 * Outdents the current block
 */
takeNote.Editor.prototype.outdentCurrentBlock = function () {
	var block = this.getCurrentBlock_();
	if (block) {
		var parent = block.parentNode;
		// Check for minimal indentation
		if (parent === this.area_) {
			return;
		}

		var saved = goog.dom.Range.createFromWindow().saveUsingCarets();
		goog.dom.insertSiblingAfter(block, parent.parentNode);
		saved.restore();

		// Remove empty child list
		if (parent.childNodes.length === 0) {
			goog.dom.removeNode(parent);
		}
	}
};

/**
 * Moves the current block up within its parent list
 */
takeNote.Editor.prototype.moveBlockUp = function () {
	var block = this.getCurrentBlock_();
	if (block) {
		var prev = block.previousSibling;
		if (prev) {
			var saved = goog.dom.Range.createFromWindow().saveUsingCarets();
			goog.dom.insertSiblingBefore(block, prev);
			saved.restore();
		}
	}
};

/**
 * Moves the current block down within its parent list
 */
takeNote.Editor.prototype.moveBlockDown = function () {
	var block = this.getCurrentBlock_();
	if (block) {
		var next = block.nextSibling;
		if (next) {
			var saved = goog.dom.Range.createFromWindow().saveUsingCarets();
			goog.dom.insertSiblingAfter(block, next);
			saved.restore();
		}
	}
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
		goog.dom.appendChild(block, list);
	}
	return /** @type {!Element} */ list;
};

/**
 * @return {string}
 */
takeNote.Editor.prototype.getNextBlockTypeKey_ = function () {
	var type = takeNote.Types[this.blockTypeKey_];
	if (type.nextBlockType) {
		return type.nextBlockType;
	}
	return this.blockTypeKey_;
};

/**
 * @return {Element?} The deepest block containing the current selection.
 *   Null if there is no selection or there is no block that would contain
 *   the whole selection.
 */
takeNote.Editor.prototype.getCurrentBlock_ = function () {
	var range = goog.dom.Range.createFromWindow();
	if (range === null) {
		return null;
	}

	return this.getBlockFromRange_(range);
}

takeNote.Editor.prototype.getBlockFromRange_ = function (range) {
	var cont = range.getContainer();

	// Check if we are in the area
	if (!goog.dom.contains(this.area_, cont)) {
		return null;
	}
	if (cont === this.area_ && this.area_.childNodes.length === 0) {
		return null;
	}

	if (cont.tagName === goog.dom.TagName.UL) {
		throw new Error('More than one block in the range');
	}

	// Find the closest parent block
	do {
		if (cont.tagName === goog.dom.TagName.LI) {
			return /** @type {Element} */ cont;
		}
		cont = cont.parentNode;
	} while (cont !== this.area_);
	return null; // Unreachable
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
		case goog.events.KeyCodes.UP:
			if (e.ctrlKey && e.shiftKey) {
				this.moveBlockUp();
			}
			break;
		case goog.events.KeyCodes.DOWN:
			if (e.ctrlKey && e.shiftKey) {
				this.moveBlockDown();
			}
			break;
	}
};

/**
 * Handles keyup events
 * @param {goog.events.Event} e
 */
takeNote.Editor.prototype.onKeyUp_ = function (e) {
	switch (e.keyCode) {
		case goog.events.KeyCodes.BACKSPACE:
		case goog.events.KeyCodes.DELETE:
			this.removeAppleSpans_();
			break;
		default:
			if (e.keyCode > 48) {
				this.processCurrentBlock_();
			}
	}
};

/**
 * Scans contents of the current block and performs operations
 *   if specific rules match
 */
takeNote.Editor.prototype.processCurrentBlock_ = function () {
	var block = this.getCurrentBlock_();
	var text = goog.dom.getTextContent(block);
	for (var i = 0, type; type = takeNote.ListTypes[i]; ++i) {
		if (type[1].test(text)) {
			this.setListType(type[0], true, true);
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
	var block = this.getCurrentBlock_();
	if (block !== null) {
		block.firstChild.normalize();
	}
};
