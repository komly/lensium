import { useCallback, useState } from 'react';
import { appiumService } from '../services/appiumService';
import type { AppiumSession, ElementBox } from '../types/appium';
import { parsePageSource } from '../utils/xmlParser';

export function useAppium() {
  const [sessions, setSessions] = useState<AppiumSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [rootBox, setRootBox] = useState<ElementBox | null>(null);
  const [screenshot, setScreenshot] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const sessionsData = await appiumService.getSessions();
      setSessions(sessionsData || []);

    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Не удалось получить список сессий. Проверьте что Appium сервер запущен на localhost:4723');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectToSession = useCallback(async (sessionId: string, maxDepth: number = 20, optimize: boolean = true) => {
    try {
      setIsLoading(true);
      setError('');

      // Получаем информацию об устройстве для отладки
      console.log('Getting device info...');
      const deviceInfoData = await appiumService.getDeviceInfo(sessionId);
      setDeviceInfo(deviceInfoData);
      console.log('Device info:', deviceInfoData);

      // Получаем скриншот и XML источник одновременно
      const { screenshot: screenshotData, pageSource: xmlSource } = optimize
        ? await appiumService.getScreenshotAndPageSource(sessionId, maxDepth)
        : await appiumService.getScreenshotAndPageSourceUnoptimized(sessionId, maxDepth);

      const tree = parsePageSource(xmlSource);

      setRootBox(tree);
      setScreenshot(screenshotData);
      setSelectedSession(sessionId);

    } catch (err) {
      console.error('Error connecting to session:', err);
      setError('Не удалось подключиться к сессии. Проверьте, что сессия активна');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPageSource = useCallback(async (maxDepth: number = 20, optimize: boolean = true) => {
    if (!selectedSession) return;

    try {
      setIsLoading(true);
      setError('');

      // Получаем обновленную информацию об устройстве
      const deviceInfoData = await appiumService.getDeviceInfo(selectedSession);
      setDeviceInfo(deviceInfoData);


      // Получаем скриншот и XML источник одновременно
      const { screenshot: screenshotData, pageSource: xmlSource } = optimize
        ? await appiumService.getScreenshotAndPageSource(selectedSession, maxDepth)
        : await appiumService.getScreenshotAndPageSourceUnoptimized(selectedSession, maxDepth);

      const tree = parsePageSource(xmlSource);

      setRootBox(tree);
      setScreenshot(screenshotData);

    } catch (err) {
      console.error('Error refreshing page source:', err);
      setError('Не удалось обновить дерево элементов');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSession]);

  const refreshScreenshot = useCallback(async () => {
    if (!selectedSession) return;

    try {
      setIsLoading(true);
      setError('');

      const screenshotData = await appiumService.getScreenshot(selectedSession);
      setScreenshot(screenshotData);

    } catch (err) {
      console.error('Error refreshing screenshot:', err);
      setError('Не удалось обновить скриншот');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSession]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
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
    clearError
  };
} 