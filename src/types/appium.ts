export interface ElementBox {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  children?: ElementBox[];
}

export interface AppiumSession {
  id: string;
  capabilities: {
    platformName?: string;
    deviceName?: string;
    appPackage?: string;
    bundleId?: string;
    [key: string]: any;
  };
}

export interface AppiumSettings {
  snapshotMaxDepth: number;
}

export interface SessionsResponse {
  value: AppiumSession[];
}

export interface PageSourceResponse {
  value: string;
} 