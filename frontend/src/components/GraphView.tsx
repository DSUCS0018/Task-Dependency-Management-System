import React, { useState, useRef, } from 'react';
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

const LEVEL_HEIGHT = 120;
const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const HORIZONTAL_SPACING = 180;

const getIntersectionPoint = (source: { x: number, y: number }, target: { x: number, y: number }) => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    if (dx === 0 && dy === 0) return target;

    const halfWidth = NODE_WIDTH / 2;
    const halfHeight = NODE_HEIGHT / 2;

    const tX = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity;
    const tY = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity;
    const t = Math.min(tX, tY);

    return {
        x: target.x - t * dx,
        y: target.y - t * dy
    };
};

const GraphView: React.FC<GraphViewProps> = ({ tasks }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Calculate Layout
    const { nodes, edges } = React.useMemo(() => {
        if (!tasks.length) return { nodes: [], edges: [] };

        const adj: Record<number, number[]> = {};
        const inDegree: Record<number, number> = {};

        tasks.forEach(t => {
            adj[t.id] = [];
            inDegree[t.id] = 0;
        });

        tasks.forEach(t => {
            t.dependencies?.forEach(depId => {
                if (adj[depId]) {
                    adj[depId].push(t.id);
                    inDegree[t.id] = (inDegree[t.id] || 0) + 1;
                }
            });
        });

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

        tasks.forEach(t => {
            if (levels[t.id] === undefined) levels[t.id] = 0;
        });

        const levelGroups: Record<number, Node[]> = {};
        tasks.forEach(t => {
            const lvl = levels[t.id];
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            const node: Node = { ...t, x: 0, y: lvl * LEVEL_HEIGHT + 60, level: lvl };
            levelGroups[lvl].push(node);
        });

        const finalNodes: Node[] = [];
        Object.keys(levelGroups).forEach(lvlStr => {
            const lvl = Number(lvlStr);
            const group = levelGroups[lvl];
            const rowWidth = group.length * HORIZONTAL_SPACING;
            const startX = -rowWidth / 2;

            group.forEach((node, idx) => {
                node.x = startX + idx * HORIZONTAL_SPACING + HORIZONTAL_SPACING / 2;
                finalNodes.push(node);
            });
        });

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
        // Prevent default only if inside the SVG roughly? 
        // Actually e.preventDefault here might interfere with page scroll if not careful.
        // But for graph zooming, we usually want to block scroll.
        // e.preventDefault(); // React synthetic events might not need this or it might be too aggressive
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

    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    const handleNodeClick = (e: React.MouseEvent, taskId: number) => {
        e.stopPropagation();
        setSelectedTaskId(prev => prev === taskId ? null : taskId);
    };

    const getOpacity = (nodeId: number, isEdge: boolean = false, edgeSource?: number, edgeTarget?: number) => {
        if (!selectedTaskId) return 1;
        if (nodeId === selectedTaskId) return 1;
        if (isEdge) {
            return (edgeSource === selectedTaskId || edgeTarget === selectedTaskId) ? 1 : 0.1;
        }
        const isConnected = edges.some(e =>
            (e.source.id === selectedTaskId && e.target.id === nodeId) ||
            (e.target.id === selectedTaskId && e.source.id === nodeId)
        );
        return isConnected ? 1 : 0.1;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#34d399'; // emerald-400
            case 'in_progress': return '#60a5fa'; // blue-400
            case 'blocked': return '#f87171'; // red-400
            default: return '#94a3b8'; // slate-400
        }
    };

    const getNodeFill = (status: string) => {
        // Dark theme backgrounds for nodes
        switch (status) {
            case 'completed': return 'rgba(16, 185, 129, 0.2)';
            case 'in_progress': return 'rgba(59, 130, 246, 0.2)';
            case 'blocked': return 'rgba(239, 68, 68, 0.2)';
            default: return 'rgba(30, 41, 59, 0.6)'; // slate-800/60
        }
    };

    return (
        <div className="w-full h-full relative group">
            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p>Add data to visualize dependencies</p>
                </div>
            ) : (
                <>
                    <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur rounded-lg p-2 text-xs text-slate-400 border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> In Progress
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Completed
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Pending
                        </div>
                    </div>

                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        className="cursor-move touch-none"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => setSelectedTaskId(null)}
                        viewBox="0 0 800 600"
                    >
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                            </marker>
                            <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
                            </marker>
                        </defs>

                        <g transform={`translate(${pan.x + 400}, ${pan.y + 50}) scale(${zoom})`}>
                            {/* Edges */}
                            {edges.map((edge, i) => {
                                const endPoint = getIntersectionPoint(edge.source, edge.target);
                                const isActive = getOpacity(-1, true, edge.source.id, edge.target.id) === 1 && selectedTaskId;
                                return (
                                    <line
                                        key={i}
                                        x1={edge.source.x}
                                        y1={edge.source.y}
                                        x2={endPoint.x}
                                        y2={endPoint.y}
                                        stroke={isActive ? "#a855f7" : "#475569"}
                                        strokeWidth={isActive ? 2 : 1.5}
                                        markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
                                        opacity={getOpacity(-1, true, edge.source.id, edge.target.id)}
                                        className="transition-colors duration-300"
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {nodes.map(node => {
                                const opacity = getOpacity(node.id);
                                return (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        onClick={(e) => handleNodeClick(e, node.id)}
                                        style={{ cursor: 'pointer', opacity }}
                                        className="transition-opacity duration-300"
                                    >
                                        {/* Glow Effect for Selected */}
                                        {selectedTaskId === node.id && (
                                            <rect
                                                x={-NODE_WIDTH / 2 - 4}
                                                y={-NODE_HEIGHT / 2 - 4}
                                                width={NODE_WIDTH + 8}
                                                height={NODE_HEIGHT + 8}
                                                rx="8"
                                                fill="none"
                                                stroke="#a855f7"
                                                strokeWidth="2"
                                                opacity="0.5"
                                                filter="url(#glow)"
                                            />
                                        )}

                                        <rect
                                            x={-NODE_WIDTH / 2}
                                            y={-NODE_HEIGHT / 2}
                                            width={NODE_WIDTH}
                                            height={NODE_HEIGHT}
                                            rx="6"
                                            fill={getNodeFill(node.status)}
                                            stroke={selectedTaskId === node.id ? '#a855f7' : getStatusColor(node.status)}
                                            strokeWidth={selectedTaskId === node.id ? 2 : 1}
                                            className="backdrop-blur-sm transition-colors"
                                        />

                                        <text
                                            textAnchor="middle"
                                            dy="-0.2em"
                                            fontSize="12"
                                            fill="#e2e8f0"
                                            fontWeight="bold"
                                            className="pointer-events-none select-none"
                                        >
                                            {node.title.length > 18 ? node.title.slice(0, 16) + '...' : node.title}
                                        </text>

                                        <text
                                            textAnchor="middle"
                                            dy="1.2em"
                                            fontSize="10"
                                            fill="#94a3b8"
                                            className="pointer-events-none select-none uppercase tracking-wider"
                                        >
                                            {node.status.replace('_', ' ')}
                                        </text>
                                    </g>
                                )
                            })}
                        </g>
                    </svg>
                </>
            )}
        </div>
    );
};

export default GraphView;
