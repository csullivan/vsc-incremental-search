import * as vscode from 'vscode';

type DecorateMatchCondition = 'never' | 'always' | 'multigroups';
type CenterText = 'always' | 'onCancel' | 'never';

interface Configuration {
  matchStyle: vscode.DecorationRenderOptions,
  centerText: CenterText,
  // when to show the style
  styleMatches: DecorateMatchCondition,
  selectionStyle: vscode.DecorationRenderOptions,
  matchDecoration: vscode.TextEditorDecorationType | null;
  selectionDecoration: vscode.TextEditorDecorationType | null;
}


let configuration: Configuration = {
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
  selectionDecoration: null
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

  if (configuration.selectionDecoration)
    configuration.selectionDecoration.dispose();
  configuration.selectionDecoration = null;
  configuration.selectionDecoration = vscode.window.createTextEditorDecorationType(configuration.selectionStyle);

  if (configuration.matchDecoration != null)
    configuration.matchDecoration.dispose();
  configuration.matchDecoration = null;
  configuration.matchDecoration = vscode.window.createTextEditorDecorationType(configuration.matchStyle);
}
