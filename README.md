# emacs-incremental-search

```
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install --save-dev @types/vscode@1.55.0
   npm install
   npm run compile
   npm install -g vsce
   vsce package
```

This extension provides emacs-like incremental search function.

This extension is forked from [alt-core's fork](https://github.com/alt-core/vsc-incremental-search) [ of siegebell's "Incremental search for multiple cursors" extension](https://github.com/siegebell/vsc-incremental-search).

## Features

### Forward search
- Default binding: `ctrl+s`
- Command: `extension.incrementalSearch.forward`

Enters incremental search mode and subsequently advances each cursor to the next match, selecting it.

### Backwards search
- Default binding: `ctrl+r`
- Command: `extension.incrementalSearch.backward`

Enters incremental search mode and subsequently advances each cursor to the next match and selecting it, in the reverse direction.

### Expand selection by the next forward match
- Default binding: `ctrl+shift+s` (when in incremental search mode)
- Command: `extension.incrementalSearch.expand`

Instead of moving the selections to the next match, this adds the next matches to the existing selection.

### Expand selection by the next backwards match
- Default binding: `ctrl+shift+r` (when in incremental search mode)
- Command: `extension.incrementalSearch.backwardExpand`

Expands the selections with a backwards search.

### Toggle regular expressions vs plain-text search terms
- Default binding: `alt+r` (when in incremental search mode)
- Command: `extension.incrementalSearch.toggleRegExp`

The search term is interpreted as a regular expression when enabled, or as plain text otherwise.

### Toggle case sensitivity
- Default binding: `alt+c` (when in incremental search mode)
- Command: `extension.incrementalSearch.toggleCaseSensitivity`

Toggles whether the match should be case sensitive.

## Known Issues

## Release Notes

See CHANGELOG.md
