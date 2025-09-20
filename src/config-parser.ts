import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { DBeaverConnection, DBeaverConfig } from './types.js';

const parseXML = promisify(parseString);

export class DBeaverConfigParser {
  private config: DBeaverConfig;
  private isNewFormat: boolean = false;

  constructor(config: DBeaverConfig = {}) {
    this.config = {
      workspacePath: config.workspacePath || this.getDefaultWorkspacePath(),
      debug: config.debug || false,
      ...config
    };
    
    // Detect if we're using the new DBeaver format
    this.isNewFormat = this.detectNewFormat();
  }

  private detectNewFormat(): boolean {
    const newFormatPath = path.join(
      this.config.workspacePath!,
      'General',
      '.dbeaver',
      'data-sources.json'
    );
    const oldFormatPath = path.join(
      this.config.workspacePath!,
      '.metadata',
      '.plugins',
      'org.jkiss.dbeaver.core',
      'connections.xml'
    );
    
    // If new format exists, use it
    if (fs.existsSync(newFormatPath)) {
      return true;
    }
    
    // If old format exists, use it
    if (fs.existsSync(oldFormatPath)) {
      return false;
    }
    
    // If neither exists, check for new format directory structure
    const newFormatDir = path.join(this.config.workspacePath!, 'General', '.dbeaver');
    const oldFormatDir = path.join(this.config.workspacePath!, '.metadata');
    
    // Prefer new format if its directory structure exists
    if (fs.existsSync(newFormatDir)) {
      return true;
    }
    
    // Default to old format if metadata directory exists
    if (fs.existsSync(oldFormatDir)) {
      return false;
    }
    
    // Default to new format for newer DBeaver installations
    return true;
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
    if (this.isNewFormat) {
      return path.join(
        this.config.workspacePath!,
        'General',
        '.dbeaver',
        'data-sources.json'
      );
    } else {
      return path.join(
        this.config.workspacePath!,
        '.metadata',
        '.plugins',
        'org.jkiss.dbeaver.core',
        'connections.xml'
      );
    }
  }

  private getCredentialsFilePath(): string {
    if (this.isNewFormat) {
      return path.join(
        this.config.workspacePath!,
        'General',
        '.dbeaver',
        'credentials-config.json'
      );
    } else {
      return path.join(
        this.config.workspacePath!,
        '.metadata',
        '.plugins',
        'org.jkiss.dbeaver.core',
        'credentials-config.json'
      );
    }
  }

  async parseConnections(): Promise<DBeaverConnection[]> {
    const connectionsFile = this.getConnectionsFilePath();
    
    if (!fs.existsSync(connectionsFile)) {
      // Try the alternative format if the detected format file doesn't exist
      const alternativeFormat = !this.isNewFormat;
      const alternativeFile = alternativeFormat 
        ? path.join(this.config.workspacePath!, 'General', '.dbeaver', 'data-sources.json')
        : path.join(this.config.workspacePath!, '.metadata', '.plugins', 'org.jkiss.dbeaver.core', 'connections.xml');
      
      if (fs.existsSync(alternativeFile)) {
        // Switch to the alternative format and retry
        this.isNewFormat = alternativeFormat;
        return this.parseConnections();
      }
      
      // Neither format exists - return empty array instead of throwing error
      if (this.config.debug) {
        console.warn(`No DBeaver connections found. Checked:\n- ${connectionsFile}\n- ${alternativeFile}`);
      }
      return [];
    }

    try {
      if (this.isNewFormat) {
        return this.parseNewFormatConnections(connectionsFile);
      } else {
        return this.parseOldFormatConnections(connectionsFile);
      }
    } catch (error) {
      throw new Error(`Failed to parse DBeaver connections: ${error}`);
    }
  }

  private async parseNewFormatConnections(filePath: string): Promise<DBeaverConnection[]> {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonContent);
    
    const connections: DBeaverConnection[] = [];
    
    if (!data.connections) {
      return connections;
    }

    for (const [connectionId, connData] of Object.entries(data.connections)) {
      const conn = connData as any;
      
      const connection: DBeaverConnection = {
        id: connectionId,
        name: conn.name || connectionId,
        driver: conn.driver || conn.provider || '',
        url: '',
        folder: conn.folder || '',
        description: conn.description || '',
        readonly: conn.readonly === true
      };

      // Extract properties from the new format
      if (conn.configuration) {
        const config = conn.configuration;
        connection.properties = {
          url: config.url || '',
          user: config.user || '',
          host: config.host || '',
          port: config.port ? String(config.port) : '',
          database: config.database || '',
          server: config.server || '',
          ...config
        };

        connection.url = config.url || '';
        connection.user = config.user || '';
        connection.host = config.host || config.server || '';
        connection.port = config.port ? parseInt(String(config.port)) : undefined;
        connection.database = config.database || '';
      }

      connections.push(connection);
    }

    return connections;
  }

  private async parseOldFormatConnections(filePath: string): Promise<DBeaverConnection[]> {
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const result = await parseXML(xmlContent);
    
    return this.extractConnections(result);
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
    if (this.isNewFormat) {
      // New format doesn't have a separate drivers.xml file
      // Driver info is embedded in the data-sources.json
      return null;
    }

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
    
    if (this.isNewFormat) {
      const newFormatPath = path.join(workspacePath, 'General', '.dbeaver');
      return fs.existsSync(workspacePath) && fs.existsSync(newFormatPath);
    } else {
      const metadataPath = path.join(workspacePath, '.metadata');
      return fs.existsSync(workspacePath) && fs.existsSync(metadataPath);
    }
  }

  getDebugInfo(): object {
    return {
      workspacePath: this.config.workspacePath,
      connectionsFile: this.getConnectionsFilePath(),
      connectionsFileExists: fs.existsSync(this.getConnectionsFilePath()),
      workspaceValid: this.isWorkspaceValid(),
      isNewFormat: this.isNewFormat,
      platform: os.platform(),
      nodeVersion: process.version
    };
  }
}