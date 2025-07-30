import { useState } from 'react';
import type { ElementBox } from '../types/appium';
import { getElementDisplayName } from '../utils/xmlParser';

interface ElementPropertiesProps {
  element: ElementBox | null;
  platform?: string;
}

export function ElementProperties({ element, platform = 'iOS' }: ElementPropertiesProps) {
  const [copiedSelector, setCopiedSelector] = useState<string>('');

  if (!element) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a3 3 0 00-3-3z" />
            </svg>
          </div>
          <div className="text-gray-500 italic text-lg mb-2">
            Выберите элемент
          </div>
          <div className="text-gray-400 text-sm">
            Кликните на элемент в дереве или на скриншоте
          </div>
        </div>
      </div>
    );
  }

  const generateSelectors = (element: ElementBox, platform: string) => {
    const selectors: Array<{ name: string; value: string; description: string }> = [];

    if (platform === 'iOS') {
      // iOS selectors
      if (element.name) {
        selectors.push({
          name: 'Accessibility ID',
          value: element.name,
          description: 'Recommended for iOS automation'
        });
      }
      
      if (element.type) {
        selectors.push({
          name: 'Class Name',
          value: element.type,
          description: 'Element type selector'
        });
      }

      // XPath selectors
      if (element.name) {
        selectors.push({
          name: 'XPath (name)',
          value: `//*[@name="${element.name}"]`,
          description: 'XPath by name attribute'
        });
      }

      if (element.type) {
        selectors.push({
          name: 'XPath (type)',
          value: `//${element.type}`,
          description: 'XPath by element type'
        });
      }

      if (element.name && element.type) {
        selectors.push({
          name: 'XPath (combined)',
          value: `//${element.type}[@name="${element.name}"]`,
          description: 'XPath by type and name'
        });
      }

      // Predicate selectors (iOS specific)
      if (element.name) {
        selectors.push({
          name: 'Predicate String',
          value: `name == "${element.name}"`,
          description: 'iOS predicate selector'
        });
      }

      if (element.type) {
        selectors.push({
          name: 'Class Chain',
          value: `**/XCUIElementType${element.type.replace('XCUIElementType', '')}`,
          description: 'iOS class chain selector'
        });
      }

    } else {
      // Android selectors
      if (element.name) {
        selectors.push({
          name: 'Accessibility ID',
          value: element.name,
          description: 'Content description selector'
        });
      }

      if (element.type) {
        selectors.push({
          name: 'Class Name',
          value: element.type,
          description: 'Android class name'
        });
      }

      // Resource ID (assuming it might be in name or other attributes)
      if (element.name && element.name.includes(':id/')) {
        selectors.push({
          name: 'ID',
          value: element.name.split(':id/')[1],
          description: 'Android resource ID'
        });
      }

      // XPath selectors
      if (element.name) {
        selectors.push({
          name: 'XPath (content-desc)',
          value: `//*[@content-desc="${element.name}"]`,
          description: 'XPath by content description'
        });
      }

      if (element.type) {
        selectors.push({
          name: 'XPath (class)',
          value: `//${element.type}`,
          description: 'XPath by class name'
        });
      }
    }

    // Universal selectors
    selectors.push({
      name: 'Coordinates',
      value: `x: ${element.x}, y: ${element.y}`,
      description: 'Element coordinates (not recommended)'
    });

    return selectors;
  };

  const copyToClipboard = async (text: string, selectorName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSelector(selectorName);
      setTimeout(() => setCopiedSelector(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const selectors = generateSelectors(element, platform);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow h-[874px] flex flex-col">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          Element Properties
        </h2>
      </div>
      
      <div id="element-properties-scroll" className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Element Info */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            Basic Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Element:</span>
              <span className="font-medium">{getElementDisplayName(element)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-mono text-blue-600">{element.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-mono text-green-600">{element.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Position:</span>
              <span className="font-mono">({element.x}, {element.y})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-mono">{element.width} × {element.height}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-mono">{(element.width * element.height).toLocaleString()}px²</span>
            </div>
          </div>
        </div>

        {/* Selectors */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            Selectors ({platform})
          </h3>
          <div className="space-y-3">
            {selectors.map((selector, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-800">{selector.name}</h4>
                  <button
                    onClick={() => copyToClipboard(selector.value, selector.name)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      copiedSelector === selector.name
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {copiedSelector === selector.name ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded border break-all">
                  {selector.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selector.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            Code Examples
          </h3>
          <div className="space-y-3">
            {/* Python example */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-800">Python (Appium)</h4>
                <button
                  onClick={() => {
                    const bestSelector = selectors.find(s => s.name === 'Accessibility ID') || selectors[0];
                    const code = `element = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "${bestSelector.value}")`;
                    copyToClipboard(code, 'Python');
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    copiedSelector === 'Python'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {copiedSelector === 'Python' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                {(() => {
                  const bestSelector = selectors.find(s => s.name === 'Accessibility ID') || selectors[0];
                  return `element = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "${bestSelector.value}")`;
                })()}
              </div>
            </div>

            {/* Java example */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-800">Java (Appium)</h4>
                <button
                  onClick={() => {
                    const bestSelector = selectors.find(s => s.name === 'Accessibility ID') || selectors[0];
                    const code = `WebElement element = driver.findElement(AppiumBy.accessibilityId("${bestSelector.value}"));`;
                    copyToClipboard(code, 'Java');
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    copiedSelector === 'Java'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {copiedSelector === 'Java' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                {(() => {
                  const bestSelector = selectors.find(s => s.name === 'Accessibility ID') || selectors[0];
                  return `WebElement element = driver.findElement(AppiumBy.accessibilityId("${bestSelector.value}"));`;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 