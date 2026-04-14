"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MolecularViewerProvider = void 0;
const vscode = __importStar(require("vscode"));
const index_1 = require("../parsers/index");
const bondDetector_1 = require("../parsers/bondDetector");
class MolecularViewerProvider {
    constructor(context) {
        this.context = context;
    }
    async openCustomDocument(uri, _openContext, _token) {
        const content = await vscode.workspace.fs.readFile(uri);
        const textContent = new TextDecoder().decode(content);
        const fileName = uri.path.split('/').pop() || 'unknown.xyz';
        let data = (0, index_1.parseFile)(textContent, fileName);
        data = (0, bondDetector_1.ensureBonds)(data);
        return new MolecularDocument(uri, data);
    }
    async resolveCustomEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document.data);
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'saveFile':
                    try {
                        const uri = await vscode.window.showSaveDialog({
                            defaultUri: vscode.Uri.file(message.suggestedName || 'molecule.xyz'),
                            filters: {
                                'XYZ Files': ['xyz'],
                                'Gaussian Input': ['gjf'],
                                'All Files': ['*']
                            }
                        });
                        if (uri) {
                            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(message.content));
                            vscode.window.showInformationMessage('Saved: ' + uri.fsPath);
                        }
                    }
                    catch (e) {
                        vscode.window.showErrorMessage('Save failed: ' + (e.message || e));
                    }
                    break;
                case 'info':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message.text);
                    break;
            }
        });
    }
    getHtmlForWebview(webview, data) {
        const nonce = getNonce();
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'three.min.js'));
        const atomColors = {
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
            element: a.element, x: a.x, y: a.y, z: a.z,
            color: atomColors[a.element] || '#FF1493'
        }));
        const bondData = data.bonds.map(b => ({
            atom1: b.atom1, atom2: b.atom2, order: b.order
        }));
        const jsonData = JSON.stringify({ atoms: atomData, bonds: bondData, title: data.title });
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${webview.cspSource}; style-src 'nonce-${nonce}';">
<title>Molecular Viewer</title>
<style nonce="${nonce}">
*{margin:0;padding:0;box-sizing:border-box}
html{width:100%;height:100%;overflow:hidden}
body{width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;background:var(--vscode-editor-background,#1e1e1e);font-family:var(--vscode-font-family,sans-serif);color:var(--vscode-editor-foreground,#ccc)}
#toolbar{height:36px;flex-shrink:0;background:var(--vscode-editor-background,#1e1e1e);border-bottom:1px solid var(--vscode-panel-border,#444);display:flex;align-items:center;padding:0 8px;z-index:20;gap:2px}
.tbtn{background:var(--vscode-button-secondaryBackground,#3a3d41);color:var(--vscode-button-secondaryForeground,#fff);border:1px solid var(--vscode-panel-border,#444);padding:3px 10px;border-radius:3px;cursor:pointer;font-size:11px;white-space:nowrap}
.tbtn:hover{background:var(--vscode-button-secondaryHoverBackground,#45494e)}
.tbtn.active{background:var(--vscode-button-background,#0e639c);border-color:var(--vscode-button-background,#0e639c)}
.tsep{width:1px;height:20px;background:var(--vscode-panel-border,#444);margin:0 4px}
#status-bar{height:24px;flex-shrink:0;background:var(--vscode-statusBar-background,#007acc);color:var(--vscode-statusBar-foreground,#fff);display:flex;align-items:center;padding:0 10px;font-size:11px;z-index:20;gap:12px}
#container{flex:1;position:relative;overflow:hidden;min-height:0}
canvas{display:block}
#atom-tooltip{position:absolute;display:none;color:var(--vscode-editor-foreground,#ccc);font-size:12px;background:var(--vscode-editor-background,#1e1e1e);padding:4px 8px;border-radius:3px;border:1px solid var(--vscode-panel-border,#444);pointer-events:none;z-index:30}
#modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100;display:none;align-items:center;justify-content:center}
#modal-overlay.show{display:flex}
#modal{background:var(--vscode-editor-background,#1e1e1e);border:1px solid var(--vscode-panel-border,#444);border-radius:6px;padding:16px 20px;min-width:320px;max-width:420px;box-shadow:0 8px 30px rgba(0,0,0,0.5)}
#modal h3{font-size:14px;margin-bottom:10px;color:var(--vscode-editor-foreground,#ccc)}
#modal label{font-size:12px;display:block;margin:6px 0 2px}
#modal input[type=number],#modal select{width:100%;padding:4px 8px;background:var(--vscode-input-background,#3c3c3c);border:1px solid var(--vscode-input-border,#3c3c3c);color:var(--vscode-input-foreground,#ccc);border-radius:3px;font-size:12px}
#modal input[type=range]{width:100%;margin:4px 0}
#modal .modal-row{display:flex;gap:8px;align-items:center;margin:4px 0}
#modal .modal-row label{margin:0;white-space:nowrap;min-width:60px}
#modal .modal-row input,#modal .modal-row select{flex:1}
#modal .modal-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
#modal .mbtn{padding:5px 16px;border-radius:3px;cursor:pointer;font-size:12px;border:1px solid var(--vscode-panel-border,#444)}
#modal .mbtn-ok{background:var(--vscode-button-background,#0e639c);color:var(--vscode-button-foreground,#fff);border-color:var(--vscode-button-background,#0e639c)}
#modal .mbtn-ok:hover{background:var(--vscode-button-hoverBackground,#1177bb)}
#modal .mbtn-cancel{background:var(--vscode-button-secondaryBackground,#3a3d41);color:var(--vscode-button-secondaryForeground,#fff)}
#modal .mbtn-cancel:hover{background:var(--vscode-button-secondaryHoverBackground,#45494e)}
#modal .mbtn-danger{background:#c33;border-color:#c33;color:#fff}
#modal .current-val{font-size:13px;color:var(--vscode-descriptionForeground,#999);margin-bottom:6px}
#error-msg{display:none;color:#f66;padding:20px;font-size:13px}
</style>
</head>
<body>
<div id="toolbar">
<button class="tbtn active" data-mode="view">View</button>
<button class="tbtn" data-mode="bondLength">Bond Length</button>
<button class="tbtn" data-mode="bondAngle">Bond Angle</button>
<button class="tbtn" data-mode="dihedral">Dihedral</button>
<div class="tsep"></div>
<button class="tbtn" data-mode="addAtom">Add Atom</button>
<button class="tbtn" data-mode="deleteAtom">Delete Atom</button>
<div class="tsep"></div>
<button class="tbtn" id="save-btn">Save As</button>
<button class="tbtn" id="reset-btn">Reset View</button>
</div>
<div id="status-bar"><span id="mode-info">View Mode</span><span id="selection-info"></span></div>
<div id="container"></div>
<div id="error-msg"></div>
<div id="atom-tooltip"></div>
<div id="modal-overlay"><div id="modal"></div></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
<script nonce="${nonce}">
(function(){
var MD=${jsonData};
var container=document.getElementById('container');
var errorEl=document.getElementById('error-msg');
var tooltipEl=document.getElementById('atom-tooltip');
var modeInfoEl=document.getElementById('mode-info');
var selInfoEl=document.getElementById('selection-info');
var modalOverlay=document.getElementById('modal-overlay');
var modalEl=document.getElementById('modal');
var vscodeApi=acquireVsCodeApi();

function showError(msg){errorEl.style.display='block';errorEl.textContent=msg}

if(typeof THREE==='undefined'){showError('Failed to load Three.js library. Please check your internet connection (cdnjs.cloudflare.com).');return}

var cw=container.clientWidth||window.innerWidth;
var ch=container.clientHeight||(window.innerHeight-60);
if(ch<1)ch=window.innerHeight-60;
if(cw<1)cw=window.innerWidth;

var scene=new THREE.Scene();
scene.background=new THREE.Color(0x1e1e1e);
var camera=new THREE.PerspectiveCamera(60,cw/ch,0.1,1000);
var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(cw,ch);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x404040,1.5));
var dl1=new THREE.DirectionalLight(0xffffff,0.8);dl1.position.set(5,10,7);scene.add(dl1);
var dl2=new THREE.DirectionalLight(0xffffff,0.4);dl2.position.set(-5,-3,-5);scene.add(dl2);

var pivotGroup=new THREE.Group();scene.add(pivotGroup);
var moleculeGroup=new THREE.Group();pivotGroup.add(moleculeGroup);

var CX=0,CY=0,CZ=0;
MD.atoms.forEach(function(a){CX+=a.x;CY+=a.y;CZ+=a.z});
CX/=MD.atoms.length;CY/=MD.atoms.length;CZ/=MD.atoms.length;

var CR={H:0.31,He:0.28,Li:1.28,Be:0.96,B:0.84,C:0.76,N:0.71,O:0.66,F:0.57,Na:1.66,Mg:1.41,Al:1.21,Si:1.11,P:1.07,S:1.05,Cl:1.02,K:2.03,Ca:1.76,Fe:1.32,Cu:1.32,Zn:1.22,Br:1.20,I:1.39};
function getR(el){return(CR[el]||1.50)*0.5}

var atomMeshes=[];
var bondMeshes=[];

function rebuildScene(){
    while(moleculeGroup.children.length>0)moleculeGroup.remove(moleculeGroup.children[0]);
    atomMeshes.length=0;
    bondMeshes.length=0;
    CX=0;CY=0;CZ=0;
    MD.atoms.forEach(function(a){CX+=a.x;CY+=a.y;CZ+=a.z});
    if(MD.atoms.length>0){CX/=MD.atoms.length;CY/=MD.atoms.length;CZ/=MD.atoms.length}
    MD.atoms.forEach(function(a,i){
        a.index=i;
        var r=getR(a.element);
        var g=new THREE.SphereGeometry(r,32,24);
        var m=new THREE.MeshPhongMaterial({color:new THREE.Color(a.color),shininess:80,specular:0x444444});
        var mesh=new THREE.Mesh(g,m);
        mesh.position.set(a.x-CX,a.y-CY,a.z-CZ);
        mesh.userData={element:a.element,index:i};
        moleculeGroup.add(mesh);
        atomMeshes.push(mesh);
    });
    MD.bonds.forEach(function(b){createBond(b)});
    highlightSelected();
}

function getPerp(dir){
    var up=Math.abs(dir.y)<0.99?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
    return new THREE.Vector3().crossVectors(dir,up).normalize();
}

function createBond(b){
    var a1=MD.atoms[b.atom1],a2=MD.atoms[b.atom2];
    if(!a1||!a2)return;
    var s=new THREE.Vector3(a1.x-CX,a1.y-CY,a1.z-CZ);
    var e=new THREE.Vector3(a2.x-CX,a2.y-CY,a2.z-CZ);
    var d=new THREE.Vector3().subVectors(e,s);
    var l=d.length();
    var mp=new THREE.Vector3().addVectors(s,e).multiplyScalar(0.5);
    var br=0.12,ord=b.order||1;
    var c1=new THREE.Color(a1.color),c2=new THREE.Color(a2.color);
    if(ord===1){hBond(s,mp,d,l/2,br,c1);hBond(mp,e,d,l/2,br,c2)}
    else if(ord===2){var off=0.12,p=getPerp(d).multiplyScalar(off);
        hBond(s.clone().add(p),mp.clone().add(p),d,l/2,br*0.6,c1);hBond(mp.clone().add(p),e.clone().add(p),d,l/2,br*0.6,c2);
        hBond(s.clone().sub(p),mp.clone().sub(p),d,l/2,br*0.6,c1);hBond(mp.clone().sub(p),e.clone().sub(p),d,l/2,br*0.6,c2);
    }else if(ord===3){var off=0.15,p=getPerp(d).multiplyScalar(off);
        hBond(s,mp,d,l/2,br*0.45,c1);hBond(mp,e,d,l/2,br*0.45,c2);
        hBond(s.clone().add(p),mp.clone().add(p),d,l/2,br*0.45,c1);hBond(mp.clone().add(p),e.clone().add(p),d,l/2,br*0.45,c2);
        hBond(s.clone().sub(p),mp.clone().sub(p),d,l/2,br*0.45,c1);hBond(mp.clone().sub(p),e.clone().sub(p),d,l/2,br*0.45,c2);
    }else{hBond(s,mp,d,l/2,br,c1);hBond(mp,e,d,l/2,br,c2)}
}

function hBond(s,e,d,hl,r,c){
    var g=new THREE.CylinderGeometry(r,r,hl,8,1);
    var m=new THREE.MeshPhongMaterial({color:c,shininess:40,specular:0x222222});
    var mesh=new THREE.Mesh(g,m);
    var mid=new THREE.Vector3().addVectors(s,e).multiplyScalar(0.5);
    mesh.position.copy(mid);
    var axis=new THREE.Vector3(0,1,0);
    mesh.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(axis,d.clone().normalize()));
    moleculeGroup.add(mesh);
    bondMeshes.push(mesh);
}

rebuildScene();

var maxD=0;
MD.atoms.forEach(function(a){var dx=a.x-CX,dy=a.y-CY,dz=a.z-CZ,dd=Math.sqrt(dx*dx+dy*dy+dz*dz);if(dd>maxD)maxD=dd});
var initCam=maxD*2.5+5;
camera.position.set(0,0,initCam);camera.lookAt(0,0,0);

var isRot=false,isPan=false,prevM={x:0,y:0},rotX=0,rotY=0,panX=0,panY=0,camDist=initCam;
var currentMode='view';
var selectedAtoms=[];
var originalCoords=null;
var modalCallback=null;

var MODE_INFO={view:'View Mode',bondLength:'Bond Length - Click 2 atoms',bondAngle:'Bond Angle - Click 3 atoms (central 2nd)',dihedral:'Dihedral - Click 4 atoms',addAtom:'Add Atom - Click anchor atom',deleteAtom:'Delete Atom - Click atom to delete'};

function setMode(m){
    currentMode=m;selectedAtoms=[];originalCoords=null;hideModal();highlightSelected();
    modeInfoEl.textContent=MODE_INFO[m]||m;
    selInfoEl.textContent='';
    document.querySelectorAll('.tbtn[data-mode]').forEach(function(b){b.classList.toggle('active',b.dataset.mode===m)});
}

document.querySelectorAll('.tbtn[data-mode]').forEach(function(b){b.addEventListener('click',function(){setMode(this.dataset.mode)})});
document.getElementById('reset-btn').addEventListener('click',function(){rotX=0;rotY=0;panX=0;panY=0;camDist=initCam;camera.position.set(0,0,camDist);updateTransform()});
document.getElementById('save-btn').addEventListener('click',doSave);

function highlightSelected(){
    atomMeshes.forEach(function(m,i){
        var sel=selectedAtoms.indexOf(i)>=0;
        if(sel){m.material.emissive=new THREE.Color(0xffff00);m.material.emissiveIntensity=0.6}
        else{m.material.emissive=new THREE.Color(0x000000);m.material.emissiveIntensity=0}
    });
}

function selectAtom(idx){
    if(selectedAtoms.indexOf(idx)>=0)return;
    selectedAtoms.push(idx);
    highlightSelected();
    var names=selectedAtoms.map(function(i){return MD.atoms[i].element+(i+1)}).join(', ');
    selInfoEl.textContent='Selected: '+names;
    checkSelectionComplete();
}

function checkSelectionComplete(){
    if(currentMode==='bondLength'&&selectedAtoms.length===2)showBondLengthModal();
    else if(currentMode==='bondAngle'&&selectedAtoms.length===3)showBondAngleModal();
    else if(currentMode==='dihedral'&&selectedAtoms.length===4)showDihedralModal();
    else if(currentMode==='addAtom'&&selectedAtoms.length===1)showAddAtomModal();
    else if(currentMode==='deleteAtom'&&selectedAtoms.length===1)showDeleteAtomModal();
}

function dist(a,b){var dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return Math.sqrt(dx*dx+dy*dy+dz*dz)}
function angle(a,b,c){var v1={x:a.x-b.x,y:a.y-b.y,z:a.z-b.z},v2={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z};
    var d1=Math.sqrt(v1.x*v1.x+v1.y*v1.y+v1.z*v1.z),d2=Math.sqrt(v2.x*v2.x+v2.y*v2.y+v2.z*v2.z);
    if(d1<1e-10||d2<1e-10)return 0;
    var dot=(v1.x*v2.x+v1.y*v2.y+v1.z*v2.z)/(d1*d2);
    return Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI}

function dihedral(a,b,c,d){
    var b1={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},b2={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z},b3={x:d.x-c.x,y:d.y-c.y,z:d.z-c.z};
    function cross(u,v){return{x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x}}
    function dot(u,v){return u.x*v.x+u.y*v.y+u.z*v.z}
    function norm(v){var l=Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z);return l<1e-10?{x:0,y:0,z:0}:{x:v.x/l,y:v.y/l,z:v.z/l}}
    var n1=cross(b1,b2),n2=cross(b2,b3);
    var m=cross(norm(n1),norm(b2));
    var x=dot(n1,n2),y=dot(m,n2);
    return-Math.atan2(y,x)*180/Math.PI;
}

function getMovable(fixedSet,startIdx){
    var adj=[];for(var i=0;i<MD.atoms.length;i++)adj[i]=[];
    MD.bonds.forEach(function(b){adj[b.atom1].push(b.atom2);adj[b.atom2].push(b.atom1)});
    var visited=new Set(fixedSet);visited.add(startIdx);
    var queue=[startIdx],result=[startIdx];
    while(queue.length>0){var cur=queue.shift();adj[cur].forEach(function(nb){
        if(!visited.has(nb)){visited.add(nb);queue.push(nb);result.push(nb)}})}
    return result;
}

function rotAroundAxis(px,py,pz,ox,oy,oz,dx,dy,dz,angle){
    var c=Math.cos(angle),s=Math.sin(angle);
    var x=px-ox,y=py-oy,z=pz-oz;
    var kx=dx,ky=dy,kz=dz;
    var l=Math.sqrt(kx*kx+ky*ky+kz*kz);if(l<1e-10)return{x:px,y:py,z:pz};
    kx/=l;ky/=l;kz/=l;
    var dot=x*kx+y*ky+z*kz;
    var rx=x*c+(ky*z-kz*y)*s+kx*dot*(1-c);
    var ry=y*c+(kz*x-kx*z)*s+ky*dot*(1-c);
    var rz=z*c+(kx*y-ky*x)*s+kz*dot*(1-c);
    return{x:rx+ox,y:ry+oy,z:rz+oz};
}

function saveOriginal(){originalCoords=MD.atoms.map(function(a){return{x:a.x,y:a.y,z:a.z}})}
function restoreOriginal(){if(!originalCoords)return;originalCoords.forEach(function(c,i){MD.atoms[i].x=c.x;MD.atoms[i].y=c.y;MD.atoms[i].z=c.z})}

function applyBondLength(targetLen,fixFirst){
    var i1=selectedAtoms[0],i2=selectedAtoms[1];
    var a1=MD.atoms[i1],a2=MD.atoms[i2];
    var dx=a2.x-a1.x,dy=a2.y-a1.y,dz=a2.z-a1.z;
    var curLen=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(curLen<1e-10)return;
    var nx=dx/curLen,ny=dy/curLen,nz=dz/curLen;
    if(fixFirst){
        var fixedSet=new Set([i1]);var movable=getMovable(fixedSet,i2);
        movable.forEach(function(idx){var a=MD.atoms[idx];
            var ox=originalCoords[idx].x,oy=originalCoords[idx].y,oz=originalCoords[idx].z;
            var vx=ox-a1.x,vy=oy-a1.y,vz=oz-a1.z;
            var proj=vx*nx+vy*ny+vz*nz;
            var scale=targetLen/curLen;
            a.x=a1.x+vx*scale;a.y=a1.y+vy*scale;a.z=a1.z+vz*scale;
        });
    }else{
        var fixedSet=new Set([i2]);var movable=getMovable(fixedSet,i1);
        movable.forEach(function(idx){var a=MD.atoms[idx];
            var ox=originalCoords[idx].x,oy=originalCoords[idx].y,oz=originalCoords[idx].z;
            var vx=ox-a2.x,vy=oy-a2.y,vz=oz-a2.z;
            var nx2=a1.x-a2.x,ny2=a1.y-a2.y,nz2=a1.z-a2.z;
            var curLen2=Math.sqrt(nx2*nx2+ny2*ny2+nz2*nz2);
            if(curLen2<1e-10)return;
            nx2/=curLen2;ny2/=curLen2;nz2/=curLen2;
            var scale=targetLen/curLen2;
            a.x=a2.x+vx*scale;a.y=a2.y+vy*scale;a.z=a2.z+vz*scale;
        });
    }
    rebuildScene();
}

function applyBondAngle(targetDeg,fixFirstTwo){
    var i1=selectedAtoms[0],i2=selectedAtoms[1],i3=selectedAtoms[2];
    var a1=MD.atoms[i1],a2=MD.atoms[i2],a3=MD.atoms[i3];
    var curDeg=angle(originalCoords[i1],originalCoords[i2],originalCoords[i3]);
    var delta=(targetDeg-curDeg)*Math.PI/180;
    if(Math.abs(delta)<1e-10)return;
    var v1={x:originalCoords[i1].x-originalCoords[i2].x,y:originalCoords[i1].y-originalCoords[i2].y,z:originalCoords[i1].z-originalCoords[i2].z};
    var v2={x:originalCoords[i3].x-originalCoords[i2].x,y:originalCoords[i3].y-originalCoords[i2].y,z:originalCoords[i3].z-originalCoords[i2].z};
    var cx=v1.y*v2.z-v1.z*v2.y,cy=v1.z*v2.x-v1.x*v2.z,cz=v1.x*v2.y-v1.y*v2.x;
    var cl=Math.sqrt(cx*cx+cy*cy+cz*cz);if(cl<1e-10)return;
    cx/=cl;cy/=cl;cz/=cl;
    var ox=originalCoords[i2].x,oy=originalCoords[i2].y,oz=originalCoords[i2].z;
    if(fixFirstTwo){
        var fixedSet=new Set([i1,i2]);var movable=getMovable(fixedSet,i3);
        movable.forEach(function(idx){
            var oc=originalCoords[idx];
            var r=rotAroundAxis(oc.x,oc.y,oc.z,ox,oy,oz,cx,cy,cz,delta);
            MD.atoms[idx].x=r.x;MD.atoms[idx].y=r.y;MD.atoms[idx].z=r.z;
        });
    }else{
        var fixedSet=new Set([i2,i3]);var movable=getMovable(fixedSet,i1);
        movable.forEach(function(idx){
            var oc=originalCoords[idx];
            var r=rotAroundAxis(oc.x,oc.y,oc.z,ox,oy,oz,cx,cy,cz,-delta);
            MD.atoms[idx].x=r.x;MD.atoms[idx].y=r.y;MD.atoms[idx].z=r.z;
        });
    }
    rebuildScene();
}

function applyDihedral(targetDeg,fixFirstThree){
    var i1=selectedAtoms[0],i2=selectedAtoms[1],i3=selectedAtoms[2],i4=selectedAtoms[3];
    var curDeg=dihedral(originalCoords[i1],originalCoords[i2],originalCoords[i3],originalCoords[i4]);
    var delta=(targetDeg-curDeg)*Math.PI/180;
    if(Math.abs(delta)<1e-10)return;
    var ax=originalCoords[i3].x-originalCoords[i2].x,ay=originalCoords[i3].y-originalCoords[i2].y,az=originalCoords[i3].z-originalCoords[i2].z;
    var al=Math.sqrt(ax*ax+ay*ay+az*az);if(al<1e-10)return;
    ax/=al;ay/=al;az/=al;
    var ox=originalCoords[i2].x,oy=originalCoords[i2].y,oz=originalCoords[i2].z;
    if(fixFirstThree){
        var fixedSet=new Set([i1,i2,i3]);var movable=getMovable(fixedSet,i4);
        movable.forEach(function(idx){
            var oc=originalCoords[idx];
            var r=rotAroundAxis(oc.x,oc.y,oc.z,ox,oy,oz,ax,ay,az,delta);
            MD.atoms[idx].x=r.x;MD.atoms[idx].y=r.y;MD.atoms[idx].z=r.z;
        });
    }else{
        var fixedSet=new Set([i2,i3,i4]);var movable=getMovable(fixedSet,i1);
        movable.forEach(function(idx){
            var oc=originalCoords[idx];
            var r=rotAroundAxis(oc.x,oc.y,oc.z,ox,oy,oz,ax,ay,az,-delta);
            MD.atoms[idx].x=r.x;MD.atoms[idx].y=r.y;MD.atoms[idx].z=r.z;
        });
    }
    rebuildScene();
}

function showModal(html,cb){modalEl.innerHTML=html;modalOverlay.classList.add('show');modalCallback=cb}
function hideModal(){modalOverlay.classList.remove('show');modalCallback=null}

function showBondLengthModal(){
    var a1=MD.atoms[selectedAtoms[0]],a2=MD.atoms[selectedAtoms[1]];
    var cur=dist(a1,a2);
    saveOriginal();
    var n1=a1.element+(selectedAtoms[0]+1),n2=a2.element+(selectedAtoms[1]+1);
    showModal('<h3>Adjust Bond Length</h3>'+
        '<div class="current-val">Current: '+cur.toFixed(4)+' A</div>'+
        '<label>Fix atom:</label><select id="m-fix"><option value="1">Fix '+n1+' (move '+n2+')</option><option value="2">Fix '+n2+' (move '+n1+')</option></select>'+
        '<label>Target length (A):</label><input type="number" id="m-val" value="'+cur.toFixed(4)+'" step="0.01" min="0.5" max="6">'+
        '<input type="range" id="m-slider" value="'+cur.toFixed(4)+'" min="0.5" max="6" step="0.01">'+
        '<div class="modal-btns"><button class="mbtn mbtn-cancel" id="m-cancel">Cancel</button><button class="mbtn mbtn-ok" id="m-ok">OK</button></div>',null);
    var valEl=document.getElementById('m-val'),sliderEl=document.getElementById('m-slider'),fixEl=document.getElementById('m-fix');
    sliderEl.addEventListener('input',function(){valEl.value=this.value;applyBondLength(parseFloat(this.value),fixEl.value==='1')});
    valEl.addEventListener('input',function(){sliderEl.value=this.value;applyBondLength(parseFloat(this.value),fixEl.value==='1')});
    fixEl.addEventListener('change',function(){applyBondLength(parseFloat(valEl.value),this.value==='1')});
    document.getElementById('m-ok').addEventListener('click',function(){hideModal();originalCoords=null;setMode('view')});
    document.getElementById('m-cancel').addEventListener('click',function(){restoreOriginal();rebuildScene();hideModal();originalCoords=null;setMode('view')});
}

function showBondAngleModal(){
    var a1=MD.atoms[selectedAtoms[0]],a2=MD.atoms[selectedAtoms[1]],a3=MD.atoms[selectedAtoms[2]];
    var cur=angle(a1,a2,a3);
    saveOriginal();
    var n1=a1.element+(selectedAtoms[0]+1),n2=a2.element+(selectedAtoms[1]+1),n3=a3.element+(selectedAtoms[2]+1);
    showModal('<h3>Adjust Bond Angle</h3>'+
        '<div class="current-val">Current: '+cur.toFixed(2)+' deg</div>'+
        '<label>Fix side:</label><select id="m-fix"><option value="1">Fix '+n1+'-'+n2+' (move '+n3+')</option><option value="2">Fix '+n2+'-'+n3+' (move '+n1+')</option></select>'+
        '<label>Target angle (deg):</label><input type="number" id="m-val" value="'+cur.toFixed(2)+'" step="0.5" min="5" max="175">'+
        '<input type="range" id="m-slider" value="'+cur.toFixed(2)+'" min="5" max="175" step="0.5">'+
        '<div class="modal-btns"><button class="mbtn mbtn-cancel" id="m-cancel">Cancel</button><button class="mbtn mbtn-ok" id="m-ok">OK</button></div>',null);
    var valEl=document.getElementById('m-val'),sliderEl=document.getElementById('m-slider'),fixEl=document.getElementById('m-fix');
    sliderEl.addEventListener('input',function(){valEl.value=this.value;applyBondAngle(parseFloat(this.value),fixEl.value==='1')});
    valEl.addEventListener('input',function(){sliderEl.value=this.value;applyBondAngle(parseFloat(this.value),fixEl.value==='1')});
    fixEl.addEventListener('change',function(){applyBondAngle(parseFloat(valEl.value),this.value==='1')});
    document.getElementById('m-ok').addEventListener('click',function(){hideModal();originalCoords=null;setMode('view')});
    document.getElementById('m-cancel').addEventListener('click',function(){restoreOriginal();rebuildScene();hideModal();originalCoords=null;setMode('view')});
}

function showDihedralModal(){
    var a1=MD.atoms[selectedAtoms[0]],a2=MD.atoms[selectedAtoms[1]],a3=MD.atoms[selectedAtoms[2]],a4=MD.atoms[selectedAtoms[3]];
    var cur=dihedral(a1,a2,a3,a4);
    saveOriginal();
    var n1=a1.element+(selectedAtoms[0]+1),n2=a2.element+(selectedAtoms[1]+1),n3=a3.element+(selectedAtoms[2]+1),n4=a4.element+(selectedAtoms[3]+1);
    showModal('<h3>Adjust Dihedral Angle</h3>'+
        '<div class="current-val">Current: '+cur.toFixed(2)+' deg</div>'+
        '<label>Fix side:</label><select id="m-fix"><option value="1">Fix '+n1+'-'+n2+'-'+n3+' (move '+n4+')</option><option value="2">Fix '+n2+'-'+n3+'-'+n4+' (move '+n1+')</option></select>'+
        '<label>Target dihedral (deg):</label><input type="number" id="m-val" value="'+cur.toFixed(2)+'" step="1" min="-180" max="180">'+
        '<input type="range" id="m-slider" value="'+cur.toFixed(2)+'" min="-180" max="180" step="1">'+
        '<div class="modal-btns"><button class="mbtn mbtn-cancel" id="m-cancel">Cancel</button><button class="mbtn mbtn-ok" id="m-ok">OK</button></div>',null);
    var valEl=document.getElementById('m-val'),sliderEl=document.getElementById('m-slider'),fixEl=document.getElementById('m-fix');
    sliderEl.addEventListener('input',function(){valEl.value=this.value;applyDihedral(parseFloat(this.value),fixEl.value==='1')});
    valEl.addEventListener('input',function(){sliderEl.value=this.value;applyDihedral(parseFloat(this.value),fixEl.value==='1')});
    fixEl.addEventListener('change',function(){applyDihedral(parseFloat(valEl.value),this.value==='1')});
    document.getElementById('m-ok').addEventListener('click',function(){hideModal();originalCoords=null;setMode('view')});
    document.getElementById('m-cancel').addEventListener('click',function(){restoreOriginal();rebuildScene();hideModal();originalCoords=null;setMode('view')});
}

function showAddAtomModal(){
    var anchorIdx=selectedAtoms[0];
    var anchor=MD.atoms[anchorIdx];
    saveOriginal();
    showModal('<h3>Add Atom</h3>'+
        '<label>Element:</label><select id="m-elem"><option>H</option><option>C</option><option>N</option><option>O</option><option>F</option><option>P</option><option>S</option><option>Cl</option><option>Br</option><option>I</option></select>'+
        '<label>Bond length (A):</label><input type="number" id="m-val" value="1.09" step="0.01" min="0.5" max="4">'+
        '<div class="modal-btns"><button class="mbtn mbtn-cancel" id="m-cancel">Cancel</button><button class="mbtn mbtn-ok" id="m-ok">OK</button></div>',null);
    document.getElementById('m-elem').addEventListener('change',function(){
        var defaults={H:1.09,C:1.54,N:1.47,O:1.43,F:1.36,P:1.80,S:1.82,Cl:1.77,Br:1.94,I:2.14};
        document.getElementById('m-val').value=defaults[this.value]||1.5;
    });
    document.getElementById('m-ok').addEventListener('click',function(){
        var el=document.getElementById('m-elem').value;
        var bl=parseFloat(document.getElementById('m-val').value)||1.5;
        var dir={x:0,y:0,z:1};
        var bonded=[];
        MD.bonds.forEach(function(b){
            if(b.atom1===anchorIdx)bonded.push(b.atom2);
            if(b.atom2===anchorIdx)bonded.push(b.atom1);
        });
        if(bonded.length>0){
            var avg={x:0,y:0,z:0};
            bonded.forEach(function(bi){avg.x+=MD.atoms[bi].x-anchor.x;avg.y+=MD.atoms[bi].y-anchor.y;avg.z+=MD.atoms[bi].z-anchor.z});
            var al=Math.sqrt(avg.x*avg.x+avg.y*avg.y+avg.z*avg.z);
            if(al>1e-10){dir={x:-avg.x/al,y:-avg.y/al,z:-avg.z/al}}
        }
        var newIdx=MD.atoms.length;
        var colors={H:'#FFFFFF',C:'#909090',N:'#3050F8',O:'#FF0D0D',F:'#90E050',P:'#FF8000',S:'#FFFF30',Cl:'#1FF01F',Br:'#A62929',I:'#940094'};
        MD.atoms.push({element:el,x:anchor.x+dir.x*bl,y:anchor.y+dir.y*bl,z:anchor.z+dir.z*bl,color:colors[el]||'#FF1493',index:newIdx});
        MD.bonds.push({atom1:anchorIdx,atom2:newIdx,order:1});
        rebuildScene();hideModal();originalCoords=null;setMode('view');
    });
    document.getElementById('m-cancel').addEventListener('click',function(){hideModal();originalCoords=null;setMode('view')});
}

function showDeleteAtomModal(){
    var idx=selectedAtoms[0];
    var a=MD.atoms[idx];
    var name=a.element+(idx+1);
    showModal('<h3>Delete Atom</h3>'+
        '<div class="current-val">Delete '+name+'?</div>'+
        '<div class="modal-btns"><button class="mbtn mbtn-cancel" id="m-cancel">Cancel</button><button class="mbtn mbtn-ok mbtn-danger" id="m-ok">Delete</button></div>',null);
    document.getElementById('m-ok').addEventListener('click',function(){
        MD.atoms.splice(idx,1);
        MD.atoms.forEach(function(a,i){a.index=i});
        MD.bonds=MD.bonds.filter(function(b){return b.atom1!==idx&&b.atom2!==idx}).map(function(b){
            return{atom1:b.atom1>idx?b.atom1-1:b.atom1,atom2:b.atom2>idx?b.atom2-1:b.atom2,order:b.order};
        });
        rebuildScene();hideModal();setMode('view');
    });
    document.getElementById('m-cancel').addEventListener('click',function(){hideModal();setMode('view')});
}

function doSave(){
    var xyz=MD.atoms.length+'\\n'+(MD.title||'Modified structure')+'\\n';
    MD.atoms.forEach(function(a){xyz+=a.element+'  '+a.x.toFixed(6)+'  '+a.y.toFixed(6)+'  '+a.z.toFixed(6)+'\\n'});
    var gjf='%chk=molecule.chk\\n%mem=4GB\\n%nproc=4\\n# B3LYP/6-31G(d)\\n\\n'+(MD.title||'Modified structure')+'\\n\\n0 1\\n';
    MD.atoms.forEach(function(a){gjf+=' '+a.element+'   '+a.x.toFixed(6)+'   '+a.y.toFixed(6)+'   '+a.z.toFixed(6)+'\\n'});
    gjf+='\\n';
    showModal('<h3>Save File</h3>'+
        '<label>Format:</label><select id="m-fmt"><option value="xyz">XYZ (.xyz)</option><option value="gjf">Gaussian Input (.gjf)</option></select>'+
        '<div class="modal-btns"><button class="mbtn mbtn-cancel" id="m-cancel">Cancel</button><button class="mbtn mbtn-ok" id="m-ok">Save</button></div>',null);
    document.getElementById('m-ok').addEventListener('click',function(){
        var fmt=document.getElementById('m-fmt').value;
        var content=fmt==='gjf'?gjf:xyz;
        var ext=fmt==='gjf'?'.gjf':'.xyz';
        vscodeApi.postMessage({command:'saveFile',content:content,suggestedName:'molecule_modified'+ext});
        hideModal();
    });
    document.getElementById('m-cancel').addEventListener('click',function(){hideModal()});
}

function updateTransform(){
    moleculeGroup.rotation.copy(new THREE.Euler(rotX,rotY,0,'YXZ'));
    pivotGroup.position.set(panX,panY,0);
}

var canvas=renderer.domElement;
var raycaster=new THREE.Raycaster();
var mouse=new THREE.Vector2();

function getClickedAtom(e){
    var rect=canvas.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    var hits=raycaster.intersectObjects(atomMeshes);
    if(hits.length>0)return hits[0].object.userData.index;
    return-1;
}

canvas.addEventListener('mousedown',function(e){
    if(currentMode!=='view'&&e.button===0){
        var idx=getClickedAtom(e);
        if(idx>=0){selectAtom(idx);e.preventDefault();return}
    }
    if(e.button===0)isRot=true;
    else if(e.button===1||e.button===2)isPan=true;
    prevM={x:e.clientX,y:e.clientY};
    e.preventDefault();
});

canvas.addEventListener('mousemove',function(e){
    var dm={x:e.clientX-prevM.x,y:e.clientY-prevM.y};
    if(isRot){rotY+=dm.x*0.005;rotX+=dm.y*0.005;updateTransform()}
    if(isPan){panX+=dm.x*0.01*(camDist/20);panY-=dm.y*0.01*(camDist/20);updateTransform()}
    prevM={x:e.clientX,y:e.clientY};
    var rect=canvas.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    var hits=raycaster.intersectObjects(atomMeshes);
    if(hits.length>0){var o=hits[0].object,i=o.userData.index,a=MD.atoms[i];
        tooltipEl.textContent=a.element+(i+1)+' ('+a.x.toFixed(4)+', '+a.y.toFixed(4)+', '+a.z.toFixed(4)+')';
        tooltipEl.style.display='block';
        tooltipEl.style.left=(e.clientX-container.getBoundingClientRect().left+15)+'px';
        tooltipEl.style.top=(e.clientY-container.getBoundingClientRect().top-10)+'px';
    }else{tooltipEl.style.display='none'}
});

canvas.addEventListener('mouseup',function(){isRot=false;isPan=false});
canvas.addEventListener('mouseleave',function(){isRot=false;isPan=false;tooltipEl.style.display='none'});
canvas.addEventListener('wheel',function(e){e.preventDefault();camDist*=e.deltaY>0?1.1:0.9;camDist=Math.max(1,Math.min(500,camDist));camera.position.z=camDist},{passive:false});
canvas.addEventListener('contextmenu',function(e){e.preventDefault()});

var touchSD=0;
canvas.addEventListener('touchstart',function(e){e.preventDefault();
    if(e.touches.length===1){isRot=true;prevM={x:e.touches[0].clientX,y:e.touches[0].clientY}}
    else if(e.touches.length===2){isRot=false;var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;touchSD=Math.sqrt(dx*dx+dy*dy)}
},{passive:false});
canvas.addEventListener('touchmove',function(e){e.preventDefault();
    if(e.touches.length===1&&isRot){var dm={x:e.touches[0].clientX-prevM.x,y:e.touches[0].clientY-prevM.y};rotY+=dm.x*0.005;rotX+=dm.y*0.005;updateTransform();prevM={x:e.touches[0].clientX,y:e.touches[0].clientY}}
    else if(e.touches.length===2){var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY,d=Math.sqrt(dx*dx+dy*dy);
        if(touchSD>0){camDist*=touchSD/d;camDist=Math.max(1,Math.min(500,camDist));camera.position.z=camDist}touchSD=d}
},{passive:false});
canvas.addEventListener('touchend',function(e){isRot=false;if(e.touches.length<2)touchSD=0});

window.addEventListener('resize',function(){var rw=container.clientWidth||window.innerWidth;var rh=container.clientHeight||(window.innerHeight-60);if(rw<1)rw=window.innerWidth;if(rh<1)rh=window.innerHeight-60;camera.aspect=rw/rh;camera.updateProjectionMatrix();renderer.setSize(rw,rh)});

function animate(){requestAnimationFrame(animate);renderer.render(scene,camera)}
animate();
})();
</script>
</body>
</html>`;
    }
}
exports.MolecularViewerProvider = MolecularViewerProvider;
class MolecularDocument {
    constructor(uri, data) {
        this.uri = uri;
        this.data = data;
    }
    dispose() { }
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=molecularViewer.js.map