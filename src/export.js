goog.require('takeNote.Types');
goog.require('takeNote.Walker');
goog.require('takeNote.Editor');

goog.exportSymbol('takeNote.Editor', takeNote.Editor);

goog.exportProperty(takeNote.Editor.prototype, 'getArea', takeNote.Editor.prototype.getArea);
goog.exportProperty(takeNote.Editor.prototype, 'setActive', takeNote.Editor.prototype.setActive);

goog.exportProperty(takeNote.Editor.prototype, 'load', takeNote.Editor.prototype.load);
goog.exportProperty(takeNote.Editor.prototype, 'getXML', takeNote.Editor.prototype.getXML);

goog.exportProperty(takeNote.Editor.prototype, 'setInlineType', takeNote.Editor.prototype.setInlineType);
goog.exportProperty(takeNote.Editor.prototype, 'setBlockType', takeNote.Editor.prototype.setBlockType);

goog.exportProperty(takeNote.Editor.prototype, 'indentCurrentBlock', takeNote.Editor.prototype.indentCurrentBlock);
goog.exportProperty(takeNote.Editor.prototype, 'outdentCurrentBlock', takeNote.Editor.prototype.outdentCurrentBlock);
