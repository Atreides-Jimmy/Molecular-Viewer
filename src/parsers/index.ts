import { MolecularData } from '../types';
import { parseGjf } from './gjfParser';
import { parseXyz } from './xyzParser';
import { parseMol2 } from './mol2Parser';
import { parseGaussianLog, LogFrame } from './logParser';

export { parseGaussianLog, LogFrame };

export function parseFile(content: string, fileName: string): MolecularData {
    const ext = fileName.toLowerCase().split('.').pop() || '';

    switch (ext) {
        case 'gjf':
        case 'gjf03':
        case 'gjf09':
        case 'gjf16':
        case 'com':
            return parseGjf(content);
        case 'xyz':
            return parseXyz(content);
        case 'mol2':
            return parseMol2(content);
        case 'log':
        case 'out':
            return parseLogAsSingleFrame(content);
        default:
            return tryAutoParse(content);
    }
}

export function parseLogFile(content: string): { frames: LogFrame[], title: string } {
    return parseGaussianLog(content);
}

function parseLogAsSingleFrame(content: string): MolecularData {
    const result = parseGaussianLog(content);
    if (result.frames.length > 0) {
        return {
            atoms: result.frames[0].atoms,
            bonds: result.frames[0].bonds,
            title: result.frames[0].title,
            hasExplicitBonds: result.frames[0].hasExplicitBonds
        };
    }
    return { atoms: [], bonds: [], title: 'Empty', hasExplicitBonds: false };
}

function tryAutoParse(content: string): MolecularData {
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');

    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const possibleCount = parseInt(firstLine, 10);
        if (!isNaN(possibleCount) && possibleCount > 0 && possibleCount < 100000) {
            return parseXyz(content);
        }
    }

    if (content.includes('@<TRIPOS>')) {
        return parseMol2(content);
    }

    if (content.includes('Standard orientation:') || content.includes('Input orientation:')) {
        return parseLogAsSingleFrame(content);
    }

    if (content.includes('--Link1--') || content.match(/#\s*[A-Za-z]/)) {
        return parseGjf(content);
    }

    return parseXyz(content);
}
