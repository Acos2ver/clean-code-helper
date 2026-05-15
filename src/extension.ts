import * as vscode from 'vscode';

const commonTypos: Record<string, string> = {
	teh: 'the',
	recieve: 'receive',
	adress: 'address',
	seperate: 'separate',
	occured: 'occurred',
	enviroment: 'environment',
	definately: 'definitely',
	becuase: 'because',
	functoin: 'function',
	lenght: 'length'
};

const supportedLanguages = new Set([
	'python',
	'java',
	'cpp',
	'javascript',
	'typescript',
	'javascriptreact',
	'typescriptreact'
]);

export function activate(context: vscode.ExtensionContext) {
	const diagnostics = vscode.languages.createDiagnosticCollection('clean-code-helper');

	context.subscriptions.push(diagnostics);

	const checkDocument = (document: vscode.TextDocument) => {
		if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
			return;
		}

		if (!supportedLanguages.has(document.languageId)) {
			return;
		}

		const results: vscode.Diagnostic[] = [];

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const text = line.text;

			checkTrailingSpaces(text, i, results);
			checkMixedIndentation(text, i, results);
			checkRepeatedSpaces(text, i, results);
			checkCommonTypos(text, i, results);
		}

		diagnostics.set(document.uri, results);
	};

	const documentSelector: vscode.DocumentSelector = Array.from(supportedLanguages).flatMap(
		language => [
			{ language, scheme: 'file' },
			{ language, scheme: 'untitled' }
		]
	);

	const quickFixProvider = vscode.languages.registerCodeActionsProvider(
		documentSelector,
		{
			provideCodeActions(
				document: vscode.TextDocument,
				_range: vscode.Range,
				context: vscode.CodeActionContext
			) {
				const actions: vscode.CodeAction[] = [];

				for (const diagnostic of context.diagnostics) {
					if (diagnostic.source !== 'Clean Code Helper') {
						continue;
					}

					const code = String(diagnostic.code ?? '');

					if (code.startsWith('typo:')) {
						const typo = code.replace('typo:', '');
						const replacement = commonTypos[typo];

						if (!replacement) {
							continue;
						}

						const action = new vscode.CodeAction(
							`Replace with "${replacement}"`,
							vscode.CodeActionKind.QuickFix
						);

						const edit = new vscode.WorkspaceEdit();
						edit.replace(document.uri, diagnostic.range, replacement);

						action.edit = edit;
						action.diagnostics = [diagnostic];
						action.isPreferred = true;

						actions.push(action);
					}

					if (code === 'repeated-spaces') {
						const action = new vscode.CodeAction(
							'Replace repeated spaces with one space',
							vscode.CodeActionKind.QuickFix
						);

						const edit = new vscode.WorkspaceEdit();
						edit.replace(document.uri, diagnostic.range, ' ');

						action.edit = edit;
						action.diagnostics = [diagnostic];

						actions.push(action);
					}

					if (code === 'trailing-whitespace') {
						const action = new vscode.CodeAction(
							'Remove trailing whitespace',
							vscode.CodeActionKind.QuickFix
						);

						const edit = new vscode.WorkspaceEdit();
						edit.replace(document.uri, diagnostic.range, '');

						action.edit = edit;
						action.diagnostics = [diagnostic];

						actions.push(action);
					}
				}

				return actions;
			}
		},
		{
			providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
		}
	);

	const fixAllCommand = vscode.commands.registerCommand(
		'clean-code-helper.fixAll',
		async () => {
			const editor = vscode.window.activeTextEditor;

			if (!editor) {
				vscode.window.showInformationMessage('No active editor found.');
				return;
			}

			const document = editor.document;

			if (!supportedLanguages.has(document.languageId)) {
				vscode.window.showInformationMessage(
					'Clean Code Helper does not support this file type.'
				);
				return;
			}

			const currentDiagnostics = diagnostics.get(document.uri) ?? [];
			const cleanCodeDiagnostics = currentDiagnostics.filter(
				diagnostic => diagnostic.source === 'Clean Code Helper'
			);

			if (cleanCodeDiagnostics.length === 0) {
				vscode.window.showInformationMessage('No Clean Code Helper issues found.');
				return;
			}

			const edit = new vscode.WorkspaceEdit();
			let fixCount = 0;

			for (const diagnostic of cleanCodeDiagnostics) {
				const code = String(diagnostic.code ?? '');

				if (code.startsWith('typo:')) {
					const typo = code.replace('typo:', '');
					const replacement = commonTypos[typo];

					if (!replacement) {
						continue;
					}

					edit.replace(document.uri, diagnostic.range, replacement);
					fixCount++;
				}

				if (code === 'repeated-spaces') {
					edit.replace(document.uri, diagnostic.range, ' ');
					fixCount++;
				}

				if (code === 'trailing-whitespace') {
					edit.replace(document.uri, diagnostic.range, '');
					fixCount++;
				}
			}

			const applied = await vscode.workspace.applyEdit(edit);

			if (applied) {
				vscode.window.showInformationMessage(
					`Clean Code Helper fixed ${fixCount} issue(s).`
				);

				checkDocument(document);
			}
		}
	);

	context.subscriptions.push(quickFixProvider);
	context.subscriptions.push(fixAllCommand);

	if (vscode.window.activeTextEditor) {
		checkDocument(vscode.window.activeTextEditor.document);
	}

	vscode.workspace.textDocuments.forEach(checkDocument);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(checkDocument),
		vscode.workspace.onDidChangeTextDocument(event => {
			checkDocument(event.document);
		}),
		vscode.workspace.onDidCloseTextDocument(document => {
			diagnostics.delete(document.uri);
		})
	);
}

function checkTrailingSpaces(
	text: string,
	lineNumber: number,
	diagnostics: vscode.Diagnostic[]
) {
	const match = text.match(/[ \t]+$/);

	if (!match || match.index === undefined) {
		return;
	}

	const range = new vscode.Range(
		lineNumber,
		match.index,
		lineNumber,
		text.length
	);

	const diagnostic = new vscode.Diagnostic(
		range,
		'Trailing whitespace found.',
		vscode.DiagnosticSeverity.Warning
	);

	diagnostic.source = 'Clean Code Helper';
	diagnostic.code = 'trailing-whitespace';
	diagnostics.push(diagnostic);
}

function checkMixedIndentation(
	text: string,
	lineNumber: number,
	diagnostics: vscode.Diagnostic[]
) {
	const leadingWhitespace = text.match(/^[ \t]+/)?.[0];

	if (!leadingWhitespace) {
		return;
	}

	const hasSpace = leadingWhitespace.includes(' ');
	const hasTab = leadingWhitespace.includes('\t');

	if (!hasSpace || !hasTab) {
		return;
	}

	const range = new vscode.Range(
		lineNumber,
		0,
		lineNumber,
		leadingWhitespace.length
	);

	const diagnostic = new vscode.Diagnostic(
		range,
		'Mixed tabs and spaces found in indentation.',
		vscode.DiagnosticSeverity.Warning
	);

	diagnostic.source = 'Clean Code Helper';
	diagnostic.code = 'mixed-indentation';
	diagnostics.push(diagnostic);
}

function checkRepeatedSpaces(
	text: string,
	lineNumber: number,
	diagnostics: vscode.Diagnostic[]
) {
	const leadingWhitespace = text.match(/^\s*/)?.[0] ?? '';
	const repeatedSpacePattern = / {2,}/g;
	let match: RegExpExecArray | null;

	while ((match = repeatedSpacePattern.exec(text)) !== null) {
		if (match.index < leadingWhitespace.length) {
			continue;
		}

		if (/^[ \t]+$/.test(text.slice(match.index))) {
			continue;
		}

		if (isInsideString(text, match.index)) {
			continue;
		}

		const range = new vscode.Range(
			lineNumber,
			match.index,
			lineNumber,
			match.index + match[0].length
		);

		const diagnostic = new vscode.Diagnostic(
			range,
			'Repeated spaces found. Consider using a single space.',
			vscode.DiagnosticSeverity.Warning
		);

		diagnostic.source = 'Clean Code Helper';
		diagnostic.code = 'repeated-spaces';
		diagnostics.push(diagnostic);
	}
}

function checkCommonTypos(
	text: string,
	lineNumber: number,
	diagnostics: vscode.Diagnostic[]
) {
	for (const typo in commonTypos) {
		const typoPattern = new RegExp(`\\b${typo}\\b`, 'gi');
		let match: RegExpExecArray | null;

		while ((match = typoPattern.exec(text)) !== null) {
			const lowerWord = match[0].toLowerCase();

			const range = new vscode.Range(
				lineNumber,
				match.index,
				lineNumber,
				match.index + match[0].length
			);

			const diagnostic = new vscode.Diagnostic(
				range,
				`Possible spelling issue. Did you mean "${commonTypos[lowerWord]}"?`,
				vscode.DiagnosticSeverity.Warning
			);

			diagnostic.source = 'Clean Code Helper';
			diagnostic.code = `typo:${lowerWord}`;
			diagnostics.push(diagnostic);
		}
	}
}

function isInsideString(text: string, index: number): boolean {
	let quote: string | null = null;
	let escaped = false;

	for (let i = 0; i < index; i++) {
		const char = text[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		if (quote) {
			if (char === quote) {
				quote = null;
			}
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
		}
	}

	return quote !== null;
}

export function deactivate() { }