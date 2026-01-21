import React, { useState, useRef } from 'react';
import type { Task } from '../types';

interface GraphViewProps {
    tasks: Task[];
}

const GraphView: React.FC<GraphViewProps> = ({ tasks }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Prevent page scroll
        // Simple zoom logic
        const scaleFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
        // Clamp zoom
        setZoom(Math.min(Math.max(0.1, newZoom), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="mt-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dependency Graph</h2>
            <div
                className="border border-gray-100 bg-gray-50 rounded overflow-hidden cursor-move"
                style={{ height: '400px' }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    viewBox="0 0 800 400" // Base coordinate system
                >
                    {/* Transform Group for Zoom/Pan */}
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        <text x="400" y="200" textAnchor="middle" fill="#9ca3af">
                            Graph Visualization Will Appear Here ({tasks.length} tasks)
                        </text>
                        {/* Temporary debug circle to show center */}
                        <circle cx="400" cy="200" r="5" fill="#e5e7eb" />
                    </g>
                </svg>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex gap-2">
                <span>Zoom: {Math.round(zoom * 100)}%</span>
                <span>Blue: In Progress | Green: Completed | Red: Blocked | Gray: Pending</span>
            </div>
        </div>
    );
};

export default GraphView;
