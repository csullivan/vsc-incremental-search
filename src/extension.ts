// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { IncrementalSearch, SearchDirection, SearchOptions } from './IncrementalSearch';
import { SearchStatusBar } from './SearchStatusBar';
import * as configuration from './Configuration';
const INCREMENTAL_SEARCH_CONTEXT = 'incrementalSearch';


let status: SearchStatusBar;
let searches = new Map<vscode.TextEditor, IncrementalSearch>();

let cancellationSource = null;

let dbg = vscode.window.createOutputChannel("IncrementalSearch-extension");

// var registeredTypeCommand = false;
var context: vscode.ExtensionContext | null = null;

function registerTextEditorCommand(commandId: string, run: (editor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) => void): void {
  context!.subscriptions.push(vscode.commands.registerTextEditorCommand(commandId, run));
}

function registerCommand(commandId: string, run: (...args: any[]) => void): void {
  context!.subscriptions.push(vscode.commands.registerCommand(commandId, run));
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(activationContext: vscode.ExtensionContext) {
  context = activationContext;

  vscode.commands.executeCommand('setContext', 'incrementalSearch', false);

  // if(selectionDecoration)
  //   selectionDecoration.dispose();
  // selectionDecoration = vscode.window.createTextEditorDecorationType({
  //   backgroundColor: 'rgba(0,0,255,0.5)',
  //   borderRadius: '50%',
  //   border: '1pt rgba(0,0,100,0.8) solid',
  // });
  // matchDecoration = vscode.window.createTextEditorDecorationType(configuration.get().matchStyle);
  // context.subscriptions.push(matchDecoration);

  status = new SearchStatusBar('extension.incrementalSearch.toggleCaseSensitivity', 'extension.incrementalSearch.toggleRegExp');
  context.subscriptions.push(status);
  configuration.activate();

  registerTextEditorCommand('extension.incrementalSearch.forward', (editor) => {
    advanceSearch(editor, { direction: SearchDirection.forward });
  });

  registerTextEditorCommand('extension.incrementalSearch.backward', (editor: vscode.TextEditor) => {
    advanceSearch(editor, { direction: SearchDirection.backward });
  });

  registerTextEditorCommand('extension.incrementalSearch.expand', (editor: vscode.TextEditor) => {
    advanceSearch(editor, { expand: true, direction: SearchDirection.forward });
  });

  registerTextEditorCommand('extension.incrementalSearch.backwardExpand', (editor: vscode.TextEditor) => {
    advanceSearch(editor, { expand: true, direction: SearchDirection.backward });
  });

  registerTextEditorCommand('extension.incrementalSearch.toggleRegExp', (editor: vscode.TextEditor) => {
    const search = searches.get(editor);
    if (search) {
      updateSearch(search, { useRegExp: !search.useRegExp });
    }

    context.globalState.update("useRegExp", search!.useRegExp);
  });
  registerTextEditorCommand('extension.incrementalSearch.toggleCaseSensitivity', (editor: vscode.TextEditor) => {
    const search = searches.get(editor);
    if (search) {
      updateSearch(search, { caseSensitive: !search.caseSensitive });
    }

    context.globalState.update("caseSensitive", search!.caseSensitive);
  });
  registerTextEditorCommand('extension.incrementalSearch.centerText', (editor: vscode.TextEditor) => {
    IncrementalSearch.centerText();
  });

  // registerTextEditorCommand('extension.incrementalSearch.stop', (editor) => {
  //   cancelSearch(editor);
  // });
  registerTextEditorCommand('extension.incrementalSearch.stop', (editor: vscode.TextEditor) => {
    dbg.appendLine("cancel search called");
    if (cancellationSource != null) {
      cancellationSource.cancel();
    }
    cancelSearch(editor);
  });
  vscode.window.onDidChangeActiveTextEditor(async () => {
    const search = searches.get(vscode.window.activeTextEditor!);
    if (search) {
      status.show();
      await vscode.commands.executeCommand('setContext', 'incrementalSearch', true);
      updateSearch(search, {});
    } else {
      status.hide();
      await vscode.commands.executeCommand('setContext', 'incrementalSearch', false);
    }
  });
}

function cancelSearch(editor: vscode.TextEditor) {
  let search = searches.get(editor)
  if (search)
    search.cancelSelections();
  stopSearch(editor, "stop command");
}

async function stopSearch(editor: vscode.TextEditor, reason: string, forwardCommand = '', ...args: any[]) {
  const search = searches.get(editor);
  try {
    await vscode.commands.executeCommand('setContext', 'incrementalSearch', false);
  } catch (e) { }

  if (search) {
    console.log("search stopped: " + reason);
    clearMatchDecorations(search);
    searches.delete(editor);
  }

  status.hide();

  try {
    if (forwardCommand)
      await vscode.commands.executeCommand(forwardCommand, args);
  } catch (e) {

  }
}

let previousSearchTerm = '';
async function doSearch(editor: vscode.TextEditor, options: SearchOptions) {
  if (searches.has(editor))
    return;

  const search = new IncrementalSearch(editor, options);
  searches.set(editor, search);
  status.update(search.searchTerm!, search.caseSensitive!, search.useRegExp!, { backward: search.direction == SearchDirection.backward });
  status.show();
  await vscode.commands.executeCommand('setContext', 'incrementalSearch', true);

  try {
    updateSearch(search, { searchTerm: 'previousText' });
    cancellationSource = new vscode.CancellationTokenSource();
    let token = cancellationSource.token;
    const searchTerm = await vscode.window.showInputBox({
      value: previousSearchTerm,
      prompt: "incremental search",
      placeHolder: "enter a search term",
      validateInput: (text: string) => {
        const result = updateSearch(search, { searchTerm: text });
        return result.error;
      }
    }, token);
    cancellationSource.dispose();
    cancellationSource = null;
    if (search.searchTerm) {
      previousSearchTerm = search.searchTerm;
    }

    if (searchTerm !== undefined && search.searchTerm) {
      stopSearch(editor, 'complete');
    } else {
      if (search)
        search.cancelSelections();
      stopSearch(editor, 'cancelled by user');
    }
  } catch (e) {
    console.error(e);
  }
}

function advanceSearch(editor: vscode.TextEditor, options: SearchOptions) {
  const search = searches.get(editor);
  if (!search) {
    const useRegExp = context!.globalState.get<boolean>("useRegExp");
    const caseSensitive = context!.globalState.get<boolean>("caseSensitive");
    if (useRegExp !== undefined)
      options.useRegExp = useRegExp;
    if (caseSensitive !== undefined)
      options.caseSensitive = caseSensitive;
    doSearch(editor, options);
  } else {
    if (search.searchTerm == '') {
      if (previousSearchTerm != '') {
        updateSearch(search, { searchTerm: previousSearchTerm });
      }
    } else {
      const results = search.advance(options);
      status.update(search.searchTerm!, search.caseSensitive!, search.useRegExp!);
      updateMatchDecorations(search, results);
    }
  }
}

/** If subgroups are matched, then display a decoration over the entire
 * matching range to help the user identify how the regexp is working
 * */
function updateMatchDecorations(search: IncrementalSearch, results: { matchedRanges: vscode.Range[], matchedGroups: boolean }) {
  if (configuration.get().selectionDecoration)
    search.getEditor().setDecorations(configuration.get().selectionDecoration, []);

  if (configuration.get().styleMatches == 'always' || (results.matchedGroups && configuration.get().styleMatches == 'multigroups'))
    search.getEditor().setDecorations(configuration.get().matchDecoration!, results.matchedRanges);
  else
    search.getEditor().setDecorations(configuration.get().matchDecoration!, []);
}

function clearMatchDecorations(search: IncrementalSearch) {
  search.getEditor().setDecorations(configuration.get().matchDecoration!, []);
}

function updateSearch(search: IncrementalSearch, options: SearchOptions): { error?: string } {
  if (!search)
    return {};

  try {
    const results = search.update(options);
    status.update(search.searchTerm!, search.caseSensitive!, search.useRegExp!);
    updateMatchDecorations(search, results);
    return {};
  } catch (e) {
    clearMatchDecorations(search);
    status.update(search.searchTerm!, search.caseSensitive!, search.useRegExp!);
    if (e instanceof SyntaxError) {
      status.indicateSyntaxError();
      return { error: e.message };
    }
    else
      console.error(e);
    return { error: 'Unknown error' }
  }
}





// this method is called when your extension is deactivated
export function deactivate() { }
