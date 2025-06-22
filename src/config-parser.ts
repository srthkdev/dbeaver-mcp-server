import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { DBeaverConnection, DBeaverConfig } from './types.js';

const parseXML = promisify(parseString);

export class DBeaverConfigParser {
  private config: DBeaverConfig;

  constructor(config: DBeaverConfig = {}) {
    this.config = {
      workspacePath: config.workspacePath || this.getDefaultWorkspacePath(),
      debug: config.debug || false,
      ...config
    };
  }

  private getDefaultWorkspacePath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'win32':
        return path.join(homeDir, 'AppData', 'Roaming', 'DBeaverData', 'workspace6');
      case 'darwin':
        return path.join(homeDir, 'Library', 'DBeaverData', 'workspace6');
      default: // Linux and others
        return path.join(homeDir, '.local', 'share', 'DBeaverData', 'workspace6');
    }
  }

  private getConnectionsFilePath(): string {
    return path.join(
      this.config.workspacePath!,
      '.metadata',
      '.plugins',
      'org.jkiss.dbeaver.core',
      'connections.xml'
    );
  }

  private getCredentialsFilePath(): string {
    return path.join(
      this.config.workspacePath!,
      '.metadata',
      '.plugins',
      'org.jkiss.dbeaver.core',
      'credentials-config.json'
    );
  }

  async parseConnections(): Promise<DBeaverConnection[]> {
    const connectionsFile = this.getConnectionsFilePath();
    
    if (!fs.existsSync(connectionsFile)) {
      throw new Error(`DBeaver connections file not found at: ${connectionsFile}`);
    }

    try {
      const xmlContent = fs.readFileSync(connectionsFile, 'utf-8');
      const result = await parseXML(xmlContent);
      
      return this.extractConnections(result);
    } catch (error) {
      throw new Error(`Failed to parse DBeaver connections: ${error}`);
    }
  }

  private extractConnections(xmlData: any): DBeaverConnection[] {
    const connections: DBeaverConnection[] = [];
    
    if (!xmlData.connections || !xmlData.connections.connection) {
      return connections;
    }

    const connectionArray = Array.isArray(xmlData.connections.connection) 
      ? xmlData.connections.connection 
      : [xmlData.connections.connection];

    for (const conn of connectionArray) {
      const connection: DBeaverConnection = {
        id: conn.$.id || '',
        name: conn.$.name || '',
        driver: conn.$.driver || '',
        url: '',
        folder: conn.$.folder || '',
        description: conn.$.description || '',
        readonly: conn.$.readonly === 'true'
      };

      // Extract properties
      if (conn.property) {
        const properties: Record<string, string> = {};
        const propArray = Array.isArray(conn.property) ? conn.property : [conn.property];
        
        for (const prop of propArray) {
          if (prop.$ && prop.$.name && prop.$.value) {
            properties[prop.$.name] = prop.$.value;
          }
        }

        connection.properties = properties;
        connection.url = properties.url || '';
        connection.user = properties.user || '';
        connection.host = properties.host || '';
        connection.port = properties.port ? parseInt(properties.port) : undefined;
        connection.database = properties.database || '';
      }

      connections.push(connection);
    }

    return connections;
  }

  async getConnection(connectionId: string): Promise<DBeaverConnection | null> {
    const connections = await this.parseConnections();
    return connections.find(conn => 
      conn.id === connectionId || 
      conn.name === connectionId
    ) || null;
  }

  async validateConnection(connectionId: string): Promise<boolean> {
    const connection = await this.getConnection(connectionId);
    
    if (!connection) {
      return false;
    }

    // Basic validation - check if essential properties exist
    return !!(connection.url || (connection.host && connection.driver));
  }

  getWorkspacePath(): string {
    return this.config.workspacePath!;
  }

  async getDriverInfo(driverId: string): Promise<any> {
    const driversFile = path.join(
      this.config.workspacePath!,
      '.metadata',
      '.plugins',
      'org.jkiss.dbeaver.core',
      'drivers.xml'
    );

    if (!fs.existsSync(driversFile)) {
      return null;
    }

    try {
      const xmlContent = fs.readFileSync(driversFile, 'utf-8');
      const result: any = await parseXML(xmlContent);
      
      if (!result.drivers || !result.drivers.driver) {
        return null;
      }

      const driverArray = Array.isArray(result.drivers.driver) 
        ? result.drivers.driver 
        : [result.drivers.driver];

      return driverArray.find((driver: any) => driver.$.id === driverId) || null;
    } catch (error) {
      if (this.config.debug) {
        console.error(`Failed to parse drivers file: ${error}`);
      }
      return null;
    }
  }

  async getConnectionFolders(): Promise<string[]> {
    const connections = await this.parseConnections();
    const folders = new Set<string>();
    
    connections.forEach(conn => {
      if (conn.folder) {
        folders.add(conn.folder);
      }
    });

    return Array.from(folders).sort();
  }

  isWorkspaceValid(): boolean {
    const workspacePath = this.config.workspacePath!;
    const metadataPath = path.join(workspacePath, '.metadata');
    
    return fs.existsSync(workspacePath) && fs.existsSync(metadataPath);
  }

  getDebugInfo(): object {
    return {
      workspacePath: this.config.workspacePath,
      connectionsFile: this.getConnectionsFilePath(),
      connectionsFileExists: fs.existsSync(this.getConnectionsFilePath()),
      workspaceValid: this.isWorkspaceValid(),
      platform: os.platform(),
      nodeVersion: process.version
    };
  }
}