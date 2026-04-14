import * as vscode from 'vscode';
import { parseFile } from '../parsers/index';
import { ensureBonds } from '../parsers/bondDetector';
import { MolecularData } from '../types';

export class MolecularViewerProvider implements vscode.CustomReadonlyEditorProvider<MolecularDocument> {
    constructor(private readonly context: vscode.ExtensionContext) {}

    async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): Promise<MolecularDocument> {
        const content = await vscode.workspace.fs.readFile(uri);
        const textContent = new TextDecoder().decode(content);
        const fileName = uri.path.split('/').pop() || 'unknown.xyz';

        let data = parseFile(textContent, fileName);
        data = ensureBonds(data);

        return new MolecularDocument(uri, data);
    }

    async resolveCustomEditor(
        document: MolecularDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document.data);

        webviewPanel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'info':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message.text);
                    break;
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview, data: MolecularData): string {
        const nonce = getNonce();

        const atomColors: { [key: string]: string } = {
            H: '#FFFFFF', He: '#D9FFFF', Li: '#CC80FF', Be: '#C2FF00', B: '#FFB5B5',
            C: '#909090', N: '#3050F8', O: '#FF0D0D', F: '#90E050', Ne: '#B3E3F5',
            Na: '#AB5CF2', Mg: '#8AFF00', Al: '#BFA6A6', Si: '#F0C8A0', P: '#FF8000',
            S: '#FFFF30', Cl: '#1FF01F', Ar: '#80D1E3', K: '#8F40D4', Ca: '#3DFF00',
            Sc: '#E6E6E6', Ti: '#BFC2C7', V: '#A6A6AB', Cr: '#8A99C7', Mn: '#9C7AC7',
            Fe: '#E06633', Co: '#F090A0', Ni: '#50D050', Cu: '#C88033', Zn: '#7D80B0',
            Ga: '#C28F8F', Ge: '#668F8F', As: '#BD80E3', Se: '#FFA100', Br: '#A62929',
            Kr: '#5CB8D1', Rb: '#702EB0', Sr: '#00FF00', Y: '#94FFFF', Zr: '#94E0E0',
            Nb: '#73C2C9', Mo: '#54B5B5', Tc: '#3B9E9E', Ru: '#248F8F', Rh: '#0A7D8C',
            Pd: '#006985', Ag: '#C0C0C0', Cd: '#FFD98F', In: '#A67573', Sn: '#668080',
            Sb: '#9E63B5', Te: '#D47A00', I: '#940094', Xe: '#429EB0', Cs: '#57178F',
            Ba: '#00C900', La: '#70D4FF', Ce: '#FFFFC7', Pr: '#D9FFC7', Nd: '#C7FFC7',
            Pm: '#A3FFC7', Sm: '#8FFFC7', Eu: '#61FFC7', Gd: '#45FFC7', Tb: '#30FFC7',
            Dy: '#1FFFC7', Ho: '#00FF9C', Er: '#00E675', Tm: '#00D452', Yb: '#00BF38',
            Lu: '#00AB24', Hf: '#4DC2FF', Ta: '#4DA6FF', W: '#2194D6', Re: '#267DAB',
            Os: '#266696', Ir: '#175487', Pt: '#D0D0E0', Au: '#FFD123', Hg: '#B8B8D0',
            Tl: '#A6544D', Pb: '#575961', Bi: '#9E4FB5', Po: '#AB5C00', At: '#754F45',
            Rn: '#428296', Fr: '#420066', Ra: '#007D00', Ac: '#70ABFA', Th: '#00BAFF',
            Pa: '#00A1FF', U: '#008FFF', Np: '#0080FF', Pu: '#006BFF', Am: '#545CF2',
            Cm: '#785CE3', Bk: '#8A4FE3', Cf: '#A136D4', Es: '#B31FD4', Fm: '#B31FBA',
            Md: '#B30DA6', No: '#BD0D87', Lr: '#C70066', Rf: '#CC0059', Db: '#D9004F',
            Sg: '#E00045', Bh: '#E6002E', Hs: '#EB0026'
        };

        const atomData = data.atoms.map(a => ({
            element: a.element,
            x: a.x,
            y: a.y,
            z: a.z,
            color: atomColors[a.element] || '#FF1493'
        }));

        const bondData = data.bonds.map(b => ({
            atom1: b.atom1,
            atom2: b.atom2,
            order: b.order
        }));

        const jsonData = JSON.stringify({ atoms: atomData, bonds: bondData, title: data.title });

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com; style-src 'nonce-${nonce}';">
    <title>Molecular Viewer</title>
    <style nonce="${nonce}">
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background-color: var(--vscode-editor-background, #1e1e1e); font-family: var(--vscode-font-family, sans-serif); }
        #container { width: 100%; height: 100%; position: relative; }
        canvas { display: block; }
        #info-panel { position: absolute; top: 10px; left: 10px; color: var(--vscode-editor-foreground, #cccccc); font-size: 12px; background: var(--vscode-editor-background, #1e1e1e); padding: 8px 12px; border-radius: 4px; border: 1px solid var(--vscode-panel-border, #444444); pointer-events: none; z-index: 10; opacity: 0.9; }
        #info-panel .title { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
        #info-panel .detail { color: var(--vscode-descriptionForeground, #999999); }
        #controls-hint { position: absolute; bottom: 10px; left: 10px; color: var(--vscode-descriptionForeground, #999999); font-size: 11px; background: var(--vscode-editor-background, #1e1e1e); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--vscode-panel-border, #444444); pointer-events: none; z-index: 10; opacity: 0.8; }
        #atom-tooltip { position: absolute; display: none; color: var(--vscode-editor-foreground, #cccccc); font-size: 12px; background: var(--vscode-editor-background, #1e1e1e); padding: 4px 8px; border-radius: 3px; border: 1px solid var(--vscode-panel-border, #444444); pointer-events: none; z-index: 20; }
        #reset-btn { position: absolute; top: 10px; right: 10px; color: var(--vscode-editor-foreground, #cccccc); font-size: 12px; background: var(--vscode-button-secondaryBackground, #3a3d41); padding: 6px 12px; border-radius: 3px; border: 1px solid var(--vscode-panel-border, #444444); cursor: pointer; z-index: 10; }
        #reset-btn:hover { background: var(--vscode-button-secondaryHoverBackground, #45494e); }
    </style>
</head>
<body>
    <div id="container">
        <div id="info-panel">
            <div class="title" id="mol-title">Molecular Viewer</div>
            <div class="detail" id="mol-detail"></div>
        </div>
        <div id="controls-hint">Left drag: Rotate | Scroll: Zoom | Middle/Right drag: Pan</div>
        <div id="atom-tooltip"></div>
        <button id="reset-btn">Reset View</button>
    </div>
    <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script nonce="${nonce}">
        (function() {
            const molecularData = ${jsonData};

            const container = document.getElementById('container');
            const titleEl = document.getElementById('mol-title');
            const detailEl = document.getElementById('mol-detail');
            const tooltipEl = document.getElementById('atom-tooltip');
            const resetBtn = document.getElementById('reset-btn');

            titleEl.textContent = molecularData.title || 'Molecular Viewer';
            detailEl.textContent = molecularData.atoms.length + ' atoms, ' + molecularData.bonds.length + ' bonds';

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1e1e1e);

            const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
            scene.add(ambientLight);

            const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight1.position.set(5, 10, 7);
            scene.add(directionalLight1);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
            directionalLight2.position.set(-5, -3, -5);
            scene.add(directionalLight2);

            const pivotGroup = new THREE.Group();
            scene.add(pivotGroup);

            const moleculeGroup = new THREE.Group();
            pivotGroup.add(moleculeGroup);

            let centerX = 0, centerY = 0, centerZ = 0;
            molecularData.atoms.forEach(function(atom) {
                centerX += atom.x;
                centerY += atom.y;
                centerZ += atom.z;
            });
            centerX /= molecularData.atoms.length;
            centerY /= molecularData.atoms.length;
            centerZ /= molecularData.atoms.length;

            const COVALENT_RADII = {
                H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71,
                O: 0.66, F: 0.57, Ne: 0.58, Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11,
                P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06, K: 2.03, Ca: 1.76, Sc: 1.70,
                Ti: 1.60, V: 1.53, Cr: 1.39, Mn: 1.39, Fe: 1.32, Co: 1.26, Ni: 1.24,
                Cu: 1.32, Zn: 1.22, Ga: 1.22, Ge: 1.20, As: 1.19, Se: 1.20, Br: 1.20,
                Kr: 1.16, Rb: 2.20, Sr: 1.95, I: 1.39, Cs: 2.44, Ba: 2.15
            };

            function getAtomRadius(element) {
                const r = COVALENT_RADII[element] || 1.50;
                return r * 0.5;
            }

            const atomMeshes = [];

            function createAtom(atom) {
                const radius = getAtomRadius(atom.element);
                const geometry = new THREE.SphereGeometry(radius, 32, 24);
                const material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(atom.color),
                    shininess: 80,
                    specular: 0x444444
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(atom.x - centerX, atom.y - centerY, atom.z - centerZ);
                mesh.userData = { element: atom.element, index: atom.index !== undefined ? atom.index : 0 };
                moleculeGroup.add(mesh);
                atomMeshes.push(mesh);
                return mesh;
            }

            function createBond(bond) {
                const atom1 = molecularData.atoms[bond.atom1];
                const atom2 = molecularData.atoms[bond.atom2];
                if (!atom1 || !atom2) return;

                const start = new THREE.Vector3(atom1.x - centerX, atom1.y - centerY, atom1.z - centerZ);
                const end = new THREE.Vector3(atom2.x - centerX, atom2.y - centerY, atom2.z - centerZ);
                const direction = new THREE.Vector3().subVectors(end, start);
                const length = direction.length();
                const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

                const bondRadius = 0.12;
                const order = bond.order || 1;
                const color1 = new THREE.Color(atom1.color);
                const color2 = new THREE.Color(atom2.color);

                if (order === 1) {
                    createHalfBond(start, midpoint, direction, length / 2, bondRadius, color1);
                    createHalfBond(midpoint, end, direction, length / 2, bondRadius, color2);
                } else if (order === 2) {
                    const offset = 0.12;
                    const perp = getPerpendicular(direction).multiplyScalar(offset);
                    createHalfBond(start.clone().add(perp), midpoint.clone().add(perp), direction, length / 2, bondRadius * 0.6, color1);
                    createHalfBond(midpoint.clone().add(perp), end.clone().add(perp), direction, length / 2, bondRadius * 0.6, color2);
                    createHalfBond(start.clone().sub(perp), midpoint.clone().sub(perp), direction, length / 2, bondRadius * 0.6, color1);
                    createHalfBond(midpoint.clone().sub(perp), end.clone().sub(perp), direction, length / 2, bondRadius * 0.6, color2);
                } else if (order === 3) {
                    const offset = 0.15;
                    const perp = getPerpendicular(direction).multiplyScalar(offset);
                    createHalfBond(start, midpoint, direction, length / 2, bondRadius * 0.45, color1);
                    createHalfBond(midpoint, end, direction, length / 2, bondRadius * 0.45, color2);
                    createHalfBond(start.clone().add(perp), midpoint.clone().add(perp), direction, length / 2, bondRadius * 0.45, color1);
                    createHalfBond(midpoint.clone().add(perp), end.clone().add(perp), direction, length / 2, bondRadius * 0.45, color2);
                    createHalfBond(start.clone().sub(perp), midpoint.clone().sub(perp), direction, length / 2, bondRadius * 0.45, color1);
                    createHalfBond(midpoint.clone().sub(perp), end.clone().sub(perp), direction, length / 2, bondRadius * 0.45, color2);
                } else {
                    createHalfBond(start, midpoint, direction, length / 2, bondRadius, color1);
                    createHalfBond(midpoint, end, direction, length / 2, bondRadius, color2);
                }
            }

            function getPerpendicular(dir) {
                const up = Math.abs(dir.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
                return new THREE.Vector3().crossVectors(dir, up).normalize();
            }

            function createHalfBond(start, end, direction, halfLength, radius, color) {
                const geometry = new THREE.CylinderGeometry(radius, radius, halfLength, 8, 1);
                const material = new THREE.MeshPhongMaterial({ color: color, shininess: 40, specular: 0x222222 });
                const mesh = new THREE.Mesh(geometry, material);
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                mesh.position.copy(mid);
                const axis = new THREE.Vector3(0, 1, 0);
                const dir = direction.clone().normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
                mesh.quaternion.copy(quaternion);
                moleculeGroup.add(mesh);
            }

            molecularData.atoms.forEach(function(atom, i) {
                atom.index = i;
                createAtom(atom);
            });

            molecularData.bonds.forEach(function(bond) {
                createBond(bond);
            });

            let maxDist = 0;
            molecularData.atoms.forEach(function(atom) {
                const dx = atom.x - centerX;
                const dy = atom.y - centerY;
                const dz = atom.z - centerZ;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (dist > maxDist) maxDist = dist;
            });

            const initialCameraDistance = maxDist * 2.5 + 5;
            camera.position.set(0, 0, initialCameraDistance);
            camera.lookAt(0, 0, 0);

            let isRotating = false;
            let isPanning = false;
            let previousMousePosition = { x: 0, y: 0 };
            let rotationX = 0;
            let rotationY = 0;
            let panX = 0;
            let panY = 0;
            let cameraDistance = initialCameraDistance;

            function resetView() {
                rotationX = 0;
                rotationY = 0;
                panX = 0;
                panY = 0;
                cameraDistance = initialCameraDistance;
                camera.position.set(0, 0, cameraDistance);
                updateMoleculeTransform();
            }

            resetBtn.addEventListener('click', resetView);

            const canvas = renderer.domElement;

            canvas.addEventListener('mousedown', function(e) {
                if (e.button === 0) {
                    isRotating = true;
                } else if (e.button === 1 || e.button === 2) {
                    isPanning = true;
                }
                previousMousePosition = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            });

            canvas.addEventListener('mousemove', function(e) {
                const deltaMove = {
                    x: e.clientX - previousMousePosition.x,
                    y: e.clientY - previousMousePosition.y
                };

                if (isRotating) {
                    rotationY += deltaMove.x * 0.005;
                    rotationX += deltaMove.y * 0.005;
                    updateMoleculeTransform();
                }

                if (isPanning) {
                    panX += deltaMove.x * 0.01 * (cameraDistance / 20);
                    panY -= deltaMove.y * 0.01 * (cameraDistance / 20);
                    updateMoleculeTransform();
                }

                previousMousePosition = { x: e.clientX, y: e.clientY };
                checkAtomHover(e);
            });

            canvas.addEventListener('mouseup', function() { isRotating = false; isPanning = false; });
            canvas.addEventListener('mouseleave', function() { isRotating = false; isPanning = false; tooltipEl.style.display = 'none'; });

            canvas.addEventListener('wheel', function(e) {
                e.preventDefault();
                const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
                cameraDistance *= zoomFactor;
                cameraDistance = Math.max(1, Math.min(500, cameraDistance));
                camera.position.z = cameraDistance;
            }, { passive: false });

            canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

            function updateMoleculeTransform() {
                const euler = new THREE.Euler(rotationX, rotationY, 0, 'YXZ');
                moleculeGroup.rotation.copy(euler);
                pivotGroup.position.set(panX, panY, 0);
            }

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            function checkAtomHover(e) {
                const rect = canvas.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(atomMeshes);
                if (intersects.length > 0) {
                    const obj = intersects[0].object;
                    const elem = obj.userData.element;
                    const idx = obj.userData.index;
                    const atom = molecularData.atoms[idx];
                    tooltipEl.textContent = elem + (idx + 1) + '  (' + atom.x.toFixed(4) + ', ' + atom.y.toFixed(4) + ', ' + atom.z.toFixed(4) + ')';
                    tooltipEl.style.display = 'block';
                    tooltipEl.style.left = (e.clientX - container.getBoundingClientRect().left + 15) + 'px';
                    tooltipEl.style.top = (e.clientY - container.getBoundingClientRect().top - 10) + 'px';
                } else {
                    tooltipEl.style.display = 'none';
                }
            }

            let touchStartDistance = 0;

            canvas.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (e.touches.length === 1) {
                    isRotating = true;
                    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                } else if (e.touches.length === 2) {
                    isRotating = false;
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    touchStartDistance = Math.sqrt(dx * dx + dy * dy);
                }
            }, { passive: false });

            canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                if (e.touches.length === 1 && isRotating) {
                    const deltaMove = { x: e.touches[0].clientX - previousMousePosition.x, y: e.touches[0].clientY - previousMousePosition.y };
                    rotationY += deltaMove.x * 0.005;
                    rotationX += deltaMove.y * 0.005;
                    updateMoleculeTransform();
                    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                } else if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (touchStartDistance > 0) {
                        const zoomFactor = touchStartDistance / dist;
                        cameraDistance *= zoomFactor;
                        cameraDistance = Math.max(1, Math.min(500, cameraDistance));
                        camera.position.z = cameraDistance;
                    }
                    touchStartDistance = dist;
                }
            }, { passive: false });

            canvas.addEventListener('touchend', function(e) {
                isRotating = false;
                if (e.touches.length < 2) { touchStartDistance = 0; }
            });

            window.addEventListener('resize', function() {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });

            function animate() {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            }
            animate();
        })();
    </script>
</body>
</html>`;
    }
}

class MolecularDocument implements vscode.CustomDocument {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly data: MolecularData
    ) {}

    dispose(): void {}
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
