"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFile = parseFile;
const gjfParser_1 = require("./gjfParser");
const xyzParser_1 = require("./xyzParser");
function parseFile(content, fileName) {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    switch (ext) {
        case 'gjf':
        case 'gjf03':
        case 'gjf09':
        case 'gjf16':
        case 'com':
            return (0, gjfParser_1.parseGjf)(content);
        case 'xyz':
            return (0, xyzParser_1.parseXyz)(content);
        default:
            return tryAutoParse(content);
    }
}
function tryAutoParse(content) {
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const possibleCount = parseInt(firstLine, 10);
        if (!isNaN(possibleCount) && possibleCount > 0 && possibleCount < 100000) {
            return (0, xyzParser_1.parseXyz)(content);
        }
    }
    if (content.includes('--Link1--') || content.match(/#\s*[A-Za-z]/)) {
        return (0, gjfParser_1.parseGjf)(content);
    }
    return (0, xyzParser_1.parseXyz)(content);
}
//# sourceMappingURL=index.js.map