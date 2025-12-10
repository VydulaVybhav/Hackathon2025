import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, GitBranch, Search, RefreshCw } from 'lucide-react';
import { adoService } from '../../services/adoService';
import './GitFileBrowser.css';

const GitFileBrowser = ({ onFileSelect, isOpen, onBranchChangeRequest, pendingBranchSwitch }) => {
  const [fileTree, setFileTree] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Handle confirmed branch switch from parent
  useEffect(() => {
    if (pendingBranchSwitch && pendingBranchSwitch !== currentBranch) {
      console.log('Applying pending branch switch to:', pendingBranchSwitch);
      setCurrentBranch(pendingBranchSwitch);
      setExpandedFolders(new Set());
    }
  }, [pendingBranchSwitch, currentBranch]);

  // Load branches on mount
  useEffect(() => {
    if (isOpen && adoService.isConfigured()) {
      loadBranches();
    }
  }, [isOpen]);

  // Load file tree when branch changes
  useEffect(() => {
    if (isOpen && currentBranch) {
      loadFileTree();
    }
  }, [currentBranch, isOpen]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const branchList = await adoService.getBranches();
      setBranches(branchList);
      setError(null);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const loadFileTree = async () => {
    try {
      setLoading(true);
      setFileTree([]); // Clear existing tree
      // Update the branch in adoService before loading tree
      adoService.branch = currentBranch;
      console.log('Loading file tree for branch:', currentBranch);
      const tree = await adoService.getRepositoryTree('/');
      setFileTree(tree);
      setError(null);
    } catch (err) {
      console.error('Failed to load file tree:', err);
      setError('Failed to load repository');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (file) => {
    if (file.isFolder) {
      toggleFolder(file.path);
      return;
    }

    try {
      setLoading(true);
      // Ensure we're using the current branch
      adoService.branch = currentBranch;
      const content = await adoService.getFileContent(file.path);
      const language = detectLanguage(file.name);

      if (onFileSelect) {
        onFileSelect({
          path: file.path,
          name: file.name,
          content,
          language,
          id: file.id,
        });
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      setError(`Failed to load ${file.name}`);
    } finally {
      setLoading(false);
    }
  };

  const detectLanguage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'md': 'markdown',
      'sh': 'bash',
      'ps1': 'powershell',
      'sql': 'sql',
      'css': 'css',
      'html': 'html',
      'xml': 'xml',
    };
    return languageMap[ext] || 'text';
  };

  const renderFileTree = (nodes, depth = 0) => {
    if (!nodes || nodes.length === 0) return null;

    const filteredNodes = searchQuery
      ? nodes.filter(node => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : nodes;

    return filteredNodes.map(node => {
      const isExpanded = expandedFolders.has(node.path);
      const Icon = node.isFolder
        ? isExpanded ? FolderOpen : Folder
        : File;

      return (
        <div key={node.path} className="git-file-item-container">
          <div
            className={`git-file-item ${!node.isFolder ? 'git-file-item-file' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => handleFileClick(node)}
          >
            {node.isFolder && (
              <span className="git-file-chevron">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            )}
            <Icon size={16} className="git-file-icon" />
            <span className="git-file-name">{node.name}</span>
          </div>
          {node.isFolder && isExpanded && node.children && (
            <div className="git-file-children">
              {renderFileTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (!adoService.isConfigured()) {
    return (
      <div className="git-browser-unconfigured">
        <p>ADO Git not configured</p>
        <small>Set environment variables to enable</small>
      </div>
    );
  }

  return (
    <div className="git-file-browser">
      {/* Header */}
      <div className="git-browser-header">
        <h3>Repository Browser</h3>
        <button
          onClick={loadFileTree}
          className="git-refresh-btn"
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'git-refresh-spinning' : ''} />
        </button>
      </div>

      {/* Branch Selector */}
      <div className="git-branch-selector">
        <GitBranch size={16} />
        <select
          value={currentBranch}
          onChange={(e) => {
            const newBranch = e.target.value;

            // Ask parent if branch change is okay (checks for unsaved changes)
            if (onBranchChangeRequest) {
              const canProceed = onBranchChangeRequest(newBranch);
              if (!canProceed) {
                // Cancel the change - select element will revert automatically
                return;
              }
            }

            setCurrentBranch(newBranch);
            // Clear expanded folders when switching branches
            setExpandedFolders(new Set());
          }}
          className="git-branch-dropdown"
          disabled={loading}
        >
          {branches.map(branch => (
            <option key={branch.name} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="git-search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="git-search-input"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="git-error-message">
          {error}
        </div>
      )}

      {/* File Tree */}
      <div className="git-file-tree">
        {loading && fileTree.length === 0 ? (
          <div className="git-loading">Loading repository...</div>
        ) : (
          renderFileTree(fileTree)
        )}
      </div>
    </div>
  );
};

export default GitFileBrowser;
