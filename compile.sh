#!/bin/bash

./lib/closure-library/bin/calcdeps.py \
	--output_mode compiled \
	--compiler_jar ./lib/closure-library/compiler.jar \
	--path ./lib/closure-library/goog \
	--path ./src \
	--input ./src/export.js \
	--compiler_flags "--output_wrapper=(function(window,document){%output%}(window,document));" \
	--compiler_flags "--compilation_level=ADVANCED_OPTIMIZATIONS" \
	--compiler_flags "--warning_level=VERBOSE" \
> dist/take-note.js