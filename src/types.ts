export interface WorldMapJSON {
    cells: CellsType;
}

export type CellsType = Record<CoordStr, CellJSON>;

export interface CellJSON {
    owner: VillagerId | null;
    object: EnviroObjectId | null;
}

export type VillagerId = string;
export type EnviroObjectId = string;
export type Coordinates = {
    x: number;
    y: number;
};

export interface AssetJSON {
    id: string;
    name: string;
    date: string;
    description: string;
    type: string;
    remoteImages: RemoteImageJSON[];
    dimensions: Dimensions;
}

export interface AssetJSONWithImageEl extends AssetJSON {
    imageEl: HTMLImageElement | null;
}

interface RemoteImageJSON {
    name: string;
    url: string;
}

export type Dimensions = {
    width: number; // x-axis
    height: number; // y-axis
};

export type CoordStr = `${number},${number}`;

export const isCoordStr = (str: string): str is CoordStr => {
    return /^-?\d+,-?\d+$/.test(str);
};
