# Change Log

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
