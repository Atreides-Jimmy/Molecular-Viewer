# Molecular Viewer

A VS Code / Trae extension for visualizing and editing molecular structures in 3D, designed for computational chemists working with Gaussian, ORCA, and other quantum chemistry software — especially on remote servers where GUI tools like GaussView are unavailable.

## Features

- **3D Ball-and-Stick Rendering** — Atoms rendered as spheres (scaled by covalent radius) with CPK coloring; bonds rendered as dual-colored cylinders
- **Bond Order Support** — Visual distinction for single, double, and triple bonds
- **Auto Bond Detection** — When files lack explicit connectivity, bonds are automatically detected using covalent radii + 0.45 Å tolerance
- **GJF Connect Section** — Reads explicit bond information from Gaussian `connect` sections, including bond orders
- **Interactive Mouse Control**:
  - Left drag → Rotate around molecule center
  - Scroll → Zoom in/out
  - Middle/Right drag → Pan
  - Hover atom → Show element name + coordinates
- **Touch Support** — Single-finger rotate, pinch-to-zoom
- **Remote-SSH Compatible** — Works seamlessly when editing files on remote Linux servers via VS Code/Trae Remote-SSH

### Molecular Editing

- **Bond Length Adjustment** — Select 2 atoms, view current bond length, choose which atom to fix, adjust via numeric input or slider with real-time 3D preview
- **Bond Angle Adjustment** — Select 3 atoms (2nd is the vertex), view current angle, fix/move either side, real-time preview
- **Dihedral Angle Adjustment** — Select 4 atoms, view current dihedral, fix/move either side, real-time preview
- **Add Atom** — Click anchor atom, choose element (H/C/N/O/F/P/S/Cl/Br/I), set bond length, direction auto-calculated from existing bonds
- **Delete Atom** — Click atom and confirm; atoms and bonds are automatically re-indexed
- **Save As** — Export modified structure as XYZ or Gaussian GJF format (original file is never modified)
- **Cancel/Undo** — Cancel button restores original coordinates before confirming edits

### Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| Gaussian Input | `.gjf`, `.gjf03`, `.gjf09`, `.gjf16`, `.com` | Reads Link 0, route, title, charge/mult, coordinates, connect |
| XYZ | `.xyz` | Standard XYZ format with atom count header |
| MDL Mol | `.mol` | Basic support |
| SDF | `.sdf` | Basic support |

## Installation

### From VSIX (Recommended)

1. Download the latest `.vsix` file from [Releases](https://github.com/Atreides-Jimmy/molecular-viewer/releases)
2. In VS Code / Trae, press `Ctrl+Shift+P`
3. Type `Extensions: Install from VSIX...`
4. Select the downloaded `.vsix` file
5. **For Remote-SSH**: Make sure to install the extension **on the remote server** (choose "Install on Remote" when prompted)

### From Source

```bash
git clone https://github.com/Atreides-Jimmy/molecular-viewer.git
cd molecular-viewer
npm install
npm run compile
npx vsce package --no-dependencies
# Then install the generated .vsix file
```

## Usage

### Opening Molecular Files

1. **Right-click** a `.gjf` or `.xyz` file in the Explorer → **Molecular Viewer: Open 3D Viewer**
2. **Command Palette** (`Ctrl+Shift+P`) → `Molecular Viewer: Open 3D Viewer`
3. **Custom Editor** — Double-click a supported file and select "Molecular 3D Viewer"

### Set as Default Viewer

Add to your `settings.json`:

```json
{
  "workbench.editorAssociations": {
    "*.gjf": "molecularViewer.editor",
    "*.xyz": "molecularViewer.editor",
    "*.com": "molecularViewer.editor"
  }
}
```

### Controls

| Action | Effect |
|--------|--------|
| Left mouse drag | Rotate molecule around its center |
| Mouse scroll | Zoom in / out |
| Middle / Right mouse drag | Pan view |
| Hover over atom | Show element + coordinates tooltip |
| Reset View button | Return to default view |

### Editing Workflow

1. Click a toolbar button to enter an editing mode (e.g., **Bond Length**)
2. Click atoms in the 3D view to select them (selected atoms glow yellow)
3. A modal dialog appears showing the current value
4. Choose which atoms to **fix** vs. **move** using the dropdown
5. Adjust the value using the **numeric input** or **slider** — the 3D view updates in real-time
6. Click **OK** to confirm the change, or **Cancel** to revert
7. Use **Save As** to export the modified structure to a new file

## Architecture

```
┌─────────────────────┐          ┌──────────────────────────┐
│   Local (Windows)   │   SSH    │   Remote (Linux Server)  │
│                     │ ───────> │                          │
│  Trae IDE (UI)      │          │  Trae Server (Extension) │
│  ├─ Webview 3D      │ <─────── │  ├─ Parse .gjf/.xyz     │
│  ├─ Three.js (CDN)  │  data    │  ├─ Bond detection       │
│  ├─ Editing UI      │          │  ├─ Save file (VS Code)  │
│  └─ Mouse events    │          │  └─ Return molecule data  │
└─────────────────────┘          └──────────────────────────┘
```

The extension runs on the **remote side** (reading files, parsing, saving), while the Webview renders on the **local side** (Three.js via CDN, mouse interaction, editing UI).

## Project Structure

```
molecular-viewer/
├── src/
│   ├── extension.ts           # Extension entry point
│   ├── types.ts               # TypeScript type definitions
│   ├── parsers/
│   │   ├── index.ts           # Parser dispatcher (auto-detect format)
│   │   ├── gjfParser.ts       # Gaussian .gjf parser
│   │   ├── xyzParser.ts       # XYZ format parser
│   │   └── bondDetector.ts    # Covalent radii bond detection
│   └── webview/
│       └── molecularViewer.ts # Custom editor + Three.js webview + editing
├── dist/                      # Compiled JavaScript (pre-built)
├── test/                      # Sample molecular files
├── media/                     # Extension icon
├── package.json
├── tsconfig.json
└── LICENSE
```

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Type check without emitting
npm run lint

# Package as .vsix
npm run package
```

## Roadmap

- [ ] MOL/SDF full parser with explicit bond info
- [ ] CIF crystal structure support
- [ ] Multiple display styles (wireframe, space-filling, licorice)
- [ ] Vibration animation from frequency calculations
- [ ] ORCA output parser
- [ ] Gaussian log/fchk parser (optimized geometries)
- [ ] Export as PNG/SVG
- [ ] Undo/redo history for edits
- [ ] Bond order editing (single ↔ double ↔ triple)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
