# Represence Code Extension

The VS Code extension for Represence - provides presence detection by sharing file information via WebSocket.

## 🚀 Quick Start

### Installation

#### Option 1: Install from VSIX file
1. Download the `represence-vscode-0.0.2.vsix` file
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

#### Option 2: Command line installation
```bash
code --install-extension represence-vscode-0.0.2.vsix
```

### First Time Setup
1. After installation, the extension automatically starts a WebSocket server on port `3847`
2. You'll see a notification: "Represence WebSocket server started on port 3847"
3. The extension is now broadcasting your current file information!

## 📡 How It Works

The extension creates a WebSocket server that broadcasts information about your currently active file to any connected clients. This is perfect for:
- **Live coding sessions** - Show others what file you're working on
- **Presence detection** - Let external applications know your current context
- **Development tools** - Integration with custom dashboards or monitoring systems

### What Information is Shared?

The extension broadcasts a JSON object with:
```json
{
  "filename": "example.js",
  "extension": ".js", 
  "path": "/full/path/to/example.js",
  "language": "javascript",
  "lineCount": 42,
  "wordCount": 156,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 Configuration

### Settings

Access settings via:
- Command Palette: `Ctrl+Shift+P` → "Configure Represence Extension"
- Or go to: File → Preferences → Settings → Search for "fileInfo"

#### Available Settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `fileInfo.websocketPort` | `3847` | WebSocket server port (1024-65535) |
| `fileInfo.enableLogging` | `false` | Enable verbose logging in developer console |

### Environment Variable Override

You can override the port using an environment variable:
```bash
export REPRESENCE_VSCODE_PORT=4000
code  # Port 4000 will be used instead of the setting
```

**Priority order:** Environment Variable > VS Code Setting > Default (3847)

## 🎮 Usage

### Commands

Access these via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `Show Current File Info` | Display current file information in a popup |
| `Configure Represence Extension` | Open extension settings |

### Real-time Updates

The extension automatically sends updates when:
- ✅ You switch to a different file
- ✅ You make changes to the current file
- ✅ You open/close files

## 🔌 Connecting to the WebSocket

### JavaScript/Node.js Example
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3847');

ws.on('open', () => {
    console.log('Connected to Represence');
});

ws.on('message', (data) => {
    const fileInfo = JSON.parse(data);
    console.log('Current file:', fileInfo.filename);
    console.log('Language:', fileInfo.language);
    console.log('Lines:', fileInfo.lineCount);
});
```

### Python Example
```python
import websocket
import json

def on_message(ws, message):
    file_info = json.loads(message)
    print(f"Current file: {file_info['filename']}")
    print(f"Language: {file_info['language']}")
    print(f"Lines: {file_info['lineCount']}")

def on_open(ws):
    print("Connected to Represence")

ws = websocket.WebSocketApp("ws://localhost:3847",
                          on_message=on_message,
                          on_open=on_open)
ws.run_forever()
```

## 🛠️ Troubleshooting

### Port Already in Use
If you see "Failed to start WebSocket server on port 3847. Port might be in use":

1. **Change the port**: Go to settings and change `fileInfo.websocketPort` to a different number
2. **Kill the process**: Find what's using the port:
   ```bash
   # Linux/Mac
   lsof -i :3847
   # Windows
   netstat -ano | findstr :3847
   ```
3. **Use environment variable**: Set `REPRESENCE_VSCODE_PORT` to a different port

### Extension Not Working
1. **Check developer console**: Help → Toggle Developer Tools → Console tab
2. **Enable logging**: Set `fileInfo.enableLogging` to `true` in settings
3. **Reload VS Code**: Command Palette → "Developer: Reload Window"

### Connection Issues
- Ensure your firewall allows connections on the configured port
- Test the WebSocket connection with a simple client (see examples above)
- Check that no other application is using the same port

## 🔄 Development

### Building from Source
```bash
git clone <repository-url>
cd represence-vscode
npm install
npm run compile
```

### Packaging
```bash
npm install -g vsce
vsce package
```

### Testing
1. Press `F5` in VS Code to launch Extension Development Host
2. Test the extension in the new window
3. Check the debug console for logs

## 📄 License

This extension is open source. Check the repository for license details.

## 🤝 Contributing

Found a bug or want to add a feature? Contributions are welcome!

---

**Happy coding with Represence! 🎉**
