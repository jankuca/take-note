TakeNote
========

TakeNote is a simple WYSIWYG editor that takes works with XML and HTML.

It is based on Google Closure Library and works great with Google Closure Compiler.

Usage
-----

    /** @type {Element} */
    var area;
    
    /** @type {string} */
    var xml =
    	'<?xml version="1.0" encoding="utf-8"?>\
    	'<root> ... </root>';
    
    var editor = new takeNote.Editor(area);
    editor.loadXML(xml);
    editor.setActive(true);

API
---

    /**
     * @constructor
     * @param {Element} area The editing area
     */
    takeNote.Editor = function (area) {};
    
    /**
     * Returns the editing area element passed to the constructor
     * @return {!Element}
     */
    takeNote.Editor.prototype.getArea = function () {};
    
    /**
     * Activates/deactivates the editor
     * @param {boolean} active
     */
    takeNote.Editor.prototype.setActive = function (active) {};
    
    /**
     * Takes an XML string and loads its contents into the editor area
     * @param {string} xml The XML string to load
     */
    takeNote.Editor.prototype.load = function (xml) {};
    
    /**
     * Converts the area contents into XML and returns it
     * @param {boolean=} prettyprint Whether to print indentation and line breaks
     * @return {string} The XML
     */
    takeNote.Editor.prototype.getXML = function (prettyprint) {};
    
    /**
     * Toggles a block type
     * @param {string} key
     */
    takeNote.Editor.prototype.setBlockType = function (key) {};
    
    /**
     * Toggles an inline type
     * @param {string} key
     */
    takeNote.Editor.prototype.setInlineType = function (key) {};
    
    /**
     * Indents the current block
     */
    takeNote.Editor.prototype.indentCurrentBlock = function () {};
    
    /**
     * Outdents the current block
     */
    takeNote.Editor.prototype.outdentCurrentBlock = function () {};


Compilation
-----------

You can either use the raw source code or the compiled version. If you want to compile the source yourself using Google Closure Compiler, you can run one of the following commands.

To get a standalone single-file library that you can include in any web application, use the `export.js` file as the entry point.

    python ../closure-library/bin/calcdeps.py \
    	--output_mode compiled \
    	--compiler_jar compiler.jar \
    	--compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
    	--compiler_flags="--warning_level=VERBOSE" \
    	--compiler_flags="--output_wrapper=\"(function(window,document){%output%}(window,document));\"" \
    	--path ../closure-library/ \
    	--path src/ \
    	--input src/export.js \
    > dist/take-note.js

If your application is based on Google Closure Library, just use the regular `goog.require` dependency system to include the editor. The only thing you need is to add the `src` directory to your compilation command.

    --path src/