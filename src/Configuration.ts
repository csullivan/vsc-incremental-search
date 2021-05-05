import * as vscode from 'vscode';

type InputMode = 'input-box' | 'inline';
type DecorateMatchCondition = 'never' | 'always' | 'multigroups';
type CenterText = 'always' | 'onCancel' | 'never';

interface Configuration {
  inputMode: InputMode,
  matchStyle: vscode.DecorationRenderOptions,
  centerText: CenterText,
  // when to show the style
  styleMatches: DecorateMatchCondition,
  selectionStyle: vscode.DecorationRenderOptions,
  matchDecoration: vscode.TextEditorDecorationType | null;
  selectionDecoration: vscode.TextEditorDecorationType | null;
  decorateSelection: boolean;

}


let configuration : Configuration = {
  inputMode: 'input-box',
  matchStyle: {
    dark: {
      border: '1pt white dashed',
    },
    light: {
      border: '1pt black solid',
    },
  },
  centerText: 'always',
  styleMatches: 'always',
  selectionStyle: {
    backgroundColor: 'rgba(0,0,255,0.5)',
    borderRadius: '50%',
    border: '1pt rgba(0,0,100,0.8) solid',
  },
  matchDecoration: null,
  selectionDecoration: null,
  decorateSelection: false
};

export function activate() {
  loadConfiguration();
  vscode.workspace.onDidChangeConfiguration(loadConfiguration);
}

export function get() {
  return configuration;
}

function loadConfiguration() {
  configuration = Object.assign(configuration, vscode.workspace.getConfiguration("incrementalSearch"));

  if(configuration.selectionDecoration)
    configuration.selectionDecoration.dispose();
  configuration.selectionDecoration = null;
  configuration.selectionDecoration = vscode.window.createTextEditorDecorationType(configuration.selectionStyle);

  if(configuration.matchDecoration != null)
    configuration.matchDecoration.dispose();
  configuration.matchDecoration = null;
  configuration.matchDecoration = vscode.window.createTextEditorDecorationType(configuration.matchStyle);

  if(configuration.inputMode == 'input-box')
    configuration.decorateSelection = true;

  // Do not register the 'type' command unless we have to
  // (potential performance issues)
  // if(configuration.inputMode == 'inline' && registeredTypeCommand==false) {
  //   registeredTypeCommand = true;
  //   registerCommand('type', (event: {text:string}) => {
  //     const search = searches.get(vscode.window.activeTextEditor);
  //     if(search && configuration.inputMode == 'inline')
  //       updateSearch(search,{searchTerm: search.searchTerm + event.text});
  //     else
  //       vscode.commands.executeCommand('default:type', event);
  //   });
  // }
}
