import { Client } from 'discord.js';

export abstract class Feature {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly enabled: boolean;

  abstract initialize(client: Client): Promise<void> | void;
  
  shutdown?(): Promise<void> | void;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected logError(message: string, error: unknown): void {
    console.error(`[${this.name}] ${message}`, error);
  }
}

export default Feature;
