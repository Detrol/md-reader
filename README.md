# MD Reader

A lightweight, fast Markdown viewer for Windows. Simply double-click any `.md` file to view it beautifully rendered.

## Features

- **Clean Markdown Rendering** - GitHub-flavored Markdown with tables, task lists, and more
- **Syntax Highlighting** - Code blocks with automatic language detection
- **Dark/Light Mode** - Follows system preference with manual toggle
- **Table of Contents** - Auto-generated navigation for long documents
- **File Association** - Optional integration with Windows Explorer
- **Context Menu** - Right-click any `.md` file to "Open with MD Reader"
- **Lightweight** - Small ~5MB installer, fast startup

## Installation

### Download
Get the latest release from the [Releases page](../../releases).

- **`MD Reader_x.x.x_x64-setup.exe`** - Recommended installer (NSIS)
- **`MD Reader_x.x.x_x64_en-US.msi`** - MSI installer for enterprise deployment

### During Installation
The installer will:
1. Add "Open with MD Reader" to the right-click context menu (always)
2. Ask if you want to set MD Reader as the default app for `.md` files (optional)

## Usage

- **Double-click** any `.md` file (if set as default)
- **Right-click** → "Open with MD Reader"
- **Open the app** and click "Open File" to browse

### Keyboard Shortcuts
- Toggle dark/light mode with the sun/moon icon
- Toggle table of contents with the menu icon

## Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/)

### Build

```bash
# Install dependencies
npm install

# Development
npm run tauri dev

# Build for production
npm run build
cargo tauri build
```

The installers will be in `src-tauri/target/release/bundle/`.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust + Tauri
- **Markdown**: react-markdown + remark-gfm + rehype-highlight

## License

MIT License - see [LICENSE](LICENSE) for details.
