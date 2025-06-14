import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import * as path from 'path';
import * as fs from 'fs';

let wss: WebSocket.Server | undefined;
let isServerRunning = false;

function getPort(): number {
    // Priority: VS Code setting > Default
    const config = vscode.workspace.getConfiguration('fileInfo');
    const settingPort = config.get<number>('websocketPort', 3847);
    
    return settingPort;
}

function isLoggingEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('fileInfo');
    return config.get<boolean>('enableLogging', false);
}

function log(message: string, ...args: any[]) {
    if (isLoggingEnabled()) {
        console.log(`[Represence] ${message}`, ...args);
    }
}

function getCurrentFileInfo() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return {
            fileName: "No file open",
            extension: "",
            fullPath: "",
            languageId: "",
            lineCount: 0,
            wordCount: 0,
            timestamp: Date.now()
        };
    }

    const document = editor.document;
    const filename = path.basename(document.fileName);
    const extension = path.extname(document.fileName);
    const fullPath = document.fileName;
    const language = document.languageId;
    const lineCount = document.lineCount;
    
    // Count words (simple implementation)
    const text = document.getText();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    return {
        fileName: filename,
        extension,
        fullPath: fullPath,
        languageId: language,
        lineCount,
        wordCount,
        timestamp: Date.now()
    };
}

function startWebSocketServer() {
    if (isServerRunning) {
        log('WebSocket server is already running');
        return;
    }

    const port = getPort();
    
    try {
        wss = new WebSocket.Server({ port });
        isServerRunning = true;

        log(`WebSocket server started on port ${port}`);
        vscode.window.showInformationMessage(`Represence WebSocket server started on port ${port}`);

        wss.on('connection', (ws) => {
            log('Client connected');
            
            // Send current file info immediately
            const fileInfo = getCurrentFileInfo();
            ws.send(JSON.stringify(fileInfo));
            log('Sent initial file info:', fileInfo);

            ws.on('close', () => {
                log('Client disconnected');
            });

            ws.on('error', (error) => {
                log('WebSocket error:', error);
            });
        });

        wss.on('error', (error) => {
            log('WebSocket server error:', error);
            vscode.window.showErrorMessage(`WebSocket server error: ${error.message}`);
            isServerRunning = false;
        });

    } catch (error) {
        log('Failed to start WebSocket server:', error);
        vscode.window.showErrorMessage(`Failed to start WebSocket server on port ${port}. Port might be in use.`);
        isServerRunning = false;
    }
}

function stopWebSocketServer() {
    if (wss) {
        wss.close(() => {
            log('WebSocket server stopped');
        });
        wss = undefined;
        isServerRunning = false;
    }
}

function sendFileInfoToClients() {
    if (wss && isServerRunning) {
        const fileInfo = getCurrentFileInfo();
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(fileInfo));
            }
        });
        log('Sent file info update:', fileInfo);
    }
}

export function activate(context: vscode.ExtensionContext) {
    log('Represence extension activated');

    // Start WebSocket server
    startWebSocketServer();

    // Register command to show file info
    const showFileInfoCommand = vscode.commands.registerCommand('represence-vscode.showFileInfo', () => {
        const fileInfo = getCurrentFileInfo();
        const message = `File: ${fileInfo.fileName}\nLanguage: ${fileInfo.languageId}\nLines: ${fileInfo.lineCount}\nWords: ${fileInfo.wordCount}`;
        vscode.window.showInformationMessage(message);
    });

    // Register command to open settings
    const openSettingsCommand = vscode.commands.registerCommand('represence-vscode.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'fileInfo');
    });

    // Listen for active editor changes
    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(() => {
        sendFileInfoToClients();
    });

    // Listen for document changes
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(() => {
        sendFileInfoToClients();
    });

    // Listen for configuration changes
    const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('fileInfo.websocketPort')) {
            const newPort = getPort();
            log(`Port configuration changed to ${newPort}. Restart extension to apply changes.`);
            vscode.window.showInformationMessage(
                `WebSocket port changed to ${newPort}. Please reload VS Code to apply the change.`,
                'Reload Now'
            ).then((selection) => {
                if (selection === 'Reload Now') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        }
    });

    context.subscriptions.push(
        showFileInfoCommand,
        openSettingsCommand,
        onDidChangeActiveTextEditor,
        onDidChangeTextDocument,
        onDidChangeConfiguration
    );
}

export function deactivate() {
    log('Represence extension deactivated');
    stopWebSocketServer();
} 