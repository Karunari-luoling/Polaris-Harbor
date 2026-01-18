import { load } from 'js-yaml';
import { AppConfig, DataSourceConfig } from '../types';

export const fetchConfig = async (): Promise<AppConfig> => {
  // 直接加载根目录的 config.yml，并以 YAML 解析为应用配置
  const response = await fetch('/config.yml');
  if (!response.ok) {
    throw new Error('config.yml not found or unreachable');
  }

  const text = await response.text();
  const config = load(text) as AppConfig | undefined;

  if (!config) {
    throw new Error('config.yml is empty or invalid');
  }

  return config;
};

export const fetchExternalData = async <T>(config: DataSourceConfig): Promise<T[]> => {
  if (!config || !config.path) return [];

  try {
    // 本地数据源走相对路径，远程数据源则使用完整 URL
    const url = config.type === 'local' ? `/${config.path}` : config.path;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch data from ${url}`);
      return [];
    }

    // 支持 yml/json 两种格式，保证列表数据可配置
    if (config.format === 'yml') {
      const text = await response.text();
      return (load(text) as T[]) || [];
    } else {
      return (await response.json() as T[]) || [];
    }
  } catch (error) {
    console.error(`Error loading external data (${config.path}):`, error);
    return [];
  }
};
