# Change Log

## [0.2.0] - 2026-04-14

### Added

- **Molecular Editing Toolbar** — Mode-based toolbar with View, Bond Length, Bond Angle, Dihedral, Add Atom, Delete Atom, Save As, and Reset View buttons
- **Bond Length Adjustment** — Click 2 atoms to select, modal shows current bond length, choose which atom to fix/move, adjust via numeric input or slider with real-time 3D preview
- **Bond Angle Adjustment** — Click 3 atoms (2nd is central), modal shows current angle, fix/move either side, real-time 3D preview
- **Dihedral Angle Adjustment** — Click 4 atoms, modal shows current dihedral, fix/move either side, real-time 3D preview
- **Add Atom** — Click anchor atom, choose element (H/C/N/O/F/P/S/Cl/Br/I), set bond length, auto-calculated direction based on existing bonds
- **Delete Atom** — Click atom, confirm deletion; automatically re-indexes atoms and bonds
- **Save As** — Export modified structure as XYZ or Gaussian GJF format via VS Code save dialog (original file is never modified)
- **Atom Selection Highlighting** — Selected atoms glow yellow (emissive) for clear visual feedback
- **Status Bar** — Shows current editing mode and selected atoms
- **Cancel/Undo** — Cancel button in edit modals restores original coordinates
- **BFS Fragment Detection** — `getMovable()` uses breadth-first search to correctly identify which atoms move when adjusting geometry
- **Rodrigues Rotation** — `rotAroundAxis()` implements Rodrigues' rotation formula for accurate rotation around arbitrary axes
- **Real-time 3D Preview** — Slider and input changes immediately update the 3D molecular view

## [0.1.0] - 2025-01-01

### Added

- 3D ball-and-stick molecular rendering using Three.js
- Gaussian `.gjf` / `.gjf03` / `.gjf09` / `.gjf16` / `.com` file parser
  - Reads Link 0 commands, route section, title, charge/multiplicity
  - Supports atomic numbers and element symbols (e.g., `6` → `C`)
  - Reads `connect` section with bond orders
- XYZ format parser with atomic number support
- Automatic bond detection using covalent radii (118 elements) + 0.45 Å tolerance
- Dual-colored bonds (half atom1 color, half atom2 color)
- Visual bond order distinction (single, double, triple)
- Interactive mouse controls:
  - Left drag: Rotate around molecule center
  - Scroll: Zoom
  - Middle/Right drag: Pan
- Atom hover tooltip showing element name and coordinates
- Reset View button
- Touch support (single-finger rotate, pinch-to-zoom)
- Custom editor integration (open .gjf/.xyz files directly)
- Explorer context menu integration
- Command palette integration
- Remote-SSH compatibility
- CPK atom coloring scheme
