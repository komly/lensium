import { XMLParser } from 'fast-xml-parser';
import type { ElementBox } from '../types/appium';

/**
 * Извлечь элементы из XML узла
 */
export function extractBoxes(node: any): ElementBox | null {
  let x: number, y: number, width: number, height: number;
  
  // iOS attributes
  if (node['@_x'] !== undefined) {
    x = parseFloat(node['@_x']);
    y = parseFloat(node['@_y']);
    width = parseFloat(node['@_width']);
    height = parseFloat(node['@_height']);
  }
  // Android attributes (bounds format: [x,y][x+width,y+height])
  else if (node['@_bounds']) {
    const boundsMatch = node['@_bounds'].match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (boundsMatch) {
      x = parseInt(boundsMatch[1]);
      y = parseInt(boundsMatch[2]);
      width = parseInt(boundsMatch[3]) - x;
      height = parseInt(boundsMatch[4]) - y;
    } else {
      return null;
    }
  } else {
    return null;
  }

  const name = node['@_name'] || node['@_text'] || node['@_content-desc'] || node['@_resource-id'];
  const type = node['@_type'] || node['@_class'] || 'Unknown';

  const box: ElementBox = { name, x, y, width, height, type, children: [] };

  // Handle children - check for iOS, Android, or generic element types
  for (const key of Object.keys(node)) {
    if (key.startsWith('XCUIElementType') || key === 'node' || (!key.startsWith('@_') && typeof node[key] === 'object')) {
      const child = node[key];
      const childNodes = Array.isArray(child) ? child : [child];
      for (const c of childNodes) {
        if (typeof c === 'object' && c !== null) {
          const childBox = extractBoxes(c);
          if (childBox) {
            box.children!.push(childBox);
          }
        }
      }
    }
  }

  return isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) ? null : box;
}

/**
 * Парсить XML и извлечь дерево элементов
 */
export function parsePageSource(xmlSource: string): ElementBox | null {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xmlSource);
  
  // Try different root elements based on platform
  let root = parsed.AppiumAUT?.XCUIElementTypeApplication || // iOS
             parsed.hierarchy?.node || // Android
             parsed.XCUIElementTypeApplication || // iOS alternative
             null;
             
  if (!root) {
    // Try to find any root element
    const keys = Object.keys(parsed);
    if (keys.length > 0) {
      root = parsed[keys[0]];
    }
  }
  
  const rootNode = Array.isArray(root) ? root[0] : root;
  return extractBoxes(rootNode);
}

/**
 * Рекурсивно сплющить дерево элементов в плоский массив
 */
export function flatten(box?: ElementBox): ElementBox[] {
  if (!box) return [];
  const children = box.children?.flatMap(flatten) || [];
  return [box, ...children];
}

/**
 * Получить иконку на основе типа элемента
 */
export function getElementIcon(elementType: string): string {
  const iconMap: Record<string, string> = {
    // iOS elements
    'XCUIElementTypeApplication': 'App',
    'XCUIElementTypeWindow': 'Win',
    'XCUIElementTypeNavigationBar': 'Nav',
    'XCUIElementTypeButton': 'Btn',
    'XCUIElementTypeStaticText': 'Text',
    'XCUIElementTypeTextField': 'Input',
    'XCUIElementTypeSecureTextField': 'SecInput',
    'XCUIElementTypeTextView': 'TextView',
    'XCUIElementTypeImage': 'Img',
    'XCUIElementTypeScrollView': 'Scroll',
    'XCUIElementTypeTable': 'Table',
    'XCUIElementTypeCell': 'Cell',
    'XCUIElementTypeCollectionView': 'Grid',
    'XCUIElementTypeTabBar': 'Tabs',
    'XCUIElementTypeTabBarItem': 'Tab',
    'XCUIElementTypeSearchField': 'Search',
    'XCUIElementTypeSwitch': 'Switch',
    'XCUIElementTypeSlider': 'Slider',
    'XCUIElementTypePageIndicator': 'Page',
    'XCUIElementTypePicker': 'Picker',
    'XCUIElementTypePickerWheel': 'Wheel',
    'XCUIElementTypeAlert': 'Alert',
    'XCUIElementTypeActionSheet': 'Sheet',
    'XCUIElementTypeMap': 'Map',
    'XCUIElementTypeWebView': 'Web',
    'XCUIElementTypeLink': 'Link',
    'XCUIElementTypeToolbar': 'Toolbar',
    'XCUIElementTypePopover': 'Popup',
    'XCUIElementTypeProgressIndicator': 'Progress',
    'XCUIElementTypeActivityIndicator': 'Loading',
    'XCUIElementTypeSegmentedControl': 'Segment',
    'XCUIElementTypeStepperButton': 'Step',
    'XCUIElementTypeOther': 'Other',
    
    // Android elements
    'android.widget.LinearLayout': 'Linear',
    'android.widget.RelativeLayout': 'Relative',
    'android.widget.FrameLayout': 'Frame',
    'android.widget.ScrollView': 'Scroll',
    'android.widget.ListView': 'List',
    'android.widget.GridView': 'Grid',
    'android.widget.TextView': 'Text',
    'android.widget.EditText': 'Input',
    'android.widget.Button': 'Btn',
    'android.widget.ImageView': 'Img',
    'android.widget.ImageButton': 'ImgBtn',
    'android.widget.CheckBox': 'Check',
    'android.widget.RadioButton': 'Radio',
    'android.widget.Switch': 'Switch',
    'android.widget.SeekBar': 'Seek',
    'android.widget.ProgressBar': 'Progress',
    'android.widget.Spinner': 'Spinner',
    'android.widget.WebView': 'Web',
    'android.widget.TabHost': 'Tabs',
    'android.widget.ViewPager': 'Pager',
    'android.view.View': 'View',
    'android.view.ViewGroup': 'Group',
  };
  
  return iconMap[elementType] || 'Elem';
}

/**
 * Получить цвет элемента на основе типа
 */
export function getElementColor(type: string): string {
  if (type.includes('Button')) return 'text-blue-600';
  if (type.includes('Text')) return 'text-green-600';
  if (type.includes('Image')) return 'text-purple-600';
  if (type.includes('Table') || type.includes('List') || type.includes('Collection')) return 'text-orange-600';
  if (type.includes('ScrollView') || type.includes('Scroll')) return 'text-indigo-600';
  if (type.includes('Navigation') || type.includes('TabBar') || type.includes('Toolbar')) return 'text-red-600';
  if (type.includes('Application') || type.includes('Window')) return 'text-gray-800';
  return 'text-gray-600';
}

/**
 * Получить читаемое имя элемента
 */
export function getElementDisplayName(box: ElementBox): string {
  const type = box.type || 'Unknown';
  const name = box.name;
  
  // Simplify long type names
  const simplifiedType = type
    .replace('XCUIElementType', '')
    .replace('android.widget.', '')
    .replace('android.view.', '');
  
  if (name && name.trim() && name !== type) {
    return `${simplifiedType} "${name}"`;
  }
  
  return simplifiedType;
} 