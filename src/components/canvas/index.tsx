import React, { useRef, useEffect } from "react";

export type CanvasProps = {
    drawOnCanvas: (ctx: CanvasRenderingContext2D) => void;
    onWheel: (ctx: CanvasRenderingContext2D, e: WheelEvent) => void;
    onMouseMove: (ctx: CanvasRenderingContext2D, e: MouseEvent) => void;
    onClick: (ctx: CanvasRenderingContext2D, e: MouseEvent) => void;
    attributes?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
};

const Canvas = ({
    drawOnCanvas,
    onWheel,
    onMouseMove,
    onClick,
    attributes,
}: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const context = canvas.getContext("2d");
        if (!context) return;

        console.log("Canvas useEffect");

        const handleWheel = (e: WheelEvent) => onWheel(context, e);
        const handleMouseMouve = (e: MouseEvent) => onMouseMove(context, e);
        const handleClick = (e: MouseEvent) => onClick(context, e);

        canvas.addEventListener("wheel", handleWheel);
        canvas.addEventListener("mousemove", handleMouseMouve);
        canvas.addEventListener("click", handleClick);

        // let animationFrameId: number
        const render = () => {
            drawOnCanvas(context);
            requestAnimationFrame(render);
            // animationFrameId = requestAnimationFrame(render)
        };
        render();

        return () => {
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("mousemove", handleMouseMouve);
            canvas.removeEventListener("click", handleClick);

            // TODO: Fix flickering when calling cancelAnimationFrame
            // This might help: https://stackoverflow.com/questions/40265707/flickering-images-in-canvas-animation
            // cancelAnimationFrame(animationFrameId)
        };
    }, [drawOnCanvas, onWheel, onMouseMove, onClick]);

    useEffect(() => {
        const handleResize = () => {
            canvasRef.current!.width = window.innerWidth;
            canvasRef.current!.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return <canvas ref={canvasRef} />;
};

// export default Canvas;
