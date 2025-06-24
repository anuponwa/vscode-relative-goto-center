// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  // Setup
  // Preview decoration
  const previewDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#506373ba', // light blue
    isWholeLine: true
  });

  let lastLineSelection: vscode.Selection | null = null;

  // Go to relative command
  const goCommand = vscode.commands.registerCommand('relative-goto-center.goto', async () => {
    // The code you place here will be executed every time your command is executed
    // Get the relative line number from the user...
    // const input = await vscode.window.showInputBox({
    //   prompt: "Enter relative line number (+/-)",
    //   validateInput: (value) => {
    //     return /^-?\d+$/.test(value) ? null : "Please enter a valid number";
    //   }
    // });

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let input: string | undefined;

    try {
      input = await vscode.window.showInputBox({
        value: "0",
        prompt: "Enter relative line number (+/-)",
        validateInput: (value) => {
          const delta = parseInt(value, 10);
          if (isNaN(delta)) return "Enter a number";

          const current = editor.selection.active.line;
          const target = Math.max(0, Math.min(editor.document.lineCount - 1, current + delta));
          const targetPos = new vscode.Position(target, 0);

          editor.setDecorations(previewDecorationType, [new vscode.Range(targetPos, targetPos)]);
          return null;
        }
      });
    } finally {
      editor.setDecorations(previewDecorationType, []); // always remove preview
    }

    if (input === undefined || input === "") return; // user cancelled
    if (!input) return;

    // Always remove preview
    editor.setDecorations(previewDecorationType, []);

    const delta = parseInt(input, 10);

    // Get the new position
    const currentLine = editor.selection.active.line;
    const targetLine = Math.max(0, Math.min(editor.document.lineCount - 1, currentLine + delta));

    const targetLineText = editor.document.lineAt(targetLine).text
    const firstNonWhitespaceChar = targetLineText.search(/\S|$/);
    const newPosition = new vscode.Position(targetLine, firstNonWhitespaceChar);

    // Go to the relative line and center the viewport
    editor.selection = new vscode.Selection(newPosition, newPosition);
    editor.revealRange(new vscode.Range(newPosition, newPosition), vscode.TextEditorRevealType.InCenter);
  });


  // Select to relative line command
  const selectCommand = vscode.commands.registerCommand('relative-goto-center.selectTo', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let input: string | undefined;

    // Get the relative line number from the user...
    try {
      input = await vscode.window.showInputBox({
        value: "0",
        prompt: "Enter relative line number (+/-)",
        validateInput: (value) => {
          const delta = parseInt(value, 10);
          if (isNaN(delta)) return "Enter a number";

          const current = editor.selection.active.line;
          const target = Math.max(0, Math.min(editor.document.lineCount - 1, current + delta));

          const minLine = Math.min(current, target);
          const maxLine = Math.max(current, target);
          const minLineText = editor.document.lineAt(minLine).text;

          const firstNonWhitespaceChar = minLineText.search(/\S|$/);
          const startPos = new vscode.Position(minLine, firstNonWhitespaceChar);
          const endPos = new vscode.Position(maxLine, editor.document.lineAt(maxLine).text.length);

          editor.setDecorations(previewDecorationType, [new vscode.Range(startPos, endPos)]);
          return null;
        }
      });
    } finally {
      editor.setDecorations(previewDecorationType, []); // always remove preview
    }

    if (input === undefined || input === "") return; // user cancelled
    if (!input) return;

    // Always remove preview
    editor.setDecorations(previewDecorationType, []);

    const delta = parseInt(input, 10);

    // Find the anchor, positions, ...
    const anchor = editor.selection.active;
    const currentLine = anchor.line;
    const targetLine = currentLine + delta;

    let safeStart: number;
    let safeEnd: number;

    // See if there's any existing selection
    // If there is, extend the selection from existing
    const hasSelection = !editor.selection.isEmpty;
    if (hasSelection) {
      // There is a selection

      // current selection in the editor
      const selection = editor.selection;
      const selectionFirstLine = Math.min(selection.start.line, selection.end.line);
      const selectionLastLine = Math.max(selection.start.line, selection.end.line);

      // new range
      const startLine = Math.min(currentLine, targetLine);
      const endLine = Math.max(currentLine, targetLine);

      // compare new range to the existing selection range
      const newStart = Math.min(selectionFirstLine, startLine);
      const newEnd = Math.max(selectionLastLine, endLine);

      // Clamp
      safeStart = Math.max(0, Math.min(newStart, editor.document.lineCount - 1));
      safeEnd = Math.max(0, Math.min(newEnd, editor.document.lineCount - 1));

    } else {
      // No selection

      const startLine = Math.min(currentLine, targetLine);
      const endLine = Math.max(currentLine, targetLine);

      // Clamp to file bounds
      safeStart = Math.max(0, Math.min(startLine, editor.document.lineCount - 1));
      safeEnd = Math.max(0, Math.min(endLine, editor.document.lineCount - 1));
    }

    // Get the positions
    const firstNonWhitespaceChar = editor.document.lineAt(safeStart).text.search(/\S|$/);
    const startPos = new vscode.Position(safeStart, firstNonWhitespaceChar);
    const endLineText = editor.document.lineAt(safeEnd).text;
    const endPos = new vscode.Position(safeEnd, endLineText.length);

    const selection = delta < 0
      ? new vscode.Selection(endPos, startPos) // cursor at top
      : new vscode.Selection(startPos, endPos); // cursor at bottom

    editor.selection = selection;
    lastLineSelection = selection;
    editor.revealRange(new vscode.Range(editor.selection.active, editor.selection.active), vscode.TextEditorRevealType.InCenter);

  });

  const swapSelectionCommand = vscode.commands.registerCommand('relative-goto-center.swapSelectionAnchor', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selections.length === 0) return;

    const selections = editor.selections.map(sel =>
      new vscode.Selection(sel.active, sel.anchor) // swap anchor and active
    );

    editor.selections = selections;
    editor.revealRange(new vscode.Range(editor.selection.active, editor.selection.active), vscode.TextEditorRevealType.InCenter);

  });

  const selectSmartLine = vscode.commands.registerCommand('relative-goto-center.selectSmartLine', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const currentLine = editor.selection.active.line;

    let startLine: number, endLine: number;

    // Expand selection if already in progress
    if (lastLineSelection && editor.selection.isEqual(lastLineSelection)) {
      startLine = lastLineSelection.start.line;
      endLine = Math.min(doc.lineCount - 1, lastLineSelection.end.line + 1);
    } else {
      startLine = currentLine;
      endLine = currentLine;
    }

    const startText = doc.lineAt(startLine).text;
    const startChar = startText.search(/\S|$/); // first visible character

    const startPos = new vscode.Position(startLine, startChar);
    const endPos = doc.lineAt(endLine).range.end;

    const selection = new vscode.Selection(startPos, endPos);
    editor.selection = selection;

    lastLineSelection = selection;

    // Re-center the active cursor
    editor.revealRange(
      new vscode.Range(editor.selection.active, editor.selection.active),
      vscode.TextEditorRevealType.InCenter
    );
  });

  const selectUpSmart = vscode.commands.registerCommand('relative-goto-center.selectUpSmart', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const sel = editor.selection;

    // No selection, ignore
    if (sel.isEmpty) return;

    const anchor = sel.anchor;
    const active = sel.active;

    const anchorLine = anchor.line;
    const activeLine = active.line;

    let startLine: number;
    let endLine: number;

    if (activeLine > anchorLine) {
      // selection is downward — shrink one line up
      startLine = anchorLine;
      endLine = activeLine - 1;
    } else {
      // upward direction — expand one more line up
      startLine = Math.max(0, activeLine - 1);
      endLine = anchorLine;
    }

    const startText = doc.lineAt(startLine).text;
    const startChar = startText.search(/\S|$/);
    const startPos = new vscode.Position(startLine, startChar);
    const endPos = doc.lineAt(endLine).range.end;

    const selection = new vscode.Selection(endPos, startPos);
    editor.selection = selection;
    editor.revealRange(new vscode.Range(startPos, startPos), vscode.TextEditorRevealType.InCenter);

    lastLineSelection = selection;
  });

  const jumpInsideBracket = vscode.commands.registerCommand('relative-goto-center.gotoBracketSmart', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;


    const matchingPairs: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']',
      ')': '(',
      '}': '{',
      ']': '[',
    };

    // const isClosing = [')', '}', ']'].includes(currentChar);

    // if (!isOpening && !isClosing) return;

    // Use built-in command to find the matching bracket
    vscode.commands.executeCommand('editor.action.jumpToBracket').then(() => {
      const newPos = editor.selection.active;
      const doc = editor.document;
      const currentChar = doc.getText(new vscode.Range(newPos, newPos.translate(0, 1)));
      const isOpening = ['(', '{', '['].includes(currentChar);

      // Move inside the bracket
      const offset = isOpening ? 1 : 0;
      const adjusted = new vscode.Position(newPos.line, newPos.character + offset);
      editor.selection = new vscode.Selection(adjusted, adjusted);
      editor.revealRange(new vscode.Range(adjusted, adjusted), vscode.TextEditorRevealType.InCenter);
    });
  });

  context.subscriptions.push(goCommand);
  context.subscriptions.push(selectCommand);
  context.subscriptions.push(swapSelectionCommand);
  context.subscriptions.push(selectSmartLine);
  context.subscriptions.push(selectUpSmart);
  context.subscriptions.push(jumpInsideBracket);

}



// This method is called when your extension is deactivated
export function deactivate() { }
