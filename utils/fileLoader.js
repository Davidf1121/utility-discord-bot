import { readdirSync } from 'fs';

export function loadFiles(dir, extension) {
  try {
    const files = readdirSync(dir);
    return files.filter(file => file.endsWith(extension));
  } catch (error) {
    return [];
  }
}
