goog.provide('takeNote.paste.Writer');

goog.require('takeNote.paste.Types');


/**
 * @constructor
 */
takeNote.paste.Writer = function () {

}

/**
 * @param {Array} input
 * @param {function(string)} callback
 */
takeNote.paste.Writer.prototype.parse = function (input, callback) {
	this.cdata_opened = false;
	this.output = [];

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

	var output = this.output.join('');
	output = output.replace(/&(?!#?\w{1,10};)/g, '&amp;');
	callback(output);
}

/**
 * @private
 */
takeNote.paste.Writer.prototype.openCDATA_ = function () {
	if (!this.cdata_opened) {
		this.cdata_opened = true;
		this.output.push('<![CDATA[');
	}
}

/**
 * @private
 */
takeNote.paste.Writer.prototype.closeCDATA_ = function () {
	if (this.cdata_opened) {
		this.cdata_opened = false;
		this.output.push(']]>');
	}
}

/**
 * @private
 * @param {string} elem
 * @param {Array} attrs
 * @return {string}
 */
takeNote.paste.Writer.prototype.getAttributes_ = function(elem, attrs) {
	var out_attrs = [];
	
	var i = attrs.length;
	while (i--) {
		out_attrs.push(attrs[i][0] + '="' + attrs[i][1] + '"');
	}
	
	return (out_attrs.length > 0) ? ' ' + out_attrs.join(' ')  : '';
}

/**
 * @private
 * @param {string} elem
 * @param {Array} attrs
 */
takeNote.paste.Writer.prototype.writeStartTag_ = function (elem, attrs) {
	var act_type = takeNote.paste.Types[elem];
	if ((act_type) && (act_type.tag_name)) {
		this.closeCDATA_();
		this.output.push('<' + act_type.tag_name + this.getAttributes_(elem, attrs) + '>')
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
		this.closeCDATA_();
		this.output.push('<' + act_type.tag_name + this.getAttributes_(elem, attrs) + '/>');
	}
}

/**
 * @private
 * @param {string} elem
 */
takeNote.paste.Writer.prototype.writeEndTag_ = function (elem) {
	var act_type = takeNote.paste.Types[elem];
	if ((act_type) && (act_type.tag_name)) {
		this.closeCDATA_();
		this.output.push('</' + act_type.tag_name + '>');
	}
}

/**
 * @private
 * @param {string} txt
 */
takeNote.paste.Writer.prototype.writeText_ = function(txt) {
	this.openCDATA_();
	this.output.push(txt);
}