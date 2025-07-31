// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useAppium } from './hooks/useAppium';
import { TreeNode } from './components/TreeNode';
import { ElementProperties } from './components/ElementProperties';
import { flatten, getElementDisplayName } from './utils/xmlParser';
import type { ElementBox } from './types/appium';
import './App.css';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maxDepth, setMaxDepth] = useState<number>(20);
  const [highlightedElement, setHighlightedElement] = useState<ElementBox | null>(null);
  const [screenshotImage, setScreenshotImage] = useState<HTMLImageElement | null>(null);
  
  const {
    sessions,
    selectedSession,
    rootBox,
    screenshot,
    deviceInfo,
    isLoading,
    error,
    setSelectedSession,
    fetchSessions,
    connectToSession,
    refreshPageSource,
    refreshScreenshot,
  } = useAppium();

  const handleConnectToSession = () => {
    if (selectedSession) {
      connectToSession(selectedSession, maxDepth);
    }
  };

  const handleRefreshPageSource = () => {
    refreshPageSource(maxDepth);
  };

  const handleRefreshScreenshot = () => {
    refreshScreenshot();
  };

  // Load sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load screenshot image when screenshot data changes and adjust canvas size
  useEffect(() => {
    if (screenshot) {
      const img = new Image();
      img.onload = () => {
        setScreenshotImage(img);
        
        // Adjust canvas size to match screenshot dimensions
        const canvas = canvasRef.current;
        if (canvas) {
          // Keep aspect ratio but limit max size
          const maxWidth = 500;
          const maxHeight = 900;
          
          let canvasWidth = img.width;
          let canvasHeight = img.height;
          
          // Scale down if image is too large
          if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
            const scaleX = maxWidth / canvasWidth;
            const scaleY = maxHeight / canvasHeight;
            const scale = Math.min(scaleX, scaleY);
            
            canvasWidth = Math.round(canvasWidth * scale);
            canvasHeight = Math.round(canvasHeight * scale);
          }
          
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          canvas.style.width = `${canvasWidth}px`;
          canvas.style.height = `${canvasHeight}px`;
          
          // Update debug info
          // setDebugInfo(prev => ({
          //   ...prev,
          //   screenshotSize: { width: img.width, height: img.height },
          //   canvasSize: { width: canvasWidth, height: canvasHeight },
          //   scaleFactors: { 
          //     scaleX: canvasWidth / img.width, 
          //     scaleY: canvasHeight / img.height 
          //   }
          // }));
        }
      };
      img.onerror = () => {
        console.error('Failed to load screenshot image');
        setScreenshotImage(null);
        // setDebugInfo({});
      };
      img.src = `data:image/png;base64,${screenshot}`;
    } else {
      setScreenshotImage(null);
      // Reset canvas to default size
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 402;
        canvas.height = 874;
        canvas.style.width = '402px';
        canvas.style.height = '874px';
      }
      // setDebugInfo({});
    }
  }, [screenshot]);

  // Update element count in debug info
  useEffect(() => {
    if (rootBox) {
      // const elementCount = flatten(rootBox).length;
      // setDebugInfo(prev => ({
      //   ...prev,
      //   elementCount
      // }));
    }
  }, [rootBox]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw screenshot if available
    if (screenshotImage) {
      // Draw screenshot to fill the entire canvas
      ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
      
      // Draw element overlays if we have element tree
      if (rootBox) {
        const allBoxes = flatten(rootBox);
        
        // Try to get device size from multiple sources
        let deviceWidth = canvas.width;
        let deviceHeight = canvas.height;
        let sizeSource = 'canvas fallback';
        
        if (deviceInfo?.windowSize?.width) {
          deviceWidth = deviceInfo.windowSize.width;
          deviceHeight = deviceInfo.windowSize.height;
          sizeSource = 'windowSize API';
        } else if (deviceInfo?.windowRect?.width) {
          deviceWidth = deviceInfo.windowRect.width;
          deviceHeight = deviceInfo.windowRect.height;
          sizeSource = 'windowRect API';
        } else if (deviceInfo?.session?.capabilities) {
          // Try to extract from capabilities or use known device sizes
          const caps = deviceInfo.session.capabilities;
          if (caps.deviceName?.includes('iPhone 16 Pro')) {
            deviceWidth = 402;
            deviceHeight = 874;
            sizeSource = 'iPhone 16 Pro known size';
          } else if (caps.deviceName?.includes('iPhone 15 Pro')) {
            deviceWidth = 393;
            deviceHeight = 852;
            sizeSource = 'iPhone 15 Pro known size';
          } else if (caps.deviceName?.includes('iPhone 14 Pro')) {
            deviceWidth = 393;
            deviceHeight = 852;
            sizeSource = 'iPhone 14 Pro known size';
          } else if (caps.platformName === 'iOS') {
            // Generic iPhone size fallback
            deviceWidth = 375;
            deviceHeight = 812;
            sizeSource = 'iOS generic size';
          }
        }
        
        // Calculate device pixel ratio using detected device size
        const devicePixelRatio = screenshotImage.width / deviceWidth;
        
        // Scale factors based on canvas vs device logical screen size
        const scaleX = canvas.width / deviceWidth;
        const scaleY = canvas.height / deviceHeight;
        
        // Debug: log first few elements
        console.log('=== DEBUG INFO ===');
        console.log('Screenshot size (physical):', screenshotImage.width, 'x', screenshotImage.height);
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        console.log('Device size source:', sizeSource);
        console.log('Device window size (logical):', deviceWidth, 'x', deviceHeight);
        console.log('Device pixel ratio (calculated):', devicePixelRatio.toFixed(2));
        console.log('Scale factors (canvas/device):', { 
          scaleX: scaleX.toFixed(3), 
          scaleY: scaleY.toFixed(3) 
        });
        console.log('Total elements:', allBoxes.length);
        console.log('Device info object:', deviceInfo);
        
        // Show first 3 elements for debugging
        allBoxes.slice(0, 3).forEach((box, i) => {
          console.log(`Element ${i}:`, {
            original: { x: box.x, y: box.y, width: box.width, height: box.height },
            scaled: { 
              x: (box.x * scaleX).toFixed(1), 
              y: (box.y * scaleY).toFixed(1), 
              width: (box.width * scaleX).toFixed(1), 
              height: (box.height * scaleY).toFixed(1)
            },
            name: box.name,
            type: box.type
          });
        });
        
        for (const box of allBoxes) {
          if (box.width > 0 && box.height > 0) {
            // Scale element coordinates using device logical screen dimensions
            const elementX = box.x * scaleX;
            const elementY = box.y * scaleY;
            const elementWidth = box.width * scaleX;
            const elementHeight = box.height * scaleY;
            
            // Skip very small elements
            if (elementWidth < 2 || elementHeight < 2) continue;
            
            // Highlight selected element
            if (highlightedElement && box === highlightedElement) {
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.setLineDash([3, 3]);
              
              // Add semi-transparent overlay for highlighted element
              ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
              ctx.fillRect(elementX, elementY, elementWidth, elementHeight);
            } else {
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
              ctx.lineWidth = 1;
              ctx.setLineDash([]);
            }
            
            ctx.strokeRect(elementX, elementY, elementWidth, elementHeight);
            
            // Draw element name if space allows and element is highlighted
            if (highlightedElement === box && box.name && elementWidth > 40 && elementHeight > 20) {
              ctx.fillStyle = '#ef4444';
              ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              const text = box.name.length > 25 ? box.name.substring(0, 25) + '...' : box.name;
              
              // Add background for text
              const textMetrics = ctx.measureText(text);
              const textWidth = textMetrics.width + 6;
              const textHeight = 16;
              
              // Position text above element if there's space, otherwise inside
              let textX = elementX + 2;
              let textY = elementY > textHeight ? elementY - 2 : elementY + 14;
              
              // Ensure text doesn't go outside canvas
              if (textX + textWidth > canvas.width) {
                textX = canvas.width - textWidth - 2;
              }
              if (textY < 14) {
                textY = elementY + 14;
              }
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.fillRect(textX - 1, textY - 12, textWidth, textHeight);
              
              // Add border to text background
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 1;
              ctx.setLineDash([]);
              ctx.strokeRect(textX - 1, textY - 12, textWidth, textHeight);
              
              ctx.fillStyle = '#ef4444';
              ctx.fillText(text, textX + 2, textY - 2);
            }
          }
        }
        
        // Reset line dash
        ctx.setLineDash([]);
      }
    } else if (rootBox) {
      // Fallback: draw elements without screenshot
      const allBoxes = flatten(rootBox);
      
    for (const box of allBoxes) {
        if (box.width > 0 && box.height > 0) {
          // Highlight selected element
          if (highlightedElement && box === highlightedElement) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
          } else {
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
          }
          
      ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          // Draw element name if space allows
          if (box.name && box.width > 30 && box.height > 20) {
            ctx.fillStyle = highlightedElement === box ? '#ef4444' : '#6b7280';
            ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const text = box.name.length > 20 ? box.name.substring(0, 20) + '...' : box.name;
            ctx.fillText(text, box.x + 2, box.y + 12);
          }
        }
      }
    }
  }, [rootBox, highlightedElement, screenshotImage, deviceInfo]);

  const handleElementClick = (element: ElementBox) => {
    setHighlightedElement(element);
    console.log('Selected element:', element);
    
    // Scroll properties panel to top when new element is selected
    setTimeout(() => {
      const propertiesPanel = document.getElementById('element-properties-scroll');
      if (propertiesPanel) {
        propertiesPanel.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Handle canvas click to select element
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rootBox || !screenshotImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Get device size using same logic as in drawing
    let deviceWidth = canvas.width;
    let deviceHeight = canvas.height;
    
    if (deviceInfo?.windowSize?.width) {
      deviceWidth = deviceInfo.windowSize.width;
      deviceHeight = deviceInfo.windowSize.height;
    } else if (deviceInfo?.windowRect?.width) {
      deviceWidth = deviceInfo.windowRect.width;
      deviceHeight = deviceInfo.windowRect.height;
    } else if (deviceInfo?.session?.capabilities?.deviceName?.includes('iPhone 16 Pro')) {
      deviceWidth = 402;
      deviceHeight = 874;
    }
    
    // Convert canvas coordinates back to device coordinates
    const scaleX = canvas.width / deviceWidth;
    const scaleY = canvas.height / deviceHeight;
    
    const deviceX = x / scaleX;
    const deviceY = y / scaleY;
    
    console.log('Click coordinates:', {
      canvas: { x, y },
      device: { x: deviceX.toFixed(1), y: deviceY.toFixed(1) },
      scale: { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) }
    });
    
    // Find all elements that contain the click point
    const allBoxes = flatten(rootBox);
    const clickedElements = allBoxes.filter(box => 
      deviceX >= box.x && 
      deviceX <= box.x + box.width &&
      deviceY >= box.y && 
      deviceY <= box.y + box.height &&
      box.width > 0 && 
      box.height > 0
    );
    
    if (clickedElements.length > 0) {
      // Select the deepest (most specific) element - usually the last one
      const deepestElement = clickedElements[clickedElements.length - 1];
      setHighlightedElement(deepestElement);
      
      console.log('Found elements at click:', clickedElements.length);
      console.log('Selected deepest element:', deepestElement);
      
      // Scroll to element in tree (we'll implement this next)
      scrollToElementInTree();
    } else {
      console.log('No elements found at click position');
    }
  };

  // Function to scroll to element in tree
  const scrollToElementInTree = () => {
    // Find the DOM element in the tree by its coordinates (simple approach)
    // We'll use a timeout to let React re-render the highlighted element first
    setTimeout(() => {
      const treeContainer = document.querySelector('.element-tree');
      const highlightedNode = document.querySelector('.bg-red-100');
      
      if (treeContainer && highlightedNode) {
        highlightedNode.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-full mx-auto space-y-4 px-4">
        {/* Session Selection Panel */}
        <div className="session-panel rounded-lg p-4 text-white shadow-lg">
          <h2 className="text-lg font-semibold mb-3">
            Подключение к Appium сессии
          </h2>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium mb-2 opacity-90">
                Активные сессии:
              </label>
              <select 
                value={selectedSession} 
                onChange={(e) => setSelectedSession(e.target.value)}
                className="session-select w-full px-3 py-2 border-2 border-white/20 rounded-lg bg-white/10 text-white text-sm transition-all duration-200 focus:outline-none focus:border-white/50"
                disabled={isLoading}
              >
                <option value="">Выберите сессию</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.id.substring(0, 8)}... - {session.capabilities.platformName || 'Unknown'} 
                    {session.capabilities.deviceName && ` (${session.capabilities.deviceName})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-2 opacity-90">
                Глубина дерева:
              </label>
              <input
                type="number"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value) || 20)}
                min="1"
                max="50"
                className="depth-input w-20 px-3 py-2 border-2 border-white/20 rounded-lg bg-white/10 text-white text-sm transition-all duration-200 focus:outline-none focus:border-white/50"
              />
            </div>
            
            <button
              onClick={fetchSessions}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Загрузка...' : 'Обновить список'}
            </button>
            
            <button
              onClick={handleConnectToSession}
              disabled={!selectedSession || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Подключение...' : 'Подключиться'}
            </button>
            
            {selectedSession && (
              <>
                <button
                  onClick={handleRefreshPageSource}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Обновление...' : 'Обновить экран'}
                </button>
                
                <button
                  onClick={handleRefreshScreenshot}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Обновление...' : 'Скриншот'}
                </button>
              </>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 text-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {sessions.length === 0 && !isLoading && !error && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 text-yellow-100 rounded-lg text-sm">
              Нет активных сессий. Запустите тест или приложение через Appium.
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col xl:flex-row gap-4 items-start">
          {/* Canvas Panel */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
              Appium Inspector
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {screenshotImage && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {screenshotImage.width}×{screenshotImage.height}
                </span>
              )}
            </h1>
            <div className="relative">
              <canvas 
                ref={canvasRef} 
                width={402} 
                height={874} 
                className="border border-gray-300 rounded-lg shadow bg-gray-50 cursor-pointer" 
                style={{ width: '402px', height: '874px' }}
                onClick={handleCanvasClick}
              />
              {screenshotImage && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded text-center">
                  Кликните по элементу на экране, чтобы выделить его в дереве
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center">
                  <div className="bg-white/90 px-4 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium text-gray-700">Загрузка...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Element Tree Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-lg shadow max-h-[874px] overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  Element Tree
                  {rootBox && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {flatten(rootBox).length} элементов
                    </span>
                  )}
                  {highlightedElement && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Выделен: {getElementDisplayName(highlightedElement)}
                    </span>
                  )}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 element-tree">
                {rootBox ? (
                  <TreeNode 
                    node={rootBox} 
                    onElementClick={handleElementClick}
                    highlightedElement={highlightedElement}
                  />
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="text-6xl mb-4">
                      <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="text-gray-500 italic text-lg mb-2">
                      {selectedSession ? 'Подключитесь к сессии для просмотра дерева элементов' : 'Выберите и подключитесь к сессии'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Элементы интерфейса будут отображены здесь
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Element Properties Panel */}
          <div className="flex-1 min-w-0 max-w-md">
            <ElementProperties 
              element={highlightedElement}
              platform={deviceInfo?.session?.capabilities?.platformName || 'iOS'}
            />
          </div>
      </div>
      </div>
    </div>
  );
}
