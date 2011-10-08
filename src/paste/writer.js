goog.provide('takeNote.paste.Writer');

goog.require('takeNote.paste.Types');


/**
 * @constructor
 */
takeNote.paste.Writer = function () {

}

/**
 * @param {Array} input
 * @param {function(Node)} callback
 */
takeNote.paste.Writer.prototype.parse = function (input, callback) {
	var doc = document.createDocumentFragment();
	this.elements = [doc];
	this.level = 0;

	for (var i = 0, ii = input.length; i < ii; i++) {
		var type = input[i][0];
		var value = input[i][1];
		var attrs = input[i][2];

		switch (type) {
			case takeNote.paste.START_TAG:
				this.writeStartTag_(value, attrs);
				break;
			case takeNote.paste.END_TAG:
				this.writeEndTag_(value);
				break;
			case takeNote.paste.STANDELONE_ELEM:
				this.writeStandeloneTag_(value, attrs);
				break;
			case takeNote.paste.TEXT:
				this.writeText_(value);
				break;
		}
	}

	callback(doc);
}

/**
 * @private
 * @param {Element} out_el
 * @param {Array} attrs
 */
takeNote.paste.Writer.prototype.setAttributes_ = function (out_el, attrs) {
	if (attrs) {
		var i = attrs.length;
		while (i--) {
			out_el.setAttribute(attrs[i][0], attrs[i][1]);
		}
	}
} 

/**
 * @private
 * @param {string} elem
 * @param {Array} attrs
 */
takeNote.paste.Writer.prototype.writeStartTag_ = function (elem, attrs) {
	var act_type = takeNote.paste.Types[elem];
	if ((act_type) && (act_type.tag_name)) {
		var el = document.createElement(act_type.tag_name);
		this.setAttributes_(el, attrs)
		this.elements.push(el);
		this.level++;
	}
}

/**
 * @private
 * @param {string} elem
 * @param {Array} attrs
 */
takeNote.paste.Writer.prototype.writeStandeloneTag_ = function (elem, attrs) {
	var act_type = takeNote.paste.Types[elem];
	if ((act_type) && (act_type.tag_name)) {
		var el = document.createElement(act_type.tag_name);
		this.setAttributes_(el, attrs);
		this.elements[this.level].appendChild(el);
	}
}

/**
 * @private
 * @param {string} elem
 */
takeNote.paste.Writer.prototype.writeEndTag_ = function (elem) {
	var act_type = takeNote.paste.Types[elem];
	if ((act_type) && (act_type.tag_name)) {
		var el = this.elements.pop();
		this.level--;
		this.elements[this.level].appendChild(el);
	}
}

/**
 * @private
 * @param {string} txt
 */
takeNote.paste.Writer.prototype.writeText_ = function(txt) {
	var tn = document.createTextNode(txt);
	this.elements[this.level].appendChild(tn);
}