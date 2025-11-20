import yaml from 'js-yaml';

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
    this.modulesPath = process.env.REACT_APP_ADO_MODULES_PATH || 'modules';
    this.branch = process.env.REACT_APP_ADO_BRANCH || 'main';

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
        `api-version=7.0`;

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
        `api-version=7.0`;

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
}

// Export singleton instance
export const adoService = new ADOService();

// Export class for testing
export default ADOService;
