import { useState, useEffect } from 'react';
import { adoService } from '../services/adoService';
import * as LucideIcons from 'lucide-react';

/**
 * Hook to load system modules from Azure DevOps
 * NO FALLBACK - Requires ADO to be configured
 */
export const useModuleLoader = () => {
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    // Check if ADO is configured
    if (!adoService.isConfigured()) {
      const missingVars = [];
      if (!process.env.REACT_APP_ADO_ORG) missingVars.push('REACT_APP_ADO_ORG');
      if (!process.env.REACT_APP_ADO_PROJECT) missingVars.push('REACT_APP_ADO_PROJECT');
      if (!process.env.REACT_APP_ADO_REPO) missingVars.push('REACT_APP_ADO_REPO');
      if (!process.env.REACT_APP_ADO_PAT) missingVars.push('REACT_APP_ADO_PAT');

      const errorMsg = `ADO not configured. Missing: ${missingVars.join(', ')}`;
      console.error(errorMsg);
      setError(errorMsg);
      setSource(null);
      setModules([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adoModules = await adoService.fetchModules();

      if (adoModules && adoModules.length > 0) {
        // Map icon names to actual React components
        const modulesWithIcons = adoModules.map(module => ({
          ...module,
          icon: getIconComponent(module.icon),
        }));

        setModules(modulesWithIcons);
        setSource('ado');
        console.log(`Loaded ${modulesWithIcons.length} modules from ADO`);
      } else {
        const errorMsg = 'No modules found in ADO repository';
        console.error(errorMsg);
        setError(errorMsg);
        setModules([]);
        setSource(null);
      }
    } catch (err) {
      console.error('Failed to load modules from ADO:', err);
      setError(`ADO Connection Failed: ${err.message}`);
      setSource(null);
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Map icon name string to lucide-react component
   */
  const getIconComponent = (iconName) => {
    if (!iconName || typeof iconName !== 'string') {
      return LucideIcons.Box;
    }

    // Try exact match first
    if (LucideIcons[iconName]) {
      return LucideIcons[iconName];
    }

    // Try PascalCase conversion
    const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    if (LucideIcons[pascalCase]) {
      return LucideIcons[pascalCase];
    }

    // Common mappings
    const iconMap = {
      'webhook': LucideIcons.Webhook,
      'database': LucideIcons.Database,
      'mail': LucideIcons.Mail,
      'email': LucideIcons.Mail,
      'calendar': LucideIcons.Calendar,
      'code': LucideIcons.Code,
      'filter': LucideIcons.Filter,
      'message': LucideIcons.MessageSquare,
      'messagesquare': LucideIcons.MessageSquare,
      'clock': LucideIcons.Clock,
      'time': LucideIcons.Clock,
      'settings': LucideIcons.Settings,
      'cloud': LucideIcons.Cloud,
      'server': LucideIcons.Server,
      'api': LucideIcons.Zap,
      'zap': LucideIcons.Zap,
      'file': LucideIcons.File,
      'folder': LucideIcons.Folder,
      'box': LucideIcons.Box,
      'package': LucideIcons.Package,
      'git': LucideIcons.GitBranch,
      'github': LucideIcons.Github,
      'upload': LucideIcons.Upload,
      'download': LucideIcons.Download,
      'alert': LucideIcons.AlertCircle,
      'check': LucideIcons.CheckCircle,
      'info': LucideIcons.Info,
    };

    const normalizedName = iconName.toLowerCase().replace(/[-_\s]/g, '');
    return iconMap[normalizedName] || LucideIcons.Box;
  };

  return {
    modules,
    isLoading,
    error,
    source, // 'default' or 'ado'
    reload: loadModules,
  };
};
