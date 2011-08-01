goog.require('goog.string');
goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('takeNote.Editor');

window.onload = function () {
	var area = goog.dom.getElement('area');
	var editor = new takeNote.Editor(area);
	window.editor = editor;
	editor.setActive(true);

	var onBlock = function (e) {
		e.preventDefault();
		editor.setBlockType(goog.dom.dataset.get(e.target, 'type'));
	};
	var onInline = function (e) {
		e.preventDefault();
		editor.setInlineType(goog.dom.dataset.get(e.target, 'type'));
	};
	var onSave = function (e) {
		goog.dom.getElement('output').innerHTML = goog.string.htmlEscape(
			editor.getXML());
	};

	var toolbar = goog.dom.getElement('toolbar');
	var button;

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	});
	button.innerHTML = 'Strong';
	button.style.fontWeight = 'bold';
	goog.events.listen(button, goog.events.EventType.CLICK, onInline);
	goog.dom.dataset.set(button, 'type', 'strong');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	});
	button.innerHTML = 'Underlined';
	button.style.textDecoration = 'underline';
	goog.events.listen(button, goog.events.EventType.CLICK, onInline);
	goog.dom.dataset.set(button, 'type', 'u');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	});
	button.innerHTML = 'Emphasis';
	button.style.fontStyle = 'italic';
	button.style.marginRight = '5px';
	goog.events.listen(button, goog.events.EventType.CLICK, onInline);
	goog.dom.dataset.set(button, 'type', 'em');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	});
	button.innerHTML = 'Highlight';
	button.style.background = '#FFA';
	goog.events.listen(button, goog.events.EventType.CLICK, onInline);
	goog.dom.dataset.set(button, 'type', 'highlight');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	});
	button.innerHTML = 'Strike';
	button.style.color = '#888';
	button.style.textDecoration = 'line-through';
	button.style.marginRight = '5px';
	goog.events.listen(button, goog.events.EventType.CLICK, onInline);
	goog.dom.dataset.set(button, 'type', 'strike');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	}, 'Paragraph');
	goog.events.listen(button, goog.events.EventType.CLICK, onBlock);
	goog.dom.dataset.set(button, 'type', 'paragraph');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	}, 'Heading 1');
	goog.events.listen(button, goog.events.EventType.CLICK, onBlock);
	goog.dom.dataset.set(button, 'type', 'h1');
	goog.dom.appendChild(toolbar, button);

	button = goog.dom.createDom('a', {
		href: 'javascript:;'
	}, 'Heading 2');
	goog.events.listen(button, goog.events.EventType.CLICK, onBlock);
	goog.dom.dataset.set(button, 'type', 'h2');
	goog.dom.appendChild(toolbar, button);

	goog.events.listen(goog.dom.getElement('save'),
		goog.events.EventType.CLICK, onSave);
};
