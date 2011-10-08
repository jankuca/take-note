goog.provide('takeNote.paste.Walker');


/**
 * @constructor
 * @param {Element} list A list of block nodes
 */
takeNote.paste.Walker = function (list) {
	if (!list) {
		throw new Error('List element does not exist.');
	}

	this.list = list;
	this.level = 0;
};

takeNote.paste.Walker.prototype.walk = function () {
	this.onStart();
	this.handleNodes(this.list.childNodes);
};

/**
 * @param {NodeList|Array} blocks The block nodes to handle
 */
takeNote.paste.Walker.prototype.handleNodes = function (blocks) {
	Array.prototype.forEach.call(blocks, function (node) {		
		// On Node Start
		this.level += 1;
		switch (node.nodeType) {
			case 1:
				var node_attrs = node.attributes;				
				var attrs = [];
				if (node_attrs) {
					for (var i = 0, ii = node_attrs.length; i < ii; i++) {
						attrs.push([node_attrs[i].name, node_attrs[i].value]);
					}
				}
				this.onStartElement(node.nodeName, attrs);
				break;
			case 3:
				this.onCharacters(node.nodeValue);
				break;
		}

		var child_list = node.childNodes;
		this.handleNodes(child_list);

		// On Node End
		this.level -= 1;
		switch (node.nodeType) {
			case 1:
				this.onEndElement(node.nodeName);
				break;
		}
	}, this);

	if (this.level === 0) {
		this.onEnd();
	}
};
