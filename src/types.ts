export interface Atom {
    element: string;
    x: number;
    y: number;
    z: number;
    index: number;
}

export interface Bond {
    atom1: number;
    atom2: number;
    order: number;
}

export interface MolecularData {
    atoms: Atom[];
    bonds: Bond[];
    title: string;
    hasExplicitBonds: boolean;
    filePath?: string;
}
