import React, { useState, useRef } from 'react';
import type { Task } from '../types';

interface GraphViewProps {
    tasks: Task[];
}

// Basic Graph Types
interface Node extends Task {
    x: number;
    y: number;
    level: number;
}

interface Edge {
    source: Node;
    target: Node;
}

const LEVEL_HEIGHT = 100;
const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const HORIZONTAL_SPACING = 160;

const GraphView: React.FC<GraphViewProps> = ({ tasks }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Calculate Layout
    const { nodes, edges } = React.useMemo(() => {
        if (!tasks.length) return { nodes: [], edges: [] };

        // 1. Build Adjacency and In-Degree
        const adj: Record<number, number[]> = {};
        const inDegree: Record<number, number> = {};

        tasks.forEach(t => {
            adj[t.id] = [];
            inDegree[t.id] = 0;
        });

        // Populate edges
        tasks.forEach(t => {
            t.dependencies?.forEach(depId => {
                // dependency -> current task (depId -> t.id)
                if (adj[depId]) {
                    adj[depId].push(t.id);
                    inDegree[t.id] = (inDegree[t.id] || 0) + 1;
                }
            });
        });

        // 2. Assign Levels (Longest Path in DAG)
        const levels: Record<number, number> = {};
        const queue: number[] = [];

        tasks.forEach(t => {
            if (inDegree[t.id] === 0) {
                levels[t.id] = 0;
                queue.push(t.id);
            }
        });

        const tempInDegree = { ...inDegree };

        while (queue.length > 0) {
            const u = queue.shift()!;
            const currentLevel = levels[u];

            adj[u]?.forEach(v => {
                levels[v] = Math.max(levels[v] || 0, currentLevel + 1);
                tempInDegree[v]--;
                if (tempInDegree[v] === 0) {
                    queue.push(v);
                }
            });
        }

        // Force assign any remaining nodes (cycles?)
        tasks.forEach(t => {
            if (levels[t.id] === undefined) levels[t.id] = 0;
        });

        // 3. Assign X, Y
        const levelGroups: Record<number, Node[]> = {};
        tasks.forEach(t => {
            const lvl = levels[t.id];
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            const node: Node = { ...t, x: 0, y: lvl * LEVEL_HEIGHT + 50, level: lvl };
            levelGroups[lvl].push(node);
        });

        const finalNodes: Node[] = [];
        Object.keys(levelGroups).forEach(lvlStr => {
            const lvl = Number(lvlStr);
            const group = levelGroups[lvl];
            const rowWidth = group.length * HORIZONTAL_SPACING;
            const startX = -rowWidth / 2; // Center align

            group.forEach((node, idx) => {
                node.x = startX + idx * HORIZONTAL_SPACING + HORIZONTAL_SPACING / 2;
                finalNodes.push(node);
            });
        });

        // 4. Build Edges
        const finalEdges: Edge[] = [];
        finalNodes.forEach(targetNode => {
            targetNode.dependencies?.forEach(sourceId => {
                const sourceNode = finalNodes.find(n => n.id === sourceId);
                if (sourceNode) {
                    finalEdges.push({ source: sourceNode, target: targetNode });
                }
            });
        });

        return { nodes: finalNodes, edges: finalEdges };
    }, [tasks]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10b981'; // green-500
            case 'in_progress': return '#3b82f6'; // blue-500
            case 'blocked': return '#ef4444'; // red-500
            default: return '#9ca3af'; // gray-400
        }
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
                    viewBox="0 0 800 400"
                >
                    {/* Transform Group for Zoom/Pan */}
                    <g transform={`translate(${pan.x + 400}, ${pan.y + 50}) scale(${zoom})`}>
                        {/* Edges */}
                        {edges.map((edge, i) => (
                            <line
                                key={i}
                                x1={edge.source.x}
                                y1={edge.source.y}
                                x2={edge.target.x}
                                y2={edge.target.y}
                                stroke="#9ca3af"
                                strokeWidth="2"
                                markerEnd="url(#arrow)"
                            />
                        ))}

                        {/* Nodes */}
                        {nodes.map(node => (
                            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                                <rect
                                    x={-NODE_WIDTH / 2}
                                    y={-NODE_HEIGHT / 2}
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    rx="5"
                                    fill="white"
                                    stroke={getStatusColor(node.status)}
                                    strokeWidth="2"
                                />
                                <text
                                    textAnchor="middle"
                                    dy="0.3em"
                                    fontSize="12"
                                    className="pointer-events-none select-none"
                                >
                                    {node.title.slice(0, 15)}{node.title.length > 15 ? '...' : ''}
                                </text>
                            </g>
                        ))}

                        {/* Arrow Marker */}
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                            </marker>
                        </defs>
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
