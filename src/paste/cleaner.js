/**
 * HTMLCleaner - Cleans input document accordingly to types.
 *
 * @author Matej Paulech <matej.paulech@gmail.com>
 */

goog.provide('takeNote.paste.Cleaner');

goog.require('takeNote.paste.Types');
goog.require('takeNote.paste.Styles');
goog.require('takeNote.paste.Walker');
goog.require('takeNote.paste.Writer');


/** @const */
takeNote.paste.START_TAG = 'st';
/** @const */
takeNote.paste.END_TAG = 'et';
/** @const */
takeNote.paste.TEXT = 'tx';
/** @const */
takeNote.paste.STANDELONE_ELEM = 'se';

/**
 * @constructor
 */
takeNote.paste.Cleaner = function () {
	this.writer = new takeNote.paste.Writer();
};

/**
 * Start cleaning
 * @param {Element} doc Document to clean
 * @param {function(Node)} callback Callback with result
 */
takeNote.paste.Cleaner.prototype.clean = function (doc, callback) {
	var walker = new takeNote.paste.Walker(doc);

	walker.onStart = function () {
		this.output = [];
		this.opened = [];
		this.block = [];
	}.bind(this);

	walker.onEnd = function () {
		while (this.opened.length > 0) {
			this.closeTag_(this.getParent_());
		}
		this.writer.parse(this.output, function (df) {
			callback(df);
		});
	}.bind(this);

	walker.onStartElement = function (elem, attrs) {
		this.openTag_(elem.toLowerCase(), attrs);
	}.bind(this);

	walker.onEndElement = function (elem) {
		this.closeTag_(elem.toLowerCase());
	}.bind(this);

	walker.onCharacters = function (chars) {
		chars = chars.replace('\n', '');
		if (chars.trim().length > 0) {
			this.text_(chars);
		}
	}.bind(this);

	walker.walk();
}

/**
 * Get name of last opened element.
 * @private
 * @return {string} Name of last opened element
 */
takeNote.paste.Cleaner.prototype.getParent_ = function () {
	return this.opened[this.opened.length - 1];
}

/**
 * Get name of last element in output. 
 * @private
 * @return {string} Name of last element in output
 */
takeNote.paste.Cleaner.prototype.lastOutput_ = function () {
	return this.output[this.output.length - 1];
}

/**
 * @private
 * @param {string} elem
 * @param {Array=} attrs
 * @return {Array}
 */
takeNote.paste.Cleaner.prototype.cleanAttributes_ = function (elem, attrs) {
	var out_attrs = [];
	var act_type = takeNote.paste.Types[elem];
	
	if (!act_type) {
		return out_attrs;
	}
	
	if (act_type.attributes) {
		var i = attrs.length;
		while (i--) {
			var cur_attr_name = attrs[i][0];
			var cur_attr_value = attrs[i][1];
			if (act_type.attributes[cur_attr_name]) {
				out_attrs.push(act_type.attributes[cur_attr_name](cur_attr_value));
			}
		}
	}

	if (act_type.tag_attrs) {
		var parent = this.getParent_();
		Object.keys(act_type.tag_attrs).forEach(function (attr) {
			out_attrs.push(act_type.tag_attrs[attr](parent));
		});
	}
	
	return out_attrs;
}

/**
 * @private
 * @param {string} elem
 * @param {Array=} attrs
 */
takeNote.paste.Cleaner.prototype.openTag_ = function (elem, attrs) {
	var act_type = takeNote.paste.Types[elem];
	
	// Find out, if element is in types
	if (!act_type) {
		return this.opened.push(elem);
	}
	
	// Find out, if element is replacable
	if (act_type.replace) {
		return this.openTag_(act_type.replace, attrs);
	}
	
	// Find out, if parent exists
	if (this.opened.length > 0) {
		// Find out, if element could be in parent
		var parent = this.getParent_();
		while ((this.opened.length > 0) && ((!takeNote.paste.Types[parent]) || (!takeNote.paste.Types[parent]['childs'][elem]))) {
			this.closeTag_(parent);
			parent = this.getParent_();
		}
	}
	
	// Find out, if element has required parent
	var parent = this.getParent_();
	if ((act_type.parents) && (!act_type.parents[parent])) {
		this.openTag_(Object.keys(act_type.parents)[0]);
	}
	// Find out, if one of parent elements is block, when there is a inline element -- TODO: remove dependency
	if ((act_type.type === 'inline') && (this.block.length === 0)) {
		this.openTag_('p');
	}
	
	// Find out, if element is standelone
	if (act_type.standelone) {
		return this.output.push([takeNote.paste.STANDELONE_ELEM, elem, this.cleanAttributes_(elem, attrs)]);
	}
	
	// Find out, if there is the same (inline) element opened
	if ((act_type.type === 'inline') && (this.opened.indexOf(elem) > -1)) {
		return;
	}
	
	// Create tag
	this.output.push([takeNote.paste.START_TAG, elem, this.cleanAttributes_(elem, attrs)]);
	this.opened.push(elem);
	if (act_type.type === 'block') {
		this.block.push(elem);
	}
	
	// Handling inline styles
	if (attrs) {
		var style_attr;
		for (var i = 0, ii = attrs.length; i < ii; i++) {
			if (attrs[i][0] === 'style') {
				style_attr = attrs[i][1];
				break;
			}
		}
		
		if (style_attr) {
			var styles = style_attr.split(/\s*;\s*/);
			for (var i = 0, ii = styles.length; i < ii; i++) {
				var style = styles[i].split(/\s*:\s*/);
				var style_name = style[0];
				var style_value = style[1];
				
				if (takeNote.paste.Styles[style_name]) {
					var result = takeNote.paste.Styles[style_name](style_value);
					if (result) {
						this.openTag_(result[0], (result[1]) ? [result[1]] : []);
					} 
				}
			}
		}
	} //if attrs
}

/**
 * @private
 * @param {string} txt
 */
takeNote.paste.Cleaner.prototype.text_ = function (txt) {
	// Find out, if there is some opened element -- TODO: remove dependency
	if (this.opened.length === 0) {
		this.openTag_('p');
		return this.output.push([takeNote.paste.TEXT, txt]);
	}
	
	var parent_type = takeNote.paste.Types[this.getParent_()];
	
	// Find out, if parent element is supported and if text could be in parent 
	if ((!parent_type) || (!parent_type['childs']['text'])) {
		return;
	}
	
	// Find out, if is opened required (block) element -- TODO: remove dependency
	if (this.block.length === 0) {
		this.openTag_('p');
	}
	
	this.output.push([takeNote.paste.TEXT, txt]);	
}

/**
 * @private
 * @param {string} elem
 */
takeNote.paste.Cleaner.prototype.closeTag_ = function (elem) {	
	var act_type = takeNote.paste.Types[elem];
	
	// Find out, if element is replacable
	if ((act_type) && (act_type.replace)) {
		elem = act_type.replace;
	}
	
	// Find out, if element is opened
	if (this.opened.indexOf(elem) === -1) {
		return;
	}
	
	// Iterate opened backward, while element is not closed
	var stop = false;
	var closing_tag;
	
	while ((!stop) && (closing_tag = this.opened.pop())) {
		var closing_type = takeNote.paste.Types[closing_tag];
		
		// Find out, if element is replacable
		if ((closing_type) && (closing_type.replace)) {
			closing_tag = closing_type.replace;
			closing_type = takeNote.paste.Types[closing_tag];
		}
		
		// This is the last iteration, if iterating element is same as closing element
		if (closing_tag === elem) {
			stop = true;
		}
		
		// Find out, if element is supported
		if (closing_type) {
			var last_output = this.lastOutput_();
			// Check out, if closing element is the same as the last element in output array
			if ((last_output[0] === takeNote.paste.START_TAG) && (last_output[1] === closing_tag)) {
				// Check out, if element could be empty
				if (closing_type.empty) {
					var poped_tag = this.output.pop();
					this.output.push([takeNote.paste.STANDELONE_ELEM, closing_tag, poped_tag[2]]);
				} else {
					this.output.pop();
				}
			} else {
				this.output.push([takeNote.paste.END_TAG, closing_tag]);
			}
			
			// Find out, if type of element was block
			if (closing_type.type === 'block') {
				this.block.pop();
			}
		} //end_if unsupported
	} // end_while
}