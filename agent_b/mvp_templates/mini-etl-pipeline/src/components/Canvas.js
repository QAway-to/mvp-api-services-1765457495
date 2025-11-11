import { useState, useRef, useEffect } from 'react';
import Block from './Block';

export default function Canvas({ pipeline, onBlockClick, onBlockUpdate }) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const blocks = pipeline?.blocks || [];
  const connections = pipeline?.connections || [];

  const handleMouseDown = (e, blockId) => {
    if (e.button !== 0) return;
    setDragging(blockId);
    const rect = canvasRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left - (blocks.find(b => b.id === blockId)?.x || 0),
      y: e.clientY - rect.top - (blocks.find(b => b.id === blockId)?.y || 0)
    });
  };


  useEffect(() => {
    if (dragging) {
      const handleMove = (e) => {
        if (!dragging) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const newX = e.clientX - rect.left - offset.x;
        const newY = e.clientY - rect.top - offset.y;
        onBlockUpdate(dragging, { x: newX, y: newY });
      };
      const handleUp = () => {
        setDragging(null);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [dragging, offset, onBlockUpdate]);

  return (
    <div
      ref={canvasRef}
      style={canvasStyle}
    >
      {/* Grid background */}
      <svg style={gridStyle} width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Connections */}
      {connections.map((conn, idx) => {
        const fromBlock = blocks.find(b => b.id === conn.from);
        const toBlock = blocks.find(b => b.id === conn.to);
        if (!fromBlock || !toBlock) return null;
        const x1 = fromBlock.x + 100;
        const y1 = fromBlock.y + 50;
        const x2 = toBlock.x;
        const y2 = toBlock.y + 50;
        return (
          <svg key={idx} style={connectionSvgStyle}>
            <path
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke="rgba(56,189,248,0.5)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="rgba(56,189,248,0.5)" />
              </marker>
            </defs>
          </svg>
        );
      })}

      {/* Blocks */}
      {blocks.map(block => (
        <Block
          key={block.id}
          block={block}
          onClick={() => onBlockClick(block.id)}
          onMouseDown={(e) => handleMouseDown(e, block.id)}
          isDragging={dragging === block.id}
        />
      ))}
    </div>
  );
}

const canvasStyle = {
  flex: 1,
  position: 'relative',
  background: '#0b1120',
  overflow: 'auto',
  cursor: dragging ? 'grabbing' : 'default'
};

const gridStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none'
};

const connectionSvgStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 1
};

