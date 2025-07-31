import type { AppiumSession, AppiumSettings, SessionsResponse, PageSourceResponse } from '../types/appium';

class AppiumService {
  private baseUrl: string;

  constructor() {
    // В Electron приложении используем прямой адрес, в dev режиме - прокси
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173';
    
    if (isElectron) {
      this.baseUrl = 'http://localhost:4723';
    } else if (isDev) {
      this.baseUrl = '/api/appium';
    } else {
      // Fallback для других случаев
      this.baseUrl = 'http://localhost:4723';
    }
    
    console.log('AppiumService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Получить список активных сессий
   */
  async getSessions(): Promise<AppiumSession[]> {
    const response = await fetch(`${this.baseUrl}/sessions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: SessionsResponse = await response.json();
    return data.value || [];
  }

  /**
   * Установить настройки для сессии
   */
  async setSessionSettings(sessionId: string, settings: Partial<AppiumSettings>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/appium/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Установить максимальную глубину снапшота
   */
  async setSnapshotMaxDepth(sessionId: string, depth: number): Promise<void> {
    await this.setSessionSettings(sessionId, { snapshotMaxDepth: depth, customSnapshotTimeout: 100, snapshotTimeout: 100 } as any);
  }

  /**
   * Получить XML источник страницы
   */
  async getPageSource(sessionId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/source`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: PageSourceResponse = await response.json();
    return data.value;
  }

  /**
   * Получить скриншот экрана в формате base64
   */
  async getScreenshot(sessionId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/screenshot`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.value; // base64 string
  }

  /**
   * Получить полный снапшот с настройкой глубины
   */
  async getPageSourceWithDepth(sessionId: string, maxDepth: number): Promise<string> {
    // Сначала устанавливаем глубину
    await this.setSnapshotMaxDepth(sessionId, maxDepth);
    
    // Затем получаем источник
    return await this.getPageSource(sessionId);
  }

  /**
   * Получить скриншот и XML источник одновременно
   */
  async getScreenshotAndPageSource(sessionId: string, maxDepth: number): Promise<{
    screenshot: string;
    pageSource: string;
  }> {
    // Сначала устанавливаем глубину
    await this.setSnapshotMaxDepth(sessionId, maxDepth);
    
    // Затем получаем скриншот и источник параллельно
    const [screenshot, pageSource] = await Promise.all([
      this.getScreenshot(sessionId),
      this.getPageSource(sessionId)
    ]);
    
    return { screenshot, pageSource };
  }

  /**
   * Получить размер окна
   */
  async getWindowSize(sessionId: string): Promise<{ width: number; height: number }> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/window/size`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value;
  }

  /**
   * Получить размер окна через W3C WebDriver
   */
  async getWindowRect(sessionId: string): Promise<{ width: number; height: number; x: number; y: number }> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/window/rect`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value;
  }

  /**
   * Получить информацию об экране устройства
   */
  async getDeviceScreenInfo(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/session/${sessionId}/appium/device/screen_info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Если метод не поддерживается, попробуем получить размер окна
        return await this.getWindowSize(sessionId);
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.warn('Screen info not available, falling back to window size');
      return await this.getWindowSize(sessionId);
    }
  }

  /**
   * Получить все параметры устройства для отладки
   */
  async getDeviceInfo(sessionId: string): Promise<{
    windowSize?: { width: number; height: number };
    windowRect?: { width: number; height: number; x: number; y: number };
    screenInfo?: any;
    session?: any;
  }> {
    try {
      console.log('=== TRYING TO GET DEVICE INFO ===');
      
      // Пробуем все возможные методы
      const windowSizePromise = this.getWindowSize(sessionId)
        .then(result => {
          console.log('Window size success:', result);
          return result;
        })
        .catch(error => {
          console.log('Window size failed:', error.message);
          return undefined;
        });

      const windowRectPromise = this.getWindowRect(sessionId)
        .then(result => {
          console.log('Window rect success:', result);
          return result;
        })
        .catch(error => {
          console.log('Window rect failed:', error.message);
          return undefined;
        });

      const screenInfoPromise = this.getDeviceScreenInfo(sessionId)
        .then(result => {
          console.log('Screen info success:', result);
          return result;
        })
        .catch(error => {
          console.log('Screen info failed:', error.message);
          return undefined;
        });

      const sessionPromise = this.getSession(sessionId)
        .then(result => {
          console.log('Session info success:', result);
          return result;
        })
        .catch(error => {
          console.log('Session info failed:', error.message);
          return undefined;
        });

      const [windowSize, windowRect, screenInfo, session] = await Promise.all([
        windowSizePromise,
        windowRectPromise,
        screenInfoPromise,
        sessionPromise
      ]);

      const deviceInfo = {
        windowSize,
        windowRect,
        screenInfo,
        session
      };

      console.log('=== FINAL DEVICE INFO ===', deviceInfo);
      return deviceInfo;

    } catch (error) {
      console.error('Error getting device info:', error);
      return {};
    }
  }

  /**
   * Выполнить клик по элементу (для будущего использования)
   */
  async clickElement(sessionId: string, elementId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/element/${elementId}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Получить информацию о сессии
   */
  async getSession(sessionId: string): Promise<AppiumSession> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      id: sessionId,
      capabilities: data.value || {}
    };
  }
}

// Экспортируем singleton экземпляр
export const appiumService = new AppiumService();
export default appiumService; 