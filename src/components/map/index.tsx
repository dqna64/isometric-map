import React, { useCallback, useRef, useEffect } from "react";
import { getTileImages } from "./tiles/get-tile-images";
import Tile, { Pos2D } from "./tiles/tile";
import { worldMap as WORLD_MAP } from "../../map_state_1";
import { CellJSON, Coordinates } from "../../types";

export type MapProps = {};

export type MapSizeType = {
    width: number | undefined;
    height: number | undefined;
};

export interface IKeys {
    left: boolean;
    up: boolean;
    right: boolean;
    down: boolean;
    space: boolean;
}

interface IRange {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

const DEFAULT_MAP_SCALE = 1;
const DEFAULT_DELTA_X = 1;
// Set temporarily (Should be changed once the requirements for UI/UX are all determined)
const ZOOM_SENSITIVITY = 0.0002;
const MAX_SCALE = 2.4;
const MIN_SCALE = 0.6;
const HORIZONTAL_SCROLL_SENSITIVITY = 0.05;

// TODO: FIGURE OUT HOW THIS IS DETERMINED
const MAGIC_NUMBER_TO_ADJUST = 80;

const TILE_MAP = [
    [14, 23, 23, 23, 23, 23, 23, 23, 23, 13],
    [21, 32, 33, 33, 28, 33, 33, 33, 31, 20],
    [21, 34, 9, 9, 34, 1, 1, 1, 34, 20],
    [21, 34, 4, 4, 34, 1, 1, 10, 34, 20],
    [21, 25, 33, 33, 24, 33, 33, 33, 27, 20],
    [21, 34, 4, 7, 34, 18, 17, 10, 34, 20],
    [21, 34, 6, 8, 34, 16, 19, 10, 34, 20],
    [21, 34, 1, 1, 34, 10, 10, 10, 34, 20],
    [21, 29, 33, 33, 26, 33, 33, 33, 30, 20],
    [11, 22, 22, 22, 22, 22, 22, 22, 22, 12],
];

const DEFAULT_ZOOM_MATRIX = DOMMatrix.fromFloat64Array(
    new Float64Array([1, 0, 0, 1, 0, 0])
);

const MAX_VEL = 0.41; // distance units per second
const MIN_VEL = 0.005; // distance units per second
// Acceleration in distance units per second squared.
// NOTE: MUST be greater than MIN_VEL, otherwise acceleration will not be able
// to overcome the minimum velocity.
const ACCEL = 0.016;
const VEL_DAMPER = 0.94; // 0.9 means 90% of velocity is kept each frame

const WorldMap = ({}: MapProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRawRef = useRef({ x: -1, y: -1 });
    const originRawRef = useRef({ x: -1, y: -1 });
    // Transform matrix to represent pan (translate) and zoom (scale).
    // Default translate (0,0), zoom scale 1
    const transformMat = useRef(DEFAULT_ZOOM_MATRIX);
    // Translation speed in distance units per second
    const velocityRef = useRef({ x: 0, y: 0 });
    const [tileMap, setTileMap] = React.useState(TILE_MAP);
    const cells = useRef<Map<string, CellJSON>>(
        new Map(
            WORLD_MAP.cells.map((cell) => [generateKey(cell.coordinates), cell])
        )
    );

    // TODO: update when new cells are added or cells are removed
    const rangeRef = useRef<IRange>(findRange(cells.current));

    const [images, setImages] = React.useState<HTMLImageElement[]>(
        getTileImages()
    );
    const keyRef = useRef<IKeys>({
        left: false,
        up: false,
        right: false,
        down: false,
        space: false,
    });

    // DOMHIghResTimeStamp is a double representing the time in milliseconds,
    // potentially accurate to one thousandth of a millisecond but at least
    // accurate 1 millisecond. Value 0 is a special case which requestAnimationFrame
    // will never pass to the callback function.
    const startTimestamp = useRef<DOMHighResTimeStamp>(0);
    const prevTimestamp = useRef<DOMHighResTimeStamp>(0);

    // TODO: remove this constraint
    useEffect(() => {
        if (tileMap.length !== tileMap[0].length) {
            throw new Error("Tile map should be square");
        }
    }, [tileMap]);

    console.log("Render Map");

    // This shows which tile image should be displayed(index of TILE_TEXTURES fetched by getTileImages())

    const renderTileHover = useCallback(
        (ctx: CanvasRenderingContext2D) => (x: number, y: number) => {
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = "rgba(192, 57, 43, 0.8)";
            ctx.fillStyle = "rgba(192, 57, 43, 0.4)";
            ctx.lineWidth = 2;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Tile.TILE_WIDTH / 2, y - Tile.TILE_HEIGHT / 2);
            ctx.lineTo(x + Tile.TILE_WIDTH, y);
            ctx.lineTo(x + Tile.TILE_WIDTH / 2, y + Tile.TILE_HEIGHT / 2);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.fill();
        },
        []
    );

    const renderTiles = useCallback(
        (ctx: CanvasRenderingContext2D) => (x: number, y: number) => {
            const gridSize = tileMap.length;

            ctx.setTransform(transformMat.current);

            // for (let tileX = 0; tileX < gridSize; ++tileX) {
            // 	for (let tileY = 0; tileY < gridSize; ++tileY) {
            // 		const imageIndex = tileMap[tileY][tileX];

            // 		const tile: Tile = new Tile({
            // 			tileImage: images[imageIndex],
            // 			mapStartPosition: { x, y },
            // 			tileIndex: { x: tileX, y: tileY },
            // 			ctx,
            // 		});
            // 		tile.drawTile(MAGIC_NUMBER_TO_ADJUST);
            // 	}
            // }

            for (
                let tileX = rangeRef.current.minX;
                tileX <= rangeRef.current.maxX;
                ++tileX
            ) {
                for (
                    let tileY = rangeRef.current.minY;
                    tileY <= rangeRef.current.maxY;
                    ++tileY
                ) {
                    const tile: Tile = new Tile({
                        tileImage: images[4],
                        mapStartPosition: { x, y },
                        tileIndex: { x: tileX, y: tileY },
                        ctx,
                    });
                    tile.drawTile(MAGIC_NUMBER_TO_ADJUST);
                }
            }
            const mouseTransformed = getTransformedPoint(
                transformMat.current,
                mouseRawRef.current.x,
                mouseRawRef.current.y
            );

            const mouseFromTransOrigin: Pos2D = {
                x: mouseTransformed.x - x - 0 * ctx.getTransform().e,
                y: mouseTransformed.y - y - 0 * ctx.getTransform().f,
            };

            const hoverTileX =
                Math.floor(
                    mouseFromTransOrigin.y / Tile.TILE_HEIGHT +
                        mouseFromTransOrigin.x / Tile.TILE_WIDTH
                ) - 1;
            const hoverTileY = Math.floor(
                -mouseFromTransOrigin.x / Tile.TILE_WIDTH +
                    mouseFromTransOrigin.y / Tile.TILE_HEIGHT
            );

            if (
                cells.current.has(
                    generateKey({
                        x: hoverTileX,
                        y: hoverTileY,
                    })
                )
            ) {
                const renderX =
                    x + (hoverTileX - hoverTileY) * Tile.TILE_HALF_WIDTH;
                const renderY =
                    y + (hoverTileX + hoverTileY) * Tile.TILE_HALF_HEIGHT;

                renderTileHover(ctx)(renderX, renderY + Tile.TILE_HEIGHT);
            }

            // Restore normal transform
            ctx.restore();
            // ctx.setTransform(DEFAULT_ZOOM_MATRIX);
        },
        [tileMap, images]
    );

    const renderBackground = useCallback(
        (ctx: CanvasRenderingContext2D, width: number, height: number) => {
            // Can/Should change the color once UI design is determined
            ctx.fillStyle = "#151d26";

            // Save normal transformation matrix (done in useEffect prior
            // to starting rendering loop)
            // ctx.setTransform(DOMMatrix.fromMatrix(DEFAULT_ZOOM_MATRIX));
            ctx.save();

            // If render background using canvas width and height, must
            // reset canvase transformation matrix to normal before rendering.
            ctx.fillRect(0, 0, width, height);

            // ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        },
        []
    );

    const render = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            canvasSize: { width: number; height: number }
        ) => {
            // if (!canvasSize.width || !canvasSize.height) return;
            if (!canvasRef.current) return;

            const gridSize = tileMap.length;

            const offsetX = Tile.TILE_WIDTH / 2;
            const offsetY = Tile.TILE_HEIGHT;

            const remainingHeight =
                canvasSize.height - Tile.TILE_HEIGHT * gridSize;

            const tileStartX = canvasSize.width / 2 - offsetX;
            // MAGIC_NUMBER_TO_ADJUST is to adjust position when calling Tile.drawTile()
            const tileStartY =
                remainingHeight / 2 + offsetY - MAGIC_NUMBER_TO_ADJUST;

            originRawRef.current = { x: tileStartX, y: tileStartY };

            renderBackground(ctx, canvasSize.width, canvasSize.height);

            renderTiles(ctx)(tileStartX, tileStartY);
        },
        [originRawRef, renderBackground, renderTiles]
    );

    const onScrollY = useCallback(
        (ctx: CanvasRenderingContext2D, e: WheelEvent) => {
            // const currentScale = ctx.getTransform().a;
            const currentScale = transformMat.current.a;
            const zoomAmount = e.deltaY * ZOOM_SENSITIVITY;

            const transformedCursor = getTransformedPoint(
                transformMat.current,
                // e.offsetX,
                // e.clientX - ctx.canvas.getBoundingClientRect().left,
                mouseRawRef.current.x,
                // e.offsetY
                // e.clientY - ctx.canvas.getBoundingClientRect().top
                mouseRawRef.current.y
            );

            // When reaching MAX_SCALE, it only allows zoom OUT (= negative zoomAmount)
            if (currentScale >= MAX_SCALE && zoomAmount > 0) return; // prevent zoom in
            // When reaching MIN_SCALE, it only allows zoom IN (= positive zoomAmount)
            if (currentScale <= MIN_SCALE && zoomAmount < 0) return; // prevent zom out

            const scale = DEFAULT_MAP_SCALE + zoomAmount;

            // === Declarative method of rendering map zoom ===
            transformMat.current.scaleSelf(
                scale,
                scale,
                0,
                transformedCursor.x,
                transformedCursor.y
            );

            // Above equivalent to below
            // transformMat.current.translateSelf(
            // 	transformedCursor.x,
            // 	transformedCursor.y
            // );
            // transformMat.current.scaleSelf(scale, scale);
            // transformMat.current.translateSelf(
            // 	-transformedCursor.x,
            // 	-transformedCursor.y
            // );

            // === Imperative method of rendering map zoom ===
            // ctx.translate(e.offsetX, e.offsetY);
            // ctx.scale(scale, scale);
            // ctx.translate(-e.offsetX, -e.offsetY);

            // console.log({
            // 	currentScale,
            // 	zoomAmount,
            // 	scale,
            // 	offsetX: e.offsetX,
            // 	offsetY: e.offsetY,
            // 	deltaY: e.deltaY,
            // });
        },
        [transformMat.current]
    );

    const onScrollX = useCallback(
        (ctx: CanvasRenderingContext2D, e: WheelEvent) => {
            const moveAmount =
                DEFAULT_DELTA_X * e.deltaX * HORIZONTAL_SCROLL_SENSITIVITY;

            // Only allows x axis move
            // ctx.translate(moveAmount, 0);
            // transformMat.current.translateSelf(moveAmount, 0);
        },
        []
    );

    const onWheel = useCallback(
        (ctx: CanvasRenderingContext2D, e: WheelEvent) => {
            onScrollY(ctx, e);
            onScrollX(ctx, e);
        },
        [onScrollX, onScrollY]
    );

    const onMouseMove = useCallback(
        (ctx: CanvasRenderingContext2D, e: MouseEvent) => {
            const rect = ctx.canvas.getBoundingClientRect();

            mouseRawRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        },
        [mouseRawRef]
    );

    const onClick = useCallback(
        (ctx: CanvasRenderingContext2D, e: MouseEvent) => {
            const gridSize = tileMap.length;

            const { e: xPos, f: yPos } = ctx.getTransform();

            const mouse_x = e.clientX - originRawRef.current.x - xPos;
            const mouse_y = e.clientY - originRawRef.current.y - yPos;

            const hoverTileX =
                Math.floor(
                    mouse_y / Tile.TILE_HEIGHT + mouse_x / Tile.TILE_WIDTH
                ) - 1;
            const hoverTileY = Math.floor(
                -mouse_x / Tile.TILE_WIDTH + mouse_y / Tile.TILE_HEIGHT
            );

            if (
                hoverTileX >= 0 &&
                hoverTileY >= 0 &&
                hoverTileX < gridSize &&
                hoverTileY < gridSize
            ) {
                // Do something with the tile
            }
        },
        [tileMap, originRawRef]
    );

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Save current transformation matrix (normal). Will be restored after
        // rendering tiles each draw cycle to draw background properly.
        // context.save();

        console.log("Canvas useEffect");

        const handleWheel = (e: WheelEvent) => onWheel(context, e);
        const handleMouseMouve = (e: MouseEvent) => onMouseMove(context, e);
        const handleClick = (e: MouseEvent) => onClick(context, e);

        canvas.addEventListener("wheel", handleWheel);
        canvas.addEventListener("mousemove", handleMouseMouve);
        canvas.addEventListener("click", handleClick);

        const update = (
            ctx: CanvasRenderingContext2D,
            elapsed: DOMHighResTimeStamp,
            delta: DOMHighResTimeStamp
        ) => {
            if (keyRef.current.left) {
                velocityRef.current.x += ACCEL;
            }
            if (keyRef.current.right) {
                velocityRef.current.x -= ACCEL;
            }
            if (!keyRef.current.left && !keyRef.current.right) {
                velocityRef.current.x *= VEL_DAMPER;
            }
            if (Math.abs(velocityRef.current.x) > MAX_VEL) {
                velocityRef.current.x =
                    getSign(velocityRef.current.x) * MAX_VEL;
            } else if (Math.abs(velocityRef.current.x) < MIN_VEL) {
                velocityRef.current.x = 0;
            }

            if (keyRef.current.up) {
                velocityRef.current.y += ACCEL;
            }
            if (keyRef.current.down) {
                velocityRef.current.y -= ACCEL;
            }
            if (!keyRef.current.up && !keyRef.current.down) {
                velocityRef.current.y *= VEL_DAMPER;
            }
            if (Math.abs(velocityRef.current.y) > MAX_VEL) {
                velocityRef.current.y =
                    getSign(velocityRef.current.y) * MAX_VEL;
            } else if (Math.abs(velocityRef.current.y) < MIN_VEL) {
                velocityRef.current.y = 0;
            }

            const displacement = {
                x: velocityRef.current.x * delta,
                y: velocityRef.current.y * delta,
            };
            transformMat.current.translateSelf(displacement.x, displacement.y);
        };

        // let animationFrameId: number
        const draw = (timestamp: DOMHighResTimeStamp) => {
            if (startTimestamp.current === 0) {
                startTimestamp.current = timestamp;
                prevTimestamp.current = timestamp;
            }
            const elapsed = timestamp - startTimestamp.current;
            const delta = timestamp - prevTimestamp.current;
            update(context, elapsed, delta);

            if (canvasRef.current) {
                const canvasSize = {
                    width: canvasRef.current.width,
                    height: canvasRef.current.height,
                };

                render(context, canvasSize);
            }
            requestAnimationFrame(draw);
            prevTimestamp.current = timestamp;
            // animationFrameId = requestAnimationFrame(draw)
        };
        draw(performance.now());

        return () => {
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("mousemove", handleMouseMouve);
            canvas.removeEventListener("click", handleClick);

            // TODO: Fix flickering when calling cancelAnimationFrame
            // This might help: https://stackoverflow.com/questions/40265707/flickering-images-in-canvas-animation
            // cancelAnimationFrame(animationFrameId)
        };
    }, [
        render,
        onWheel,
        onMouseMove,
        onClick,
        canvasRef.current,
        keyRef.current,
    ]);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") {
                keyRef.current.right = false;
                keyRef.current.left = true;
                e.preventDefault();
            } else if (e.code === "ArrowUp" || e.code === "KeyW") {
                keyRef.current.down = false;
                keyRef.current.up = true;
                e.preventDefault();
            } else if (e.code === "ArrowRight" || e.code === "KeyD") {
                keyRef.current.left = false;
                keyRef.current.right = true;
                e.preventDefault();
            } else if (e.code === "ArrowDown" || e.code === "KeyS") {
                keyRef.current.up = false;
                keyRef.current.down = true;
                e.preventDefault();
            } else if (e.code === "Space") {
                keyRef.current.space = true;
                e.preventDefault();
            }
        });
        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") {
                keyRef.current.left = false;
                e.preventDefault();
            } else if (e.code === "ArrowUp" || e.code === "KeyW") {
                keyRef.current.up = false;
                e.preventDefault();
            } else if (e.code === "ArrowRight" || e.code === "KeyD") {
                keyRef.current.right = false;
                e.preventDefault();
            } else if (e.code === "ArrowDown" || e.code === "KeyS") {
                keyRef.current.down = false;
                e.preventDefault();
            } else if (e.code === "Space") {
                keyRef.current.space = false;
                e.preventDefault();
            }
        });
    }, []);

    return <canvas ref={canvasRef} />;
};

export default WorldMap;

/**
 * @param context canvas context 2d
 * @param inputX mouse/touch input position x (ie. clientX)
 * @param inputY mouse/touch input position y (ie. clientY)
 * @returns {x, y} x and y position of inputX/Y which map scale and position are taken into account
 */
export const getTransformedPoint = (
    // context: CanvasRenderingContext2D,
    transform: DOMMatrix,
    inputX: number,
    inputY: number
) => {
    // const transform = context.getTransform();
    const invertedScaleX = DEFAULT_MAP_SCALE / transform.a;
    const invertedScaleY = DEFAULT_MAP_SCALE / transform.d;

    const transformedX = invertedScaleX * inputX - invertedScaleX * transform.e;
    const transformedY = invertedScaleY * inputY - invertedScaleY * transform.f;

    return { x: transformedX, y: transformedY };
};

/**
 *
 * @param startPosition position where map start rendered (Position2D has {x: number, y: number} type)
 * @param inputX mouse/touch input position x (ie. clientX)
 * @param inputY mouse/touch input position x (ie. clientY)
 * @returns positionX, positionY: tile position x, y axis
 */
export const getTilePosition = (
    startPosition: Pos2D,
    inputX: number,
    inputY: number
): { positionX: number; positionY: number } => {
    const positionX =
        Math.floor(
            (inputY - startPosition.y) / Tile.TILE_HEIGHT +
                (inputX - startPosition.x) / Tile.TILE_WIDTH
        ) - 1;
    const positionY = Math.floor(
        (inputY - startPosition.y) / Tile.TILE_HEIGHT -
            (inputX - startPosition.x) / Tile.TILE_WIDTH
    );

    return { positionX, positionY };
};

const getSign = (value: number) => (value >= 0 ? 1 : -1);

// expects x and y to be integers
const generateKey = ({ x, y }: { x: number; y: number }) => `${x},${y}`;

const findRange = (cells: Map<string, CellJSON>): IRange => {
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    for (const cell of cells.values()) {
        const { x, y } = cell.coordinates;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }

    return { minX, minY, maxX, maxY };
};
