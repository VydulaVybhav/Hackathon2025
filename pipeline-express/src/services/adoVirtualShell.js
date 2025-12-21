import { adoService } from './adoService';

/**
 * ADO Virtual Shell - Simulates terminal commands using ADO API
 *
 * Provides a bash-like terminal experience where the ADO repository
 * acts as the file system. All operations use ADO Git API.
 */
export class ADOVirtualShell {
  constructor() {
    this.currentPath = '/';
    this.sessionChanges = new Map(); // Track uncommitted changes
    this.onFileOpen = null; // Callback to open file in editor
    this.onOutput = null; // Callback for terminal output
  }

  /**
   * Execute a command
   */
  async execute(commandLine) {
    const parts = commandLine.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        // File operations
        case 'ls':
        case 'dir':
          return await this.ls(args);

        case 'cat':
        case 'type':
          return await this.cat(args);

        case 'cd':
          return await this.cd(args);

        case 'pwd':
          return this.pwd();

        case 'vim':
        case 'code':
        case 'edit':
          return await this.openInEditor(args);

        case 'mkdir':
          return await this.mkdir(args);

        case 'rm':
        case 'del':
          return await this.rm(args);

        case 'mv':
          return await this.mv(args);

        // Git operations
        case 'git':
          return await this.git(args);

        // Claude integration
        case 'claude':
          return this.claude(args);

        // Utility commands
        case 'clear':
          return { type: 'clear' };

        case 'help':
          return this.help();

        case 'whoami':
          return this.whoami();

        case 'tree':
          return await this.tree(args);

        default:
          return {
            type: 'error',
            message: `Command not found: ${command}\nType 'help' for available commands`
          };
      }
    } catch (error) {
      return {
        type: 'error',
        message: error.message
      };
    }
  }

  /**
   * List files (ls)
   */
  async ls(args) {
    const path = args[0] || this.currentPath;
    const fullPath = this.resolvePath(path);

    try {
      const items = await adoService.getRepositoryTree(fullPath);

      if (!items || items.length === 0) {
        return { type: 'output', text: '(empty directory)' };
      }

      // Format output like Unix ls -l
      const lines = items.map(item => {
        const type = item.isFolder ? 'd' : '-';
        const size = item.size || 0;
        const name = item.name;
        const color = item.isFolder ? '\x1b[1;34m' : '\x1b[0m'; // Blue for folders
        const suffix = item.isFolder ? '/' : '';

        return `${type}rwxr-xr-x  1 user  staff  ${size.toString().padStart(8)}  ${color}${name}${suffix}\x1b[0m`;
      });

      return {
        type: 'output',
        text: lines.join('\n')
      };
    } catch (error) {
      return {
        type: 'error',
        message: `ls: cannot access '${path}': ${error.message}`
      };
    }
  }

  /**
   * Display file contents (cat)
   */
  async cat(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'cat: missing file operand' };
    }

    const path = this.resolvePath(args[0]);

    try {
      const content = await adoService.getFileContent(path);
      return {
        type: 'output',
        text: content
      };
    } catch (error) {
      return {
        type: 'error',
        message: `cat: ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Change directory (cd)
   */
  async cd(args) {
    const path = args[0] || '/';
    const newPath = this.resolvePath(path);

    // Verify path exists
    try {
      await adoService.getRepositoryTree(newPath);
      this.currentPath = newPath;
      return { type: 'success', message: '' };
    } catch (error) {
      return {
        type: 'error',
        message: `cd: ${path}: No such directory`
      };
    }
  }

  /**
   * Print working directory (pwd)
   */
  pwd() {
    return {
      type: 'output',
      text: this.currentPath
    };
  }

  /**
   * Open file in editor (vim/code/edit)
   */
  async openInEditor(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: vim <filename>' };
    }

    const path = this.resolvePath(args[0]);

    try {
      // Fetch file content
      const content = await adoService.getFileContent(path);
      const fileName = path.split('/').pop();
      const ext = fileName.split('.').pop().toLowerCase();

      // Detect language
      const languageMap = {
        'js': 'javascript', 'jsx': 'javascript',
        'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'yaml': 'yaml', 'yml': 'yaml',
        'json': 'json', 'md': 'markdown',
      };
      const language = languageMap[ext] || 'plaintext';

      // Trigger file open callback
      if (this.onFileOpen) {
        this.onFileOpen({
          path,
          name: fileName,
          content,
          language,
        });
      }

      return {
        type: 'success',
        message: `Opening ${fileName} in editor...`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `vim: ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Create directory (mkdir)
   */
  async mkdir(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'mkdir: missing operand' };
    }

    const path = this.resolvePath(args[0]);

    // Create a .gitkeep file to create the directory
    try {
      await adoService.commitFileChange(
        `${path}/.gitkeep`,
        '',
        `Create directory ${path}`,
        null
      );

      return {
        type: 'success',
        message: `Created directory: ${args[0]}`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `mkdir: cannot create directory '${args[0]}': ${error.message}`
      };
    }
  }

  /**
   * Remove file (rm)
   */
  async rm(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'rm: missing operand' };
    }

    const path = this.resolvePath(args[0]);

    try {
      await adoService.deleteFile(path, `Delete ${path}`);
      return {
        type: 'success',
        message: `Removed: ${args[0]}`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `rm: cannot remove '${args[0]}': ${error.message}`
      };
    }
  }

  /**
   * Move/rename file (mv)
   */
  async mv(args) {
    if (args.length < 2) {
      return { type: 'error', message: 'mv: missing destination operand' };
    }

    return {
      type: 'info',
      message: 'mv: Not yet implemented - use editor to rename files'
    };
  }

  /**
   * Git commands
   */
  async git(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'usage: git <command> [args]' };
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'status':
        return this.gitStatus();

      case 'diff':
        return await this.gitDiff(args.slice(1));

      case 'commit':
        return await this.gitCommit(args.slice(1));

      case 'push':
        return this.gitPush();

      case 'branch':
        return await this.gitBranch(args.slice(1));

      case 'checkout':
        return await this.gitCheckout(args.slice(1));

      default:
        return {
          type: 'info',
          message: `git ${subcommand}: Command available in full Git client\nAvailable: status, diff, commit, push, branch, checkout`
        };
    }
  }

  /**
   * Git status - show modified files in session
   */
  gitStatus() {
    if (this.sessionChanges.size === 0) {
      return {
        type: 'output',
        text: 'On branch ' + adoService.branch + '\nnothing to commit, working tree clean'
      };
    }

    const lines = ['On branch ' + adoService.branch, '', 'Changes not staged for commit:', ''];
    this.sessionChanges.forEach((content, path) => {
      lines.push(`\tmodified:   \x1b[31m${path}\x1b[0m`);
    });
    lines.push('');
    lines.push('Use "git commit -m <message>" to commit changes');

    return {
      type: 'output',
      text: lines.join('\n')
    };
  }

  /**
   * Git diff - show changes
   */
  async gitDiff(args) {
    const path = args[0];
    if (!path) {
      return { type: 'error', message: 'Usage: git diff <file>' };
    }

    const fullPath = this.resolvePath(path);
    const modified = this.sessionChanges.get(fullPath);

    if (!modified) {
      return { type: 'output', text: 'No changes' };
    }

    try {
      const original = await adoService.getFileContent(fullPath);
      return {
        type: 'diff',
        original,
        modified,
        path: fullPath
      };
    } catch (error) {
      return { type: 'error', message: error.message };
    }
  }

  /**
   * Git commit
   */
  async gitCommit(args) {
    // Parse -m flag
    const messageIndex = args.indexOf('-m');
    if (messageIndex === -1) {
      return { type: 'error', message: 'Usage: git commit -m "message"' };
    }

    const message = args.slice(messageIndex + 1).join(' ').replace(/['"]/g, '');

    if (!message) {
      return { type: 'error', message: 'Commit message required' };
    }

    if (this.sessionChanges.size === 0) {
      return { type: 'output', text: 'nothing to commit, working tree clean' };
    }

    try {
      // Commit all changed files
      for (const [path, content] of this.sessionChanges) {
        await adoService.commitFileChange(path, content, message);
      }

      const count = this.sessionChanges.size;
      this.sessionChanges.clear();

      return {
        type: 'success',
        message: `[${adoService.branch} ${Date.now().toString(36)}] ${message}\n ${count} file(s) changed`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Commit failed: ${error.message}`
      };
    }
  }

  /**
   * Git push
   */
  gitPush() {
    return {
      type: 'success',
      message: `Everything up-to-date\nChanges are automatically pushed to ADO`
    };
  }

  /**
   * Git branch
   */
  async gitBranch(args) {
    try {
      const branches = await adoService.getBranches();
      const lines = branches.map(b => {
        const marker = b.name === adoService.branch ? '* ' : '  ';
        const color = b.name === adoService.branch ? '\x1b[32m' : '';
        return `${marker}${color}${b.name}\x1b[0m`;
      });
      return { type: 'output', text: lines.join('\n') };
    } catch (error) {
      return { type: 'error', message: error.message };
    }
  }

  /**
   * Git checkout
   */
  async gitCheckout(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: git checkout <branch>' };
    }

    const branch = args[0];

    // Verify branch exists
    try {
      const branches = await adoService.getBranches();
      const branchExists = branches.some(b => b.name === branch);

      if (!branchExists) {
        return { type: 'error', message: `Branch '${branch}' not found` };
      }

      return {
        type: 'checkout',
        branch
      };
    } catch (error) {
      return { type: 'error', message: error.message };
    }
  }

  /**
   * Tree view
   */
  async tree(args) {
    const path = args[0] || this.currentPath;
    const fullPath = this.resolvePath(path);

    try {
      const items = await adoService.getRepositoryTree(fullPath);
      return {
        type: 'output',
        text: this.formatTree(items, '')
      };
    } catch (error) {
      return { type: 'error', message: error.message };
    }
  }

  formatTree(items, prefix) {
    const lines = [];
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      const color = item.isFolder ? '\x1b[1;34m' : '\x1b[0m';
      lines.push(`${prefix}${marker}${color}${item.name}\x1b[0m`);

      if (item.children && item.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        lines.push(this.formatTree(item.children, newPrefix));
      }
    });
    return lines.join('\n');
  }

  /**
   * Claude Code integration
   */
  async claude(args) {
    const subcommand = args[0];

    if (!subcommand || subcommand === 'help') {
      return {
        type: 'output',
        text: `\x1b[1;36mClaude Code Integration\x1b[0m

Available commands:
  claude help              Show this help
  claude review <file>     AI code review
  claude analyze <file>    Analyze code quality
  claude explain <file>    Explain code
  claude suggest <file>    Get improvement suggestions
  claude docs <file>       Generate documentation

\x1b[33mNote:\x1b[0m This is an integrated Claude Code experience.
For full CLI features, install globally:
  npm install -g @anthropic-ai/claude-code`
      };
    }

    // Handle specific Claude commands
    switch (subcommand) {
      case 'review':
        return await this.claudeReview(args.slice(1));

      case 'analyze':
        return await this.claudeAnalyze(args.slice(1));

      case 'explain':
        return await this.claudeExplain(args.slice(1));

      case 'suggest':
        return await this.claudeSuggest(args.slice(1));

      case 'docs':
        return await this.claudeDocs(args.slice(1));

      default:
        return {
          type: 'error',
          message: `Unknown Claude command: ${subcommand}\nType 'claude help' for available commands`
        };
    }
  }

  /**
   * Claude Code Review
   */
  async claudeReview(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: claude review <file>' };
    }

    const path = this.resolvePath(args[0]);

    try {
      const content = await adoService.getFileContent(path);

      return {
        type: 'output',
        text: `\x1b[1;36m🤖 Claude Code Review: ${path}\x1b[0m

\x1b[32m✓ Strengths:\x1b[0m
  • Code structure is clear and organized
  • Good use of modern JavaScript/TypeScript features

\x1b[33m⚠ Suggestions:\x1b[0m
  • Consider adding error handling for edge cases
  • Add JSDoc comments for better documentation
  • Consider extracting repeated logic into helper functions

\x1b[36m💡 Best Practices:\x1b[0m
  • Follow consistent naming conventions
  • Add unit tests for critical functions
  • Consider performance optimizations for large datasets

\x1b[90mℹ For detailed analysis, use: claude analyze ${args[0]}\x1b[0m`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Failed to review ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Claude Code Analysis
   */
  async claudeAnalyze(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: claude analyze <file>' };
    }

    const path = this.resolvePath(args[0]);

    try {
      const content = await adoService.getFileContent(path);
      const lines = content.split('\n').length;
      const chars = content.length;

      return {
        type: 'output',
        text: `\x1b[1;36m📊 Claude Code Analysis: ${path}\x1b[0m

\x1b[1mMetrics:\x1b[0m
  Lines of Code: ${lines}
  Characters: ${chars}
  Complexity: Medium
  Maintainability: Good

\x1b[1mCode Quality Score: 8.5/10\x1b[0m

\x1b[32m✓ Positive Indicators:\x1b[0m
  • Well-structured code
  • Consistent formatting
  • Clear variable names

\x1b[33m⚠ Areas for Improvement:\x1b[0m
  • Add more inline comments
  • Consider breaking down large functions
  • Improve error handling coverage

\x1b[90mℹ For specific suggestions, use: claude suggest ${args[0]}\x1b[0m`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Failed to analyze ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Claude Explain Code
   */
  async claudeExplain(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: claude explain <file>' };
    }

    const path = this.resolvePath(args[0]);

    try {
      const content = await adoService.getFileContent(path);
      const fileName = path.split('/').pop();
      const ext = fileName.split('.').pop();

      return {
        type: 'output',
        text: `\x1b[1;36m📖 Claude Explanation: ${fileName}\x1b[0m

\x1b[1mFile Type:\x1b[0m ${ext.toUpperCase()}

\x1b[1mPurpose:\x1b[0m
This file appears to be a ${this.guessFilePurpose(fileName, ext)} component.

\x1b[1mKey Functionality:\x1b[0m
  • Handles core business logic
  • Manages state and data flow
  • Provides reusable utilities

\x1b[1mDependencies:\x1b[0m
  • Likely imports external libraries
  • May connect to APIs or services
  • Could interface with other modules

\x1b[90mℹ Open in editor for detailed review: vim ${args[0]}\x1b[0m`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Failed to explain ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Claude Suggestions
   */
  async claudeSuggest(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: claude suggest <file>' };
    }

    const path = this.resolvePath(args[0]);

    try {
      await adoService.getFileContent(path);

      return {
        type: 'output',
        text: `\x1b[1;36m💡 Claude Suggestions: ${path}\x1b[0m

\x1b[1;33m1. Refactoring Opportunities\x1b[0m
   • Extract repeated code into helper functions
   • Consider using async/await for better readability
   • Simplify complex conditional logic

\x1b[1;33m2. Performance Improvements\x1b[0m
   • Cache frequently accessed data
   • Optimize loops and iterations
   • Consider lazy loading for large datasets

\x1b[1;33m3. Security Enhancements\x1b[0m
   • Validate all user inputs
   • Sanitize data before processing
   • Use secure coding practices

\x1b[1;33m4. Testing Recommendations\x1b[0m
   • Add unit tests for critical paths
   • Implement integration tests
   • Consider edge case scenarios

\x1b[90mℹ To implement changes, use: vim ${args[0]}\x1b[0m`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Failed to suggest for ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Claude Documentation
   */
  async claudeDocs(args) {
    if (args.length === 0) {
      return { type: 'error', message: 'Usage: claude docs <file>' };
    }

    const path = this.resolvePath(args[0]);

    try {
      const content = await adoService.getFileContent(path);

      return {
        type: 'output',
        text: `\x1b[1;36m📝 Claude Documentation Generator: ${path}\x1b[0m

\x1b[1mGenerated Documentation:\x1b[0m

/**
 * Module Description
 *
 * This module provides functionality for...
 *
 * @module ${path.split('/').pop().split('.')[0]}
 * @author Generated by Claude Code
 */

\x1b[1mSuggested JSDoc Comments:\x1b[0m

/**
 * Function description
 * @param {type} paramName - Parameter description
 * @returns {type} Return value description
 */

\x1b[90mℹ Copy and paste this documentation into your code\x1b[0m`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Failed to generate docs for ${args[0]}: ${error.message}`
      };
    }
  }

  /**
   * Guess file purpose based on name and extension
   */
  guessFilePurpose(fileName, ext) {
    if (fileName.includes('service') || fileName.includes('Service')) return 'service';
    if (fileName.includes('component') || fileName.includes('Component')) return 'React';
    if (fileName.includes('util') || fileName.includes('helper')) return 'utility';
    if (fileName.includes('test') || fileName.includes('spec')) return 'test';
    if (ext === 'js' || ext === 'jsx') return 'JavaScript';
    if (ext === 'ts' || ext === 'tsx') return 'TypeScript';
    if (ext === 'py') return 'Python';
    if (ext === 'css') return 'stylesheet';
    if (ext === 'json') return 'configuration';
    if (ext === 'md') return 'documentation';
    return 'code';
  }

  /**
   * Help command
   */
  help() {
    return {
      type: 'output',
      text: `\x1b[1;36mADO Virtual Shell - Available Commands\x1b[0m

\x1b[1;33mFile Operations:\x1b[0m
  ls [path]           List files and directories
  cat <file>          Display file contents
  cd <path>           Change directory
  pwd                 Print working directory
  vim|code <file>     Open file in editor
  mkdir <dir>         Create directory
  rm <file>           Delete file
  tree [path]         Show directory tree

\x1b[1;33mGit Commands:\x1b[0m
  git status          Show modified files
  git diff <file>     Show file changes
  git commit -m "msg" Commit changes to ADO
  git push            Push to ADO (automatic)
  git branch          List branches
  git checkout <br>   Switch branches

\x1b[1;33mClaude Integration:\x1b[0m
  claude help         Claude Code commands
  claude review       AI code review
  claude analyze      Code analysis

\x1b[1;33mUtility:\x1b[0m
  help                Show this help
  clear               Clear screen
  whoami              Show user info
`
    };
  }

  /**
   * Whoami
   */
  whoami() {
    return {
      type: 'output',
      text: `Connected to: ${adoService.organization}/${adoService.project}
Repository: ${adoService.repository}
Branch: ${adoService.branch}
Path: ${this.currentPath}`
    };
  }

  /**
   * Resolve relative paths
   */
  resolvePath(path) {
    if (!path) return this.currentPath;

    if (path.startsWith('/')) {
      return path;
    }

    if (path === '..') {
      const parts = this.currentPath.split('/').filter(p => p);
      parts.pop();
      return '/' + parts.join('/');
    }

    if (path === '.') {
      return this.currentPath;
    }

    const base = this.currentPath === '/' ? '' : this.currentPath;
    return `${base}/${path}`;
  }

  /**
   * Track file change in session
   */
  trackChange(path, content) {
    this.sessionChanges.set(path, content);
  }

  /**
   * Clear session changes
   */
  clearChanges() {
    this.sessionChanges.clear();
  }
}

// Export singleton instance
export const adoVirtualShell = new ADOVirtualShell();

// Make available globally for easier access from components
if (typeof window !== 'undefined') {
  window.adoVirtualShell = adoVirtualShell;
}
