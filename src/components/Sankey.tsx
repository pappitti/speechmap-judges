import React, { useMemo, useEffect, useRef, useState } from 'react';
import type { HeatmapProps as SankeyDiagramProps } from '../types'; // Reuse the same props type
import { categorySort } from '../utils/chartUtils';

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ matrix, judge1, judge2, onCellClick }) => {
    // --- Refs and State for Responsiveness ---
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

    // --- Effect to measure container size ---
    useEffect(() => {
        // ResizeObserver to detect when the container's size changes
        const observer = new ResizeObserver(entries => {
        if (entries && entries.length > 0 && entries[0].contentRect) {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width: width - 45, height: height - 60 }); // adjusting for titles and labels
        }
        });

        const currentRef = containerRef.current;
        if (currentRef) {
        observer.observe(currentRef);
        }

        return () => {
        if (currentRef) {
            observer.unobserve(currentRef);
        }
        };
    }, []);

    // --- Layout Constants ---
    const NODE_WIDTH = 0; // padding on both sides of the edges
    const NODE_GAP = 10; // Vertical gap between nodes
    const PADDING = { top: 0, bottom: 0, left: 10, right: 10 }; // Padding around the SVG

    // --- Calculation Logic inside useMemo ---
    const sankeyData = useMemo(() => {
        const { width, height } = dimensions;
        if (width === 0 || height === 0) {
            return { nodes: [], links: [] };
        }

        const judge1Cat = Object.keys(matrix).sort(categorySort);
        const judge2Cat = judge1Cat.reduce((acc, cat) => {
            Object.keys(matrix[cat] || {}).forEach(subCat => {
                if (!acc.includes(subCat)) acc.push(subCat);
            });
            return acc;
        }, [] as string[]).sort(categorySort);

        const maxNodes = Math.max(judge1Cat.length, judge2Cat.length);

        // Calculate totals for each category to determine node heights
        const nodeTotals: Record<string, { in: number; out: number }> = {};
        [...judge1Cat, ...judge2Cat].forEach(cat => {
            nodeTotals[cat] = { in: 0, out: 0 };
        });

        let totalValue = 0;
        judge1Cat.forEach(fromCat => {
            judge2Cat.forEach(toCat => {
                const value = matrix[fromCat]?.[toCat] || 0;
                if (value > 0) {
                    nodeTotals[fromCat].out += value;
                    nodeTotals[toCat].in += value;
                    totalValue += value;
                }
            });
        });

        if (totalValue === 0) {
            return { nodes: [], links: [] }; // Handle empty data case
        }

        // Determine scaling factor to fit everything in the SVG height
        const AvailableHeight = height - PADDING.top - PADDING.bottom - (maxNodes - 1) * NODE_GAP;
        const scaleFactor = AvailableHeight / totalValue || 1;

        // Calculate node positions and dimensions
        const nodes: any[] = [];
        let currentY_from = PADDING.top;
        let currentY_to = PADDING.top;

        // Create maps to store calculated node info for easy lookup
        const fromNodesMap: Map<string, any> = new Map();
        const toNodesMap: Map<string, any> = new Map();

        judge1Cat.forEach(cat => {
            // From nodes (left column)
            const fromNodeHeight = nodeTotals[cat].out * scaleFactor;
            const fromNode = {
                id: `from-${cat}`,
                category: cat,
                x: PADDING.left,
                y: currentY_from,
                width: NODE_WIDTH,
                height: fromNodeHeight,
                color: `var(--${cat.toLowerCase()})`, //COLOR_MAP[cat]
                value: nodeTotals[cat].out,
                currentLinkY: currentY_from, // To stack outgoing links
            };
            if (fromNodeHeight > 0) {
                nodes.push(fromNode);
                fromNodesMap.set(cat, fromNode);
                currentY_from += fromNodeHeight + (NODE_GAP * ((maxNodes-1) / (judge1Cat.length - 1 || 1) || 1)); // Distribute gaps evenly
            }
        });

        judge2Cat.forEach(cat => {
            // To nodes (right column)
            const toNodeHeight = nodeTotals[cat].in * scaleFactor;
            const toNode = {
                id: `to-${cat}`,
                category: cat,
                x: width - PADDING.right - NODE_WIDTH,
                y: currentY_to,
                width: NODE_WIDTH,
                height: toNodeHeight,
                color: `var(--${cat.toLowerCase()})`, //COLOR_MAP[cat]
                value: nodeTotals[cat].in,
                currentLinkY: currentY_to, // To stack incoming links
            };
            if (toNodeHeight > 0) {
                nodes.push(toNode);
                toNodesMap.set(cat, toNode);
                currentY_to += toNodeHeight + (NODE_GAP * ((maxNodes-1) / (judge2Cat.length - 1 || 1) || 1));
            }
        });

        // 4. Calculate link paths
        const links: any[] = [];
        judge1Cat.forEach(fromCat => {
            judge2Cat.forEach(toCat => {
                const value = matrix[fromCat]?.[toCat] || 0;
                if (value > 0) {
                const fromNode = fromNodesMap.get(fromCat);
                const toNode = toNodesMap.get(toCat);
                const linkHeight = value * scaleFactor;

                if (!fromNode || !toNode || linkHeight < 0.1) return; // Skip if a node has no flow

                // Start and end points of the link
                const y0 = fromNode.currentLinkY + linkHeight / 2;
                let y1 = toNode.currentLinkY + linkHeight / 2;

                if (y0 === y1) {
                    y1 += 0.001; // this is meant to address the issue of self-links not rendering correctly
                }

                // Update the y-offsets on the nodes for the next link
                fromNode.currentLinkY += linkHeight;
                toNode.currentLinkY += linkHeight;

                // Define the SVG path for a smooth curve (Cubic Bezier)
                const x0 = fromNode.x + fromNode.width;
                const x1 = toNode.x;
                const controlPointX1 = x0 + (x1 - x0) / 2;
                const controlPointX2 = x1 - (x1 - x0) / 2;
                const pathData = `M ${x0} ${y0} C ${controlPointX1} ${y0}, ${controlPointX2} ${y1}, ${x1} ${y1}`;

                links.push({
                    id: `${fromCat}-${toCat}`,
                    from: fromCat,
                    to: toCat,
                    path: pathData,
                    strokeWidth: linkHeight,
                    value: value,
                });
                }
            });
        });

        return { nodes, links };
    }, [matrix, dimensions]);

    return (
        <div ref={containerRef} className="sankey-container">
            <div className="chart-title">Transition Flow Diagram</div>
            {dimensions.width > 0 && dimensions.height > 0 && (
                <div className="sankey-chart">
                    <div className="sankeydiagram-y-axis y-axis-label">
                        {judge1.split('/')[1] || judge1}
                    </div>
                    <svg width={dimensions.width} height={dimensions.height}>
                         <defs>
                            {sankeyData.links.map(link => {
                                const sourceColorVar = `var(--${link.from.toLowerCase()}, #ccc)`;
                                const targetColorVar = `var(--${link.to.toLowerCase()}, #ccc)`;

                                return (
                                    <linearGradient 
                                        key={`gradient-${link.id}`} 
                                        id={`gradient-${link.id}`}
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="0%"
                                    >
                                        <stop offset="0%" stopColor={sourceColorVar} />
                                        <stop offset="100%" stopColor={targetColorVar} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <g>
                            {sankeyData.links.map(link => {
                                const strokeValue = link.from === link.to 
                                    // If it's a self-link (e.g., COMPLETE -> COMPLETE), apply the color directly.
                                    ? `var(--${link.from.toLowerCase()}, #ccc)`
                                    // Otherwise, use the gradient URL.
                                    : `url(#gradient-${link.id})`;
                                    return (
                                        <path
                                            key={link.id}
                                            d={link.path}
                                            stroke={strokeValue}
                                            strokeWidth={link.strokeWidth}
                                            fill="none"
                                            className="sankey-link"
                                            onClick={() => link.value < 10000 
                                            ? onCellClick(link.from, link.to)
                                            : alert("Details only available for values < 10000. Please refine your selection.")
                                            }
                                        >
                                            <title>{`${link.from} → ${link.to}: ${link.value}`}</title>
                                        </path>
                                    )
                                }
                            )}
                        </g>

                        {/* Removing nodes for now (no real value add but keeping it commented-out for later)
                        <g>
                            {sankeyData.nodes.map(node => (
                            <g key={node.id}>
                                <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                fill={node.color}
                                className="sankey-node"
                                >
                                <title>{`${node.category}: ${node.value}`}</title>
                                </rect>
                                <text
                                x={node.x < dimensions.width / 2 ? node.x - 5 : node.x + node.width + 5}
                                y={node.y + node.height / 2}
                                textAnchor={node.x < dimensions.width / 2 ? 'end' : 'start'}
                                dominantBaseline="middle"
                                className="y-axis-label"
                                >
                                {node.category}
                                </text>
                            </g>
                            ))}
                        </g>
                        */}
                    </svg>
                    <div className="sankeydiagram-y-axis y-axis-label">
                        {judge2.split('/')[1] || judge2}
                    </div>
                </div>
              )}
        </div>
    );
};

export default SankeyDiagram;