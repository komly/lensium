import React, { useState, useEffect } from 'react';
import type { ElementBox } from '../types/appium';
import { getElementIcon, getElementColor, getElementDisplayName } from '../utils/xmlParser';

interface TreeNodeProps {
  node: ElementBox;
  depth?: number;
  onElementClick?: (element: ElementBox) => void;
  highlightedElement?: ElementBox | null;
}

export function TreeNode({ node, depth = 0, onElementClick, highlightedElement }: TreeNodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 2); // Auto-collapse deep nodes
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = highlightedElement === node;
  
  // Check if this node or any of its children contain the highlighted element
  const containsHighlightedElement = (element: ElementBox, target: ElementBox | null): boolean => {
    if (!target) return false;
    if (element === target) return true;
    if (element.children) {
      return element.children.some(child => containsHighlightedElement(child, target));
    }
    return false;
  };

  const shouldExpand = containsHighlightedElement(node, highlightedElement || null);

  // Auto-expand if this node contains the highlighted element
  useEffect(() => {
    if (shouldExpand && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [shouldExpand, isCollapsed]);
  
  const handleClick = () => {
    if (onElementClick) {
      onElementClick(node);
    }
  };
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${
          depth === 0 ? 'bg-blue-50 border-l-4 border-blue-400' : ''
        } ${
          isHighlighted 
            ? 'bg-red-100 border-l-4 border-red-400 shadow-md' 
            : shouldExpand && !isHighlighted 
              ? 'bg-yellow-50 border-l-2 border-yellow-300' 
              : ''
        }`}
        onClick={handleClick}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        
        <span className="text-sm text-gray-500">{getElementIcon(node.type || '')}</span>
        
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${getElementColor(node.type || '')} ${
            isHighlighted ? 'text-red-700 font-bold' : ''
          }`}>
            {getElementDisplayName(node)}
            {isHighlighted && <span className="ml-2 text-red-500">← Выбран</span>}
          </div>
          <div className="text-xs text-gray-500 truncate">
            ({node.x}, {node.y}) {node.width} × {node.height}
            {node.width * node.height > 0 && (
              <span className="ml-2 px-1 bg-gray-100 rounded text-gray-600">
                {(node.width * node.height).toLocaleString()}px²
              </span>
            )}
          </div>
        </div>
        
        {hasChildren && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            shouldExpand 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {node.children!.length}
          </span>
        )}
      </div>
      
      {hasChildren && !isCollapsed && (
        <div className="border-l border-gray-200 ml-2">
          {node.children!.map((child, i) => (
            <TreeNode 
              key={i} 
              node={child} 
              depth={depth + 1}
              onElementClick={onElementClick}
              highlightedElement={highlightedElement}
            />
          ))}
        </div>
      )}
    </div>
  );
} 