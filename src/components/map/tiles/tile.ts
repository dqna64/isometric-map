export type Pos2D = {
    x: number;
    y: number;
};

export type TilePropsType = {
    mapStartPosition: Pos2D;
    tileIndex: Pos2D;
    tileImage: HTMLImageElement;
    ctx: CanvasRenderingContext2D;
};

export default class Tile {
    // THESE SHOULD BE CHANGED OR SET DYNAMICALLY
    static readonly TILE_WIDTH = 96;
    static readonly TILE_HEIGHT = 48;

    static readonly TILE_HALF_WIDTH = this.TILE_WIDTH / 2;
    static readonly TILE_HALF_HEIGHT = this.TILE_HEIGHT / 2;

    static readonly TILE_TYPE_EMPTY = 0;

    mapStartPosition: Pos2D;
    tileIndex: Pos2D;
    tileImage: HTMLImageElement;
    ctx: CanvasRenderingContext2D;

    renderPosition: Pos2D;

    constructor(props: TilePropsType) {
        this.tileImage = props.tileImage;
        this.mapStartPosition = props.mapStartPosition;
        this.tileIndex = props.tileIndex;
        this.renderPosition = this.calculateRenderPosition(props.tileIndex);
        this.ctx = props.ctx;
    }

    private calculateRenderPosition(tileIndex: Pos2D): Pos2D {
        const renderX =
            this.mapStartPosition.x +
            (tileIndex.x - tileIndex.y) * Tile.TILE_HALF_WIDTH;
        const renderY =
            this.mapStartPosition.y +
            (tileIndex.x + tileIndex.y) * Tile.TILE_HALF_HEIGHT;
        return { x: renderX, y: renderY };
    }

    drawTile(tileHeight: number): void {
        const offsetY = tileHeight - this.tileImage.height;
        // === If tile not visible, don't draw it ===
        // const transformedPosNW = getTransformedPoint(
        // 	this.ctx,
        // 	this.renderPosition.x + Tile.TILE_WIDTH,
        // 	this.renderPosition.y + Tile.TILE_HEIGHT + offsetY
        // );
        // const transformedPosSE = getTransformedPoint(
        // 	this.ctx,
        // 	this.renderPosition.x,
        // 	this.renderPosition.y + offsetY
        // );

        // if (
        // 	transformedPosNW.x < 0 ||
        // 	transformedPosSE.x > this.ctx.canvas.width ||
        // 	transformedPosNW.y < 0 ||
        // 	transformedPosSE.y > this.ctx.canvas.height
        // ) {
        // 	return;
        // }
        this.ctx.drawImage(
            this.tileImage,
            this.renderPosition.x,
            this.renderPosition.y + offsetY
        );
    }
}
