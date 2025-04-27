// Volume manager for handling Docker volume creation, use, and cleanup
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export class VolumeManager {
  private readonly volumePrefix: string;
  private readonly maxVolumes: number;
  private readonly tempDir: string;

  constructor(volumePrefix: string = 'tool-volume-', maxVolumes: number = 100) {
    this.volumePrefix = volumePrefix;
    this.maxVolumes = maxVolumes;
    this.tempDir = path.join(os.tmpdir(), 'tool-volume-temp');
  }

  /**
   * Create a new Docker volume with the configured prefix
   */
  async createVolume(): Promise<string> {
    const volumeName = `${this.volumePrefix}${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    await this.executeDockerCommand(['volume', 'create', volumeName]);

    return volumeName;
  }

  /**
   * Remove a Docker volume by name
   */
  async removeVolume(volumeName: string): Promise<void> {
    await this.executeDockerCommand(['volume', 'rm', volumeName]);
  }

  /**
   * Get info about a volume
   */
  async getVolumeInfo(volumeName: string): Promise<{
    name: string;
    driver: string;
    mountpoint: string;
    created: string;
    labels: Record<string, string>;
  }> {
    const result = await this.executeDockerCommand(['volume', 'inspect', volumeName]);

    const volumeInfo = JSON.parse(result)[0];
    return {
      name: volumeInfo.Name,
      driver: volumeInfo.Driver,
      mountpoint: volumeInfo.Mountpoint,
      created: volumeInfo.CreatedAt,
      labels: volumeInfo.Labels || {},
    };
  }

  /**
   * List all volumes with our prefix
   */
  async listVolumes(): Promise<string[]> {
    const result = await this.executeDockerCommand(['volume', 'ls', '--format', '{{.Name}}']);

    return result.split('\n').filter(name => name.startsWith(this.volumePrefix));
  }

  /**
   * Initialize a volume with persistent files
   */
  async initializeVolume(volumeName: string, files: { [path: string]: string }): Promise<void> {
    const tempDir = path.join(this.tempDir, volumeName);

    try {
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });

      // Write files to temp directory
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(tempDir, filePath);
        const dirPath = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, content, 'utf8');
      }

      // Use Docker to copy files to volume
      await this.copyToVolume(tempDir, volumeName, '/');
    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Copy files to a volume using a temporary container
   */
  private async copyToVolume(
    sourcePath: string,
    volumeName: string,
    destinationPath: string
  ): Promise<void> {
    const containerName = `${this.volumePrefix}copy-${Date.now()}`;

    try {
      // Create a temporary container with the volume mounted
      await this.executeDockerCommand([
        'create',
        '--name',
        containerName,
        '-v',
        `${volumeName}:/volume`,
        'alpine',
        'sh',
      ]);

      // Copy files to the container
      await this.executeDockerCommand([
        'cp',
        `${sourcePath}/.`,
        `${containerName}:/volume${destinationPath}`,
      ]);
    } finally {
      // Remove the temporary container
      await this.executeDockerCommand(['rm', containerName]).catch(() => {
        // Ignore errors on cleanup
      });
    }
  }

  /**
   * Extract files from a volume to a local path
   */
  async extractFromVolume(
    volumeName: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    const containerName = `${this.volumePrefix}extract-${Date.now()}`;

    try {
      // Create destination directory
      await fs.mkdir(destinationPath, { recursive: true });

      // Create a temporary container with the volume mounted
      await this.executeDockerCommand([
        'create',
        '--name',
        containerName,
        '-v',
        `${volumeName}:/volume`,
        'alpine',
        'sh',
      ]);

      // Copy files from the container
      await this.executeDockerCommand([
        'cp',
        `${containerName}:/volume${sourcePath}`,
        destinationPath,
      ]);
    } finally {
      // Remove the temporary container
      await this.executeDockerCommand(['rm', containerName]).catch(() => {
        // Ignore errors on cleanup
      });
    }
  }

  /**
   * Clean up old volumes to prevent storage exhaustion
   */
  async cleanupOldVolumes(): Promise<void> {
    // Get all volumes with our prefix
    const volumes = await this.listVolumes();

    // If we're under the limit, no need to clean up
    if (volumes.length <= this.maxVolumes) {
      return;
    }

    // Get creation times for all volumes
    const volumeDetails = await Promise.all(
      volumes.map(async name => {
        try {
          const info = await this.getVolumeInfo(name);
          return {
            name,
            created: new Date(info.created).getTime(),
          };
        } catch (error) {
          // If we can't get info, consider it old
          return {
            name,
            created: 0,
          };
        }
      })
    );

    // Sort by creation time (oldest first)
    volumeDetails.sort((a, b) => a.created - b.created);

    // Remove oldest volumes until we're under the limit
    const volumesToRemove = volumeDetails.slice(0, volumes.length - this.maxVolumes);

    for (const volume of volumesToRemove) {
      try {
        await this.removeVolume(volume.name);
        console.log(`Removed old volume: ${volume.name}`);
      } catch (error) {
        console.warn(`Failed to remove volume ${volume.name}: ${error}`);
      }
    }
  }

  /**
   * Execute a Docker command
   */
  private executeDockerCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', args);

      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', data => {
        stdout += data.toString();
      });

      docker.stderr.on('data', data => {
        stderr += data.toString();
      });

      docker.on('close', code => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Docker command failed with code ${code}: ${stderr}`));
        }
      });

      docker.on('error', error => {
        reject(new Error(`Failed to execute Docker command: ${error.message}`));
      });
    });
  }
}
