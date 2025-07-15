"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  RotateCcw, 
  Search,
  Filter,
  Settings
} from 'lucide-react';

// Types for concept mapping
interface ConceptNode {
  id: string;
  name: string;
  category: 'grammar' | 'vocabulary';
  difficulty: string;
  x: number;
  y: number;
  tags: string[];
  isActive: boolean;
}

interface ConceptEdge {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationshipType: 'prerequisite' | 'related' | 'similar' | 'opposite' | 'parent-child' | 'example-of' | 'progression';
  strength: number;
  bidirectional: boolean;
}

interface ConceptMapData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

interface ConceptMapViewerProps {
  data: ConceptMapData;
  onNodeClick?: (node: ConceptNode) => void;
  onEdgeClick?: (edge: ConceptEdge) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number) => void;
  width?: number;
  height?: number;
}

export const ConceptMapViewer: React.FC<ConceptMapViewerProps> = ({
  data,
  onNodeClick,
  onEdgeClick,
  onNodeDrag,
  width = 800,
  height = 600
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter nodes based on search term
  const filteredNodes = data.nodes.filter(node =>
    node.name.toLowerCase().includes(filter.toLowerCase()) ||
    node.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  // Filter edges to only show connections between visible nodes
  const filteredEdges = data.edges.filter(edge =>
    filteredNodes.some(node => node.id === edge.fromConceptId) &&
    filteredNodes.some(node => node.id === edge.toConceptId)
  );

  // Color mapping for different concept categories and relationship types
  const getNodeColor = (category: string, isSelected: boolean) => {
    const colors = {
      grammar: isSelected ? '#3b82f6' : '#60a5fa',
      vocabulary: isSelected ? '#f59e0b' : '#fbbf24',
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getEdgeColor = (relationshipType: string) => {
    const colors = {
      prerequisite: '#ef4444',
      related: '#8b5cf6',
      similar: '#10b981',
      opposite: '#f97316',
      'parent-child': '#3b82f6',
      'example-of': '#06b6d4',
      progression: '#84cc16',
    };
    return colors[relationshipType as keyof typeof colors] || '#6b7280';
  };

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    setDraggedNode(nodeId);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !draggedNode || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    onNodeDrag?.(draggedNode, x, y);
  }, [isDragging, draggedNode, zoom, pan, onNodeDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  // Zoom and pan functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export map as SVG
  const handleExport = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'concept-map.svg';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Add event listeners for mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging && draggedNode && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left - pan.x) / zoom;
        const y = (event.clientY - rect.top - pan.y) / zoom;
        onNodeDrag?.(draggedNode, x, y);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggedNode, zoom, pan, onNodeDrag]);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search concepts..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full cursor-move"
          viewBox={`${-pan.x} ${-pan.y} ${width / zoom} ${height / zoom}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Background Grid */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {filteredEdges.map((edge) => {
            const fromNode = filteredNodes.find(n => n.id === edge.fromConceptId);
            const toNode = filteredNodes.find(n => n.id === edge.toConceptId);
            
            if (!fromNode || !toNode) return null;

            const strokeWidth = Math.max(1, edge.strength * 3);
            const color = getEdgeColor(edge.relationshipType);

            return (
              <g key={edge.id}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={0.7}
                  className="cursor-pointer hover:opacity-100"
                  onClick={() => onEdgeClick?.(edge)}
                />
                
                {/* Arrowhead for directed relationships */}
                {!edge.bidirectional && (
                  <marker
                    id={`arrow-${edge.id}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="3"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="m0,0 l0,6 l9,3 l0,-6 z" fill={color} />
                  </marker>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={getNodeColor(node.category, selectedNode === node.id)}
                stroke="#374151"
                strokeWidth="2"
                className="cursor-pointer hover:stroke-4"
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => {
                  setSelectedNode(node.id);
                  onNodeClick?.(node);
                }}
              />
              
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy="0.35em"
                className="text-xs font-medium fill-white pointer-events-none"
              >
                {node.name.length > 8 ? `${node.name.slice(0, 8)}...` : node.name}
              </text>
              
              {/* Difficulty badge */}
              <circle
                cx={node.x + 15}
                cy={node.y - 15}
                r="8"
                fill="#1f2937"
                className="pointer-events-none"
              />
              <text
                x={node.x + 15}
                y={node.y - 15}
                textAnchor="middle"
                dy="0.35em"
                className="text-xs font-bold fill-white pointer-events-none"
              >
                {node.difficulty}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <Card className="absolute top-4 right-4 w-48">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span className="text-xs">Grammar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span className="text-xs">Vocabulary</span>
            </div>
            <div className="border-t pt-2">
              <div className="text-xs font-medium mb-1">Relationships:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-500"></div>
                  <span className="text-xs">Prerequisite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-purple-500"></div>
                  <span className="text-xs">Related</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-xs">Similar</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Node Info */}
        {selectedNode && (
          <Card className="absolute bottom-4 left-4 w-64">
            <CardContent className="p-4">
              {(() => {
                const node = filteredNodes.find(n => n.id === selectedNode);
                if (!node) return null;
                
                return (
                  <div className="space-y-2">
                    <h3 className="font-medium">{node.name}</h3>
                    <div className="flex gap-2">
                      <Badge variant={node.category === 'grammar' ? 'default' : 'secondary'}>
                        {node.category}
                      </Badge>
                      <Badge variant="outline">{node.difficulty}</Badge>
                    </div>
                    {node.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {node.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};