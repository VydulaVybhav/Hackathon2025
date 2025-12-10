import yaml from 'js-yaml';
import { ADO_CONFIG } from '../constants/appConstants';

/**
 * Azure DevOps Service for fetching module definitions
 *
 * Environment Variables Required:
 * - REACT_APP_ADO_ORG: Azure DevOps organization name
 * - REACT_APP_ADO_PROJECT: Project name
 * - REACT_APP_ADO_REPO: Repository name
 * - REACT_APP_ADO_PAT: Personal Access Token
 * - REACT_APP_ADO_MODULES_PATH: Path to modules folder (e.g., 'modules' or 'config/modules')
 * - REACT_APP_ADO_BRANCH: Branch name (optional, defaults to 'main')
 */

class ADOService {
  constructor() {
    this.organization = process.env.REACT_APP_ADO_ORG;
    this.project = process.env.REACT_APP_ADO_PROJECT;
    this.repository = process.env.REACT_APP_ADO_REPO;
    this.pat = process.env.REACT_APP_ADO_PAT;
    this.modulesPath = process.env.REACT_APP_ADO_MODULES_PATH || ADO_CONFIG.DEFAULT_MODULES_PATH;
    this.branch = process.env.REACT_APP_ADO_BRANCH || ADO_CONFIG.DEFAULT_BRANCH;

    this.baseUrl = `https://dev.azure.com/${this.organization}/${this.project}/_apis`;
  }

  /**
   * Check if ADO configuration is valid
   */
  isConfigured() {
    return !!(this.organization && this.project && this.repository && this.pat);
  }

  /**
   * Get authorization headers with PAT
   */
  getHeaders() {
    const encodedPat = btoa(`:${this.pat}`);
    return {
      'Authorization': `Basic ${encodedPat}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch list of files in the modules folder
   */
  async getModuleFiles() {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete. Check environment variables.');
    }

    try {
      const url = `${this.baseUrl}/git/repositories/${this.repository}/items?` +
        `scopePath=/${this.modulesPath}&` +
        `recursionLevel=OneLevel&` +
        `versionDescriptor.version=${this.branch}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`ADO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Filter for YAML files only
      const yamlFiles = data.value.filter(
        item => !item.isFolder && (item.path.endsWith('.yaml') || item.path.endsWith('.yml'))
      );

      return yamlFiles;
    } catch (error) {
      console.error('Error fetching module files:', error);
      throw error;
    }
  }

  /**
   * Fetch content of a specific file
   */
  async getFileContent(filePath) {
    try {
      const url = `${this.baseUrl}/git/repositories/${this.repository}/items?` +
        `path=${filePath}&` +
        `versionDescriptor.version=${this.branch}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      return content;
    } catch (error) {
      console.error(`Error fetching file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Parse YAML content into module definition
   */
  parseModuleYaml(yamlContent, fileName) {
    try {
      const parsed = yaml.load(yamlContent);

      // Validate required fields
      if (!parsed.label || !parsed.type) {
        console.warn(`Module ${fileName} missing required fields (label, type)`);
        return null;
      }

      // Convert parameters to config object
      const config = {};
      if (parsed.parameters && Array.isArray(parsed.parameters)) {
        parsed.parameters.forEach(param => {
          config[param.name] = param.default || '';
        });
      }

      return {
        type: parsed.type,
        label: parsed.label,
        description: parsed.description || '',
        icon: this.getIconComponent(parsed.icon),
        config: config,
        // Store original parameters for reference
        _parameters: parsed.parameters || [],
      };
    } catch (error) {
      console.error(`Error parsing YAML for ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Map icon name to lucide-react component
   * Note: This requires importing icons dynamically or maintaining a map
   */
  getIconComponent(iconName) {
    // Import lucide-react icons
    const iconMap = {
      'webhook': 'Webhook',
      'database': 'Database',
      'mail': 'Mail',
      'calendar': 'Calendar',
      'code': 'Code',
      'filter': 'Filter',
      'message': 'MessageSquare',
      'clock': 'Clock',
      'settings': 'Settings',
      'cloud': 'Cloud',
      'server': 'Server',
      'api': 'Zap',
      'file': 'File',
      'folder': 'Folder',
    };

    return iconMap[iconName?.toLowerCase()] || 'Box';
  }

  /**
   * Fetch and parse all module definitions from ADO
   */
  async fetchModules() {
    if (!this.isConfigured()) {
      console.warn('ADO not configured, skipping module fetch');
      return [];
    }

    try {
      console.log('Fetching modules from ADO...');

      // Get list of YAML files
      const files = await this.getModuleFiles();
      console.log(`Found ${files.length} module files`);

      // Fetch and parse each file
      const modules = [];
      for (const file of files) {
        try {
          const content = await this.getFileContent(file.path);
          const module = this.parseModuleYaml(content, file.path);

          if (module) {
            modules.push(module);
          }
        } catch (error) {
          console.error(`Failed to process ${file.path}:`, error);
          // Continue with other files
        }
      }

      console.log(`Successfully loaded ${modules.length} modules from ADO`);
      return modules;
    } catch (error) {
      console.error('Error fetching modules from ADO:', error);
      throw error;
    }
  }

  /**
   * Browse entire Git repository (recursive file tree)
   */
  async getRepositoryTree(path = '/', recursionLevel = 'Full') {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete');
    }

    try {
      const url = `${this.baseUrl}/git/repositories/${this.repository}/items?` +
        `scopePath=${path}&` +
        `recursionLevel=${recursionLevel}&` +
        `versionDescriptor.version=${this.branch}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch repository tree: ${response.status}`);
      }

      const data = await response.json();
      return this.formatFileTree(data.value);
    } catch (error) {
      console.error('Error fetching repository tree:', error);
      throw error;
    }
  }

  /**
   * Format ADO file tree into hierarchical structure
   */
  formatFileTree(items) {
    const tree = [];
    const pathMap = new Map();

    // First pass: create all nodes
    items.forEach(item => {
      const parts = item.path.split('/').filter(p => p);
      const fileName = parts[parts.length - 1];

      const node = {
        id: item.objectId || item.path,
        name: fileName || 'root',
        path: item.path,
        isFolder: item.isFolder || item.gitObjectType === 'tree',
        size: item.size,
        url: item.url,
        children: item.isFolder ? [] : undefined,
      };

      pathMap.set(item.path, node);
    });

    // Second pass: build hierarchy
    items.forEach(item => {
      const parts = item.path.split('/').filter(p => p);
      const node = pathMap.get(item.path);

      if (parts.length === 1) {
        // Top-level item
        tree.push(node);
      } else {
        // Nested item - find parent
        const parentPath = '/' + parts.slice(0, -1).join('/');
        const parent = pathMap.get(parentPath);

        if (parent && parent.children) {
          parent.children.push(node);
        } else {
          // Parent not found, add to root as fallback
          console.warn(`Parent not found for ${item.path}, expected parent: ${parentPath}`);
          tree.push(node);
        }
      }
    });

    // Sort children alphabetically (folders first, then files)
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      nodes.forEach(node => {
        if (node.children) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(tree);
    return tree;
  }

  /**
   * Get list of branches in the repository
   */
  async getBranches() {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete');
    }

    try {
      const url = `${this.baseUrl}/git/repositories/${this.repository}/refs?` +
        `filter=heads/&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.status}`);
      }

      const data = await response.json();
      return data.value.map(ref => ({
        name: ref.name.replace('refs/heads/', ''),
        objectId: ref.objectId,
        creator: ref.creator,
      }));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  /**
   * Get commits for a specific file or path
   */
  async getCommitHistory(itemPath, maxCommits = 50) {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete');
    }

    try {
      const url = `${this.baseUrl}/git/repositories/${this.repository}/commits?` +
        `searchCriteria.itemPath=${itemPath}&` +
        `searchCriteria.$top=${maxCommits}&` +
        `searchCriteria.itemVersion.version=${this.branch}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch commit history: ${response.status}`);
      }

      const data = await response.json();
      return data.value.map(commit => ({
        commitId: commit.commitId,
        author: commit.author.name,
        authorEmail: commit.author.email,
        date: commit.author.date,
        message: commit.comment,
        changeCounts: commit.changeCounts,
      }));
    } catch (error) {
      console.error('Error fetching commit history:', error);
      throw error;
    }
  }

  /**
   * Search files in repository
   */
  async searchFiles(query) {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete');
    }

    try {
      const tree = await this.getRepositoryTree('/', 'Full');

      const filterTree = (nodes, searchQuery) => {
        const results = [];
        const lowerQuery = searchQuery.toLowerCase();

        for (const node of nodes) {
          if (node.name.toLowerCase().includes(lowerQuery)) {
            results.push(node);
          }
          if (node.children) {
            results.push(...filterTree(node.children, searchQuery));
          }
        }
        return results;
      };

      return filterTree(tree, query);
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  /**
   * Get file content at specific commit
   */
  async getFileAtCommit(filePath, commitId) {
    try {
      const url = `${this.baseUrl}/git/repositories/${this.repository}/items?` +
        `path=${filePath}&` +
        `versionDescriptor.versionType=commit&` +
        `versionDescriptor.version=${commitId}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file at commit: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error fetching file at commit:', error);
      throw error;
    }
  }

  /**
   * Create or update a file in the repository
   * @param {string} filePath - Path to the file (e.g., '/modules/example.yaml')
   * @param {string} content - New file content
   * @param {string} commitMessage - Commit message
   * @param {string} fileObjectId - Object ID of the file being updated (null for new files)
   * @returns {Promise} - Commit result
   */
  async commitFileChange(filePath, content, commitMessage, fileObjectId = null) {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete');
    }

    try {
      // Check if file exists to determine changeType
      let changeType = 'add';
      if (fileObjectId) {
        // File has an object ID, so it exists - use 'edit'
        changeType = 'edit';
      } else {
        // Double-check if file exists by trying to fetch it
        try {
          await this.getFileContent(filePath);
          changeType = 'edit'; // File exists
        } catch (e) {
          changeType = 'add'; // File doesn't exist
        }
      }

      console.log(`Change type for ${filePath}: ${changeType}`);

      // Get the latest commit to use as the base
      const refsUrl = `${this.baseUrl}/git/repositories/${this.repository}/refs?` +
        `filter=heads/${this.branch}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const refsResponse = await fetch(refsUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!refsResponse.ok) {
        throw new Error(`Failed to get branch ref: ${refsResponse.status}`);
      }

      const refsData = await refsResponse.json();
      const branchRef = refsData.value[0];

      if (!branchRef) {
        throw new Error(`Branch ${this.branch} not found`);
      }

      const oldCommitId = branchRef.objectId;

      // Create the push payload
      const pushPayload = {
        refUpdates: [
          {
            name: `refs/heads/${this.branch}`,
            oldObjectId: oldCommitId,
          }
        ],
        commits: [
          {
            comment: commitMessage,
            changes: [
              {
                changeType: changeType,
                item: {
                  path: filePath,
                },
                newContent: {
                  content: content,
                  contentType: 'rawtext',
                }
              }
            ]
          }
        ]
      };

      // Push the change
      const pushUrl = `${this.baseUrl}/git/repositories/${this.repository}/pushes?` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const pushResponse = await fetch(pushUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(pushPayload),
      });

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        throw new Error(`Failed to push changes: ${pushResponse.status} - ${errorText}`);
      }

      const pushData = await pushResponse.json();
      return {
        success: true,
        commitId: pushData.commits[0].commitId,
        pushId: pushData.pushId,
      };
    } catch (error) {
      console.error('Error committing file change:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the repository
   * @param {string} filePath - Path to the file to delete
   * @param {string} commitMessage - Commit message
   * @returns {Promise} - Commit result
   */
  async deleteFile(filePath, commitMessage) {
    if (!this.isConfigured()) {
      throw new Error('ADO configuration incomplete');
    }

    try {
      // Get the latest commit
      const refsUrl = `${this.baseUrl}/git/repositories/${this.repository}/refs?` +
        `filter=heads/${this.branch}&` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const refsResponse = await fetch(refsUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!refsResponse.ok) {
        throw new Error(`Failed to get branch ref: ${refsResponse.status}`);
      }

      const refsData = await refsResponse.json();
      const branchRef = refsData.value[0];
      const oldCommitId = branchRef.objectId;

      // Create the push payload
      const pushPayload = {
        refUpdates: [
          {
            name: `refs/heads/${this.branch}`,
            oldObjectId: oldCommitId,
          }
        ],
        commits: [
          {
            comment: commitMessage,
            changes: [
              {
                changeType: 'delete',
                item: {
                  path: filePath,
                }
              }
            ]
          }
        ]
      };

      // Push the change
      const pushUrl = `${this.baseUrl}/git/repositories/${this.repository}/pushes?` +
        `api-version=${ADO_CONFIG.API_VERSION}`;

      const pushResponse = await fetch(pushUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(pushPayload),
      });

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        throw new Error(`Failed to delete file: ${pushResponse.status} - ${errorText}`);
      }

      const pushData = await pushResponse.json();
      return {
        success: true,
        commitId: pushData.commits[0].commitId,
        pushId: pushData.pushId,
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adoService = new ADOService();

// Export class for testing
export default ADOService;
