export interface CellJSON {
    coordinates: Coordinates;
    owner: VillagerId | null;
    object: EnviroObjectId | null;
}

export type VillagerId = number;
export type EnviroObjectId = number;
export type Coordinates = {
    x: number;
    y: number;
};
