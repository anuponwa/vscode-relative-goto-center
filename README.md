# relative-goto-center README


## Features

Inspiration from `relative goto` and `metaGo` extensions. At first, I wanted to adjust some behavior, but as I was editing, I ended up start fresh and rewrote the whole thing.

- Go to relative line and center -- Go to the beginning of the specified line and center. `alt+g`
- Select to relative line and center -- Select whole lines startig where the cursor is currently at. Either `alt+shift+g` or `alt+s`
- Ability to swap the cursor of selection region (`swapSelectionAnchor`). `alt+a`
- Line selection (smart) that adds from the firstNonWhite space down and can be expanded. `ctrl+l`
- Line selection (smart) that expands up and down with `ctrl+l` and `ctrl+o`
- Go to bracket (smart) that improves upon the built-in from vs-code. The cursor will stay inside the matching brackets. `ctrl+shift+\`

Both `Go to` and `Select` will center after the command

With `Select to relative line and center`, it will select from the first character of the top line to the last character of the bottom line.

## Extension Settings

Currently, there are no extension settings. I should add in the future, e.g., to make it either center or not after the command is run.

## Known Issues

No known issues as of now.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.1.0

- Fix `selectTo` from select to the first character at column 0 to the firstNonWhite character
- Add `swapSelectionAnchor`
- Add `selectSmartLine`
- Add `selectUpSmart`
- Add `gotoBracketSmart`

### 0.0.1

First version that delivers the gist of this extension -- go and select to a relative line number

---
