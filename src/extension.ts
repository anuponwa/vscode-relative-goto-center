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
    const newPosition = new vscode.Position(targetLine, 0);

    // Go to the relative line and center the viewport
    editor.selection = new vscode.Selection(newPosition, newPosition);
    editor.revealRange(new vscode.Range(newPosition, newPosition), vscode.TextEditorRevealType.InCenter);
  });


  // Select to relative line command
  const selectCommand = vscode.commands.registerCommand('relative-goto-center.select', async () => {
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
          const startPos = new vscode.Position(Math.min(current, target), 0);
          const endPos = new vscode.Position(Math.max(current, target), editor.document.lineAt(target).text.length);

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

    const startLine = Math.min(currentLine, targetLine);
    const endLine = Math.max(currentLine, targetLine);

    // Clamp to file bounds
    const safeStart = Math.max(0, Math.min(startLine, editor.document.lineCount - 1));
    const safeEnd = Math.max(0, Math.min(endLine, editor.document.lineCount - 1));

    // Get the positions
    const startPos = new vscode.Position(safeStart, 0);
    const endLineText = editor.document.lineAt(safeEnd).text;
    const endPos = new vscode.Position(safeEnd, endLineText.length);

    const selection = new vscode.Selection(startPos, endPos);
    editor.selection = selection;
    editor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);
  });

  context.subscriptions.push(goCommand);
  context.subscriptions.push(selectCommand);
}

// This method is called when your extension is deactivated
export function deactivate() { }
