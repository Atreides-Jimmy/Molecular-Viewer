import { Atom, Bond, MolecularData } from '../types';

const ATOMIC_NUMBER_MAP: { [key: number]: string } = {
    1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
    11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar', 19: 'K', 20: 'Ca',
    21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr', 25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn',
    31: 'Ga', 32: 'Ge', 33: 'As', 34: 'Se', 35: 'Br', 36: 'Kr', 37: 'Rb', 38: 'Sr', 39: 'Y', 40: 'Zr',
    41: 'Nb', 42: 'Mo', 43: 'Tc', 44: 'Ru', 45: 'Rh', 46: 'Pd', 47: 'Ag', 48: 'Cd', 49: 'In', 50: 'Sn',
    51: 'Sb', 52: 'Te', 53: 'I', 54: 'Xe', 55: 'Cs', 56: 'Ba', 57: 'La', 58: 'Ce', 59: 'Pr', 60: 'Nd',
    61: 'Pm', 62: 'Sm', 63: 'Eu', 64: 'Gd', 65: 'Tb', 66: 'Dy', 67: 'Ho', 68: 'Er', 69: 'Tm', 70: 'Yb',
    71: 'Lu', 72: 'Hf', 73: 'Ta', 74: 'W', 75: 'Re', 76: 'Os', 77: 'Ir', 78: 'Pt', 79: 'Au', 80: 'Hg',
    81: 'Tl', 82: 'Pb', 83: 'Bi', 84: 'Po', 85: 'At', 86: 'Rn', 87: 'Fr', 88: 'Ra', 89: 'Ac', 90: 'Th',
    91: 'Pa', 92: 'U', 93: 'Np', 94: 'Pu', 95: 'Am', 96: 'Cm', 97: 'Bk', 98: 'Cf', 99: 'Es', 100: 'Fm',
    101: 'Md', 102: 'No', 103: 'Lr', 104: 'Rf', 105: 'Db', 106: 'Sg', 107: 'Bh', 108: 'Hs', 109: 'Mt', 110: 'Ds',
    111: 'Rg', 112: 'Cn', 113: 'Nh', 114: 'Fl', 115: 'Mc', 116: 'Lv', 117: 'Ts', 118: 'Og'
};

function resolveElement(raw: string): string {
    let cleaned = raw.replace(/\(.*?\)/g, '');
    const asNum = parseInt(cleaned, 10);
    if (!isNaN(asNum) && asNum > 0 && ATOMIC_NUMBER_MAP[asNum]) {
        return ATOMIC_NUMBER_MAP[asNum];
    }
    cleaned = cleaned.replace(/[0-9]/g, '');
    const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    if (capitalized.length >= 1 && capitalized.length <= 2 && /[A-Z][a-z]?/.test(capitalized)) {
        return capitalized;
    }
    return cleaned;
}

export function parseGjf(content: string): MolecularData {
    const lines = content.split(/\r?\n/);
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    let title = '';
    let hasExplicitBonds = false;

    let i = 0;

    while (i < lines.length && lines[i].trim() !== '') {
        i++;
    }
    while (i < lines.length && lines[i].trim() === '') {
        i++;
    }

    const titleParts: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
        titleParts.push(lines[i].trim());
        i++;
    }
    title = titleParts.join(' ');
    while (i < lines.length && lines[i].trim() === '') {
        i++;
    }

    if (i < lines.length) {
        i++;
    }

    let atomIndex = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('--')) {
            break;
        }

        const parts = line.split(/\s+/);

        if (parts.length >= 4) {
            const element = resolveElement(parts[0]);
            const x = parseFloat(parts[parts.length - 3]);
            const y = parseFloat(parts[parts.length - 2]);
            const z = parseFloat(parts[parts.length - 1]);

            if (element && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
                atoms.push({ element, x, y, z, index: atomIndex });
                atomIndex++;
            }
        }
        i++;
    }

    while (i < lines.length && lines[i].trim() === '') {
        i++;
    }

    if (i < lines.length) {
        const remaining = lines.slice(i).join('\n');
        const connectMatch = remaining.match(/connect\s*\n([\s\S]*?)(?:\n\s*\n|\n--|$)/i);
        if (connectMatch) {
            hasExplicitBonds = true;
            const connectLines = connectMatch[1].split(/\r?\n/);
            for (const cl of connectLines) {
                const trimmed = cl.trim();
                if (trimmed === '') continue;
                const cparts = trimmed.split(/\s+/);
                if (cparts.length < 2) continue;

                const atom1 = parseInt(cparts[0], 10) - 1;
                if (isNaN(atom1) || atom1 < 0) continue;

                let j = 1;
                while (j + 1 < cparts.length) {
                    const atom2 = parseInt(cparts[j], 10) - 1;
                    const bondOrder = parseFloat(cparts[j + 1]) || 1;
                    const order = Math.max(1, Math.min(3, Math.round(bondOrder)));

                    if (!isNaN(atom2) && atom2 >= 0 && atom1 !== atom2) {
                        const exists = bonds.some(b =>
                            (b.atom1 === atom1 && b.atom2 === atom2) ||
                            (b.atom1 === atom2 && b.atom2 === atom1)
                        );
                        if (!exists) {
                            bonds.push({ atom1, atom2, order });
                        }
                    }
                    j += 2;
                }

                if (cparts.length === 2) {
                    const atom2 = parseInt(cparts[1], 10) - 1;
                    if (!isNaN(atom2) && atom2 >= 0 && atom1 !== atom2) {
                        const exists = bonds.some(b =>
                            (b.atom1 === atom1 && b.atom2 === atom2) ||
                            (b.atom1 === atom2 && b.atom2 === atom1)
                        );
                        if (!exists) {
                            bonds.push({ atom1, atom2, order: 1 });
                        }
                    }
                }
            }
        }
    }

    return { atoms, bonds, title, hasExplicitBonds };
}
