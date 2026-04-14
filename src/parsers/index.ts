import { MolecularData } from '../types';
import { parseGjf } from './gjfParser';
import { parseXyz } from './xyzParser';

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
        default:
            return tryAutoParse(content);
    }
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

    if (content.includes('--Link1--') || content.match(/#\s*[A-Za-z]/)) {
        return parseGjf(content);
    }

    return parseXyz(content);
}
