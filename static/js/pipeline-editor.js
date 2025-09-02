// Enhanced Pipeline Editor JavaScript with Smooth Drag & Drop
class PipelineEditor {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
        this.selectedNode = null;
        this.draggedNode = null;
        this.connectionStart = null;
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.nodeIdCounter = 0;
        this.connectionIdCounter = 0;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.animationFrameId = null;
        
        this.canvas = document.getElementById('pipeline-canvas');
        this.nodesContainer = document.getElementById('nodes-container');
        this.connectionsSvg = document.getElementById('connections-svg');
        
        this.initializeEditor();
        this.loadTemplates();
        this.setupDragAndDrop();
    }

    initializeEditor() {
        // Canvas event listeners
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        
        // Prevent default drag behaviors
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Window resize handler
        window.addEventListener('resize', () => this.updateCanvasSize());
        this.updateCanvasSize();
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    setupDragAndDrop() {
        // Enhanced drag and drop with better visual feedback
        const templateItems = document.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleTemplateDragStart(e));
            item.addEventListener('dragend', (e) => this.handleTemplateDragEnd(e));
        });
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/pipeline-templates');
            const templates = await response.json();
            this.renderTemplates(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.renderTemplates(this.getStaticTemplates());
        }
    }

    getStaticTemplates() {
        return [
            {
                id: 'data-source',
                name: 'Data Source',
                description: 'Connect to databases, APIs, or files',
                category: 'data',
                icon: '🗄️',
                inputs: 0,
                outputs: 1,
                config: {
                    type: { type: 'select', options: ['MySQL', 'PostgreSQL', 'MongoDB', 'REST API', 'CSV File'] },
                    connectionString: { type: 'text', placeholder: 'Connection details' }
                }
            },
            {
                id: 'data-transform',
                name: 'Data Transform',
                description: 'Clean, filter, and transform data',
                category: 'processing',
                icon: '⚙️',
                inputs: 1,
                outputs: 1,
                config: {
                    transformation: { type: 'textarea', placeholder: 'Enter transformation logic' },
                    outputFormat: { type: 'select', options: ['JSON', 'CSV', 'Parquet'] }
                }
            },
            {
                id: 'ml-training',
                name: 'ML Training',
                description: 'Train machine learning models',
                category: 'ml',
                icon: '🤖',
                inputs: 1,
                outputs: 2,
                config: {
                    algorithm: { type: 'select', options: ['Random Forest', 'XGBoost', 'Neural Network', 'Linear Regression'] },
                    parameters: { type: 'textarea', placeholder: 'Model parameters (JSON)' }
                }
            },
            {
                id: 'model-validation',
                name: 'Model Validation',
                description: 'Validate and test model performance',
                category: 'ml',
                icon: '✅',
                inputs: 2,
                outputs: 1,
                config: {
                    metrics: { type: 'text', placeholder: 'Validation metrics' },
                    threshold: { type: 'number', placeholder: 'Acceptance threshold' }
                }
            },
            {
                id: 'deployment',
                name: 'Deploy Model',
                description: 'Deploy model to production',
                category: 'deployment',
                icon: '🚀',
                inputs: 1,
                outputs: 1,
                config: {
                    platform: { type: 'select', options: ['Azure ML', 'AWS SageMaker', 'Docker', 'Kubernetes'] },
                    environment: { type: 'select', options: ['Development', 'Staging', 'Production'] }
                }
            },
            {
                id: 'monitoring',
                name: 'Model Monitor',
                description: 'Monitor model performance and drift',
                category: 'monitoring',
                icon: '📊',
                inputs: 1,
                outputs: 1,
                config: {
                    alertThreshold: { type: 'number', placeholder: 'Alert threshold' },
                    dashboardUrl: { type: 'text', placeholder: 'Monitoring dashboard URL' }
                }
            },
            {
                id: 'notification',
                name: 'Notification',
                description: 'Send alerts and notifications',
                category: 'monitoring',
                icon: '📧',
                inputs: 1,
                outputs: 0,
                config: {
                    type: { type: 'select', options: ['Email', 'Slack', 'Teams', 'Webhook'] },
                    recipient: { type: 'text', placeholder: 'Recipient details' }
                }
            },
            {
                id: 'data-validation',
                name: 'Data Validation',
                description: 'Validate data quality and schema',
                category: 'processing',
                icon: '🔍',
                inputs: 1,
                outputs: 2,
                config: {
                    schema: { type: 'textarea', placeholder: 'Expected data schema' },
                    qualityRules: { type: 'textarea', placeholder: 'Data quality rules' }
                }
            }
        ];
    }

    renderTemplates(templates) {
        const templateList = document.getElementById('template-list');
        
        templateList.innerHTML = templates.map(template => `
            <div class="template-item" 
                 draggable="true" 
                 data-template='${JSON.stringify(template)}'
                 ondragstart="editor.handleTemplateDragStart(event)"
                 ondragend="editor.handleTemplateDragEnd(event)">
                <h4>${template.icon} ${template.name}</h4>
                <p>${template.description}</p>
                <div class="template-meta">
                    <span class="template-tag">${template.category}</span>
                    <span class="template-tag">${template.inputs}→${template.outputs}</span>
                </div>
            </div>
        `).join('');
    }

    handleTemplateDragStart(event) {
        const templateData = event.target.dataset.template;
        event.dataTransfer.setData('text/plain', templateData);
        event.target.classList.add('dragging');
        
        // Create ghost image
        const ghost = event.target.cloneNode(true);
        ghost.style.opacity = '0.8';
        ghost.style.transform = 'rotate(5deg) scale(0.9)';
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);
        event.dataTransfer.setDragImage(ghost, 50, 30);
        
        setTimeout(() => {
            document.body.removeChild(ghost);
        }, 100);
    }

    handleTemplateDragEnd(event) {
        event.target.classList.remove('dragging');
    }

    handleDrop(event) {
        event.preventDefault();
        const templateData = JSON.parse(event.dataTransfer.getData('text/plain'));
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.pan.x) / this.zoom;
        const y = (event.clientY - rect.top - this.pan.y) / this.zoom;
        
        // Add smooth drop animation
        this.createNodeWithAnimation(templateData, x, y);
    }

    createNodeWithAnimation(template, x, y) {
        const nodeId = `node-${++this.nodeIdCounter}`;
        
        const node = {
            id: nodeId,
            template: template,
            x: x,
            y: y,
            config: this.getDefaultConfig(template.config)
        };
        
        this.nodes.set(nodeId, node);
        this.renderNode(node);
        
        // Animate node appearance
        const nodeElement = document.getElementById(nodeId);
        nodeElement.style.transform = 'scale(0.1) rotate(180deg)';
        nodeElement.style.opacity = '0';
        
        requestAnimationFrame(() => {
            nodeElement.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            nodeElement.style.transform = 'scale(1) rotate(0deg)';
            nodeElement.style.opacity = '1';
        });
        
        this.updateStats();
    }

    getDefaultConfig(configSchema) {
        const config = {};
        for (const [key, field] of Object.entries(configSchema || {})) {
            config[key] = field.default || '';
        }
        return config;
    }

    renderNode(node) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'pipeline-node';
        nodeElement.id = node.id;
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;
        
        // Create input and output port elements
        const inputPorts = Array.from({length: node.template.inputs}, (_, i) => 
            `<div class="port input" data-port="input-${i}" data-node="${node.id}">
                <div class="port-connector"></div>
                <div class="port-label">Input ${i + 1}</div>
            </div>`
        ).join('');
        
        const outputPorts = Array.from({length: node.template.outputs}, (_, i) => 
            `<div class="port output" data-port="output-${i}" data-node="${node.id}">
                <div class="port-connector">
                    <div class="port-plus">+</div>
                </div>
                <div class="port-label">Output ${i + 1}</div>
            </div>`
        ).join('');
        
        nodeElement.innerHTML = `
            <div class="node-header">
                <span class="node-icon">${node.template.icon}</span>
                <span class="node-title">${node.template.name}</span>
                <div class="node-controls">
                    <button class="node-control-btn" onclick="editor.duplicateNode('${node.id}')" title="Duplicate">
                        📋
                    </button>
                    <button class="node-control-btn delete" onclick="editor.deleteNode('${node.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="node-description">${node.template.description}</div>
            <div class="node-ports">
                <div class="input-ports">
                    ${inputPorts}
                </div>
                <div class="output-ports">
                    ${outputPorts}
                </div>
            </div>
        `;
        
        // Add event listeners
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        });
        
        nodeElement.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.port') && !e.target.closest('.node-control-btn')) {
                this.startNodeDrag(e, node.id);
            }
        });
        
        // Port event listeners
        nodeElement.querySelectorAll('.port').forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startConnection(e, port);
            });
            
            port.addEventListener('mouseenter', () => {
                port.classList.add('port-hover');
            });
            
            port.addEventListener('mouseleave', () => {
                port.classList.remove('port-hover');
            });
        });
        
        this.nodesContainer.appendChild(nodeElement);
    }

    selectNode(nodeId) {
        // Deselect previous node
        document.querySelectorAll('.pipeline-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        // Select new node
        const nodeElement = document.getElementById(nodeId);
        nodeElement.classList.add('selected');
        
        this.selectedNode = nodeId;
        this.showNodeProperties(this.nodes.get(nodeId));
    }

    showNodeProperties(node) {
        const propertiesContent = document.getElementById('properties-content');
        
        if (!node) {
            propertiesContent.innerHTML = '<div class="no-selection"><p>Select a node to edit its properties</p></div>';
            return;
        }
        
        const configFields = Object.entries(node.template.config || {}).map(([key, field]) => {
            const value = node.config[key] || '';
            
            let inputHtml = '';
            switch (field.type) {
                case 'select':
                    inputHtml = `
                        <select onchange="editor.updateNodeConfig('${node.id}', '${key}', this.value)">
                            ${field.options.map(option => 
                                `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
                            ).join('')}
                        </select>
                    `;
                    break;
                case 'textarea':
                    inputHtml = `
                        <textarea placeholder="${field.placeholder || ''}" 
                                  onchange="editor.updateNodeConfig('${node.id}', '${key}', this.value)">${value}</textarea>
                    `;
                    break;
                case 'number':
                    inputHtml = `
                        <input type="number" placeholder="${field.placeholder || ''}" value="${value}"
                               onchange="editor.updateNodeConfig('${node.id}', '${key}', this.value)">
                    `;
                    break;
                default:
                    inputHtml = `
                        <input type="text" placeholder="${field.placeholder || ''}" value="${value}"
                               onchange="editor.updateNodeConfig('${node.id}', '${key}', this.value)">
                    `;
            }
            
            return `
                <div class="property-field">
                    <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');
        
        propertiesContent.innerHTML = `
            <div class="property-group">
                <h4>${node.template.icon} ${node.template.name}</h4>
                <p style="color: rgba(232, 245, 232, 0.7); font-size: 0.8rem; margin-bottom: 1rem;">
                    ${node.template.description}
                </p>
            </div>
            
            <div class="property-group">
                <h4>Configuration</h4>
                ${configFields}
            </div>
            
            <div class="property-group">
                <h4>Actions</h4>
                <button class="btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" 
                        onclick="editor.duplicateNode('${node.id}')">📋 Duplicate</button>
                <button class="btn-secondary" style="width: 100%; background: rgba(255, 0, 0, 0.2);" 
                        onclick="editor.deleteNode('${node.id}')">🗑️ Delete</button>
            </div>
        `;
    }

    updateNodeConfig(nodeId, key, value) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.config[key] = value;
        }
    }

    handleCanvasMouseDown(event) {
        if (event.target.closest('.pipeline-node')) return;
        
        // Start canvas pan
        this.isPanning = true;
        this.panStart = {
            x: event.clientX - this.pan.x,
            y: event.clientY - this.pan.y
        };
    }

    handleCanvasMouseMove(event) {
        if (this.isPanning) {
            this.pan.x = event.clientX - this.panStart.x;
            this.pan.y = event.clientY - this.panStart.y;
            this.applyTransform();
        }
        
        if (this.connectionStart && !this.isDragging) {
            this.drawTempConnection(event);
        }
    }

    handleCanvasMouseUp(event) {
        this.isPanning = false;
        this.cancelConnection();
    }

    startNodeDrag(event, nodeId) {
        this.isDragging = true;
        this.draggedNode = nodeId;
        const nodeElement = document.getElementById(nodeId);
        
        const rect = nodeElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        this.dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        nodeElement.classList.add('dragging');
        nodeElement.style.zIndex = '1000';
        
        document.addEventListener('mousemove', this.handleNodeDragMove.bind(this));
        document.addEventListener('mouseup', this.endNodeDrag.bind(this));
        
        event.preventDefault();
    }

    handleNodeDragMove(event) {
        if (!this.isDragging || !this.draggedNode) return;
        
        const nodeElement = document.getElementById(this.draggedNode);
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = (event.clientX - canvasRect.left - this.dragOffset.x - this.pan.x) / this.zoom;
        const y = (event.clientY - canvasRect.top - this.dragOffset.y - this.pan.y) / this.zoom;
        
        // Smooth movement with requestAnimationFrame
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(() => {
                nodeElement.style.left = `${x}px`;
                nodeElement.style.top = `${y}px`;
                
                // Update node data
                const node = this.nodes.get(this.draggedNode);
                node.x = x;
                node.y = y;
                
                // Update connections smoothly
                this.updateConnections();
                this.animationFrameId = null;
            });
        }
    }

    endNodeDrag(event) {
        if (this.draggedNode) {
            const nodeElement = document.getElementById(this.draggedNode);
            nodeElement.classList.remove('dragging');
            nodeElement.style.zIndex = '';
            
            // Add snap-back animation if needed
            nodeElement.style.transition = 'transform 0.2s ease-out';
            nodeElement.style.transform = 'scale(1)';
            
            setTimeout(() => {
                nodeElement.style.transition = '';
                nodeElement.style.transform = '';
            }, 200);
        }
        
        this.isDragging = false;
        this.draggedNode = null;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        document.removeEventListener('mousemove', this.handleNodeDragMove.bind(this));
        document.removeEventListener('mouseup', this.endNodeDrag.bind(this));
    }

    startConnection(event, port) {
        event.stopPropagation();
        
        this.connectionStart = {
            node: port.dataset.node,
            port: port.dataset.port,
            element: port,
            type: port.classList.contains('output') ? 'output' : 'input'
        };
        
        port.classList.add('connecting');
        
        // Add connection mode to canvas
        this.canvas.classList.add('connection-mode');
        
        document.addEventListener('mousemove', this.drawTempConnection.bind(this));
        document.addEventListener('mouseup', this.endConnectionAttempt.bind(this));
        
        // Add port hover detection for all ports
        document.querySelectorAll('.port').forEach(p => {
            p.addEventListener('mouseenter', this.handlePortHover.bind(this));
            p.addEventListener('mouseleave', this.handlePortLeave.bind(this));
        });
    }

    handlePortHover(event) {
        if (!this.connectionStart) return;
        
        const port = event.target.closest('.port');
        if (!port) return;
        
        const endPort = {
            node: port.dataset.node,
            port: port.dataset.port,
            type: port.classList.contains('output') ? 'output' : 'input'
        };
        
        if (this.canConnect(this.connectionStart, endPort)) {
            port.classList.add('can-connect');
        } else {
            port.classList.add('cannot-connect');
        }
    }

    handlePortLeave(event) {
        const port = event.target.closest('.port');
        if (port) {
            port.classList.remove('can-connect', 'cannot-connect');
        }
    }

    endConnectionAttempt(event) {
        const targetPort = event.target.closest('.port');
        
        if (targetPort && this.connectionStart) {
            const endPort = {
                node: targetPort.dataset.node,
                port: targetPort.dataset.port,
                type: targetPort.classList.contains('output') ? 'output' : 'input'
            };
            
            if (this.canConnect(this.connectionStart, endPort)) {
                this.createConnectionWithAnimation(this.connectionStart, endPort);
            }
        }
        
        this.cancelConnection();
    }

    canConnect(startPort, endPort) {
        if (startPort.node === endPort.node) return false;
        if (startPort.type === endPort.type) return false;
        
        const connectionKey = this.getConnectionKey(startPort, endPort);
        return !this.connections.has(connectionKey);
    }

    getConnectionKey(port1, port2) {
        const [output, input] = port1.type === 'output' ? [port1, port2] : [port2, port1];
        return `${output.node}:${output.port}->${input.node}:${input.port}`;
    }

    createConnectionWithAnimation(startPort, endPort) {
        const connectionId = `connection-${++this.connectionIdCounter}`;
        const [output, input] = startPort.type === 'output' ? [startPort, endPort] : [endPort, startPort];
        
        const connection = {
            id: connectionId,
            output: output,
            input: input
        };
        
        const connectionKey = this.getConnectionKey(startPort, endPort);
        this.connections.set(connectionKey, connection);
        
        this.renderConnectionWithAnimation(connection);
        this.updateStats();
    }

    renderConnectionWithAnimation(connection) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.classList.add('connection-line');
        line.setAttribute('id', connection.id);
        
        // Add click handler for connection deletion
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this connection?')) {
                this.deleteConnection(connection);
            }
        });
        
        this.connectionsSvg.appendChild(line);
        
        // Animate connection appearance
        line.style.strokeDasharray = '1000';
        line.style.strokeDashoffset = '1000';
        
        this.updateConnectionPath(connection);
        
        requestAnimationFrame(() => {
            line.style.transition = 'stroke-dashoffset 0.6s ease-out';
            line.style.strokeDashoffset = '0';
            
            setTimeout(() => {
                line.style.strokeDasharray = '';
                line.style.transition = '';
            }, 600);
        });
    }

    updateConnectionPath(connection) {
        const line = document.getElementById(connection.id);
        if (!line) return;
        
        const outputElement = document.querySelector(
            `[data-node="${connection.output.node}"][data-port="${connection.output.port}"]`
        );
        const inputElement = document.querySelector(
            `[data-node="${connection.input.node}"][data-port="${connection.input.port}"]`
        );
        
        if (!outputElement || !inputElement) return;
        
        const outputRect = outputElement.getBoundingClientRect();
        const inputRect = inputElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const start = {
            x: outputRect.left - canvasRect.left + outputRect.width / 2,
            y: outputRect.top - canvasRect.top + outputRect.height / 2
        };
        
        const end = {
            x: inputRect.left - canvasRect.left + inputRect.width / 2,
            y: inputRect.top - canvasRect.top + inputRect.height / 2
        };
        
        // Enhanced curved path with better control points
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const controlOffset = Math.max(Math.abs(dx) * 0.6, 100);
        
        const cp1x = start.x + controlOffset;
        const cp1y = start.y;
        const cp2x = end.x - controlOffset;
        const cp2y = end.y;
        
        const path = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
        line.setAttribute('d', path);
    }

    updateConnections() {
        this.connections.forEach(connection => {
            this.updateConnectionPath(connection);
        });
    }

    drawTempConnection(event) {
        if (!this.connectionStart) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const startElement = this.connectionStart.element;
        const startRect = startElement.getBoundingClientRect();
        
        const start = {
            x: startRect.left - canvasRect.left + startRect.width / 2,
            y: startRect.top - canvasRect.top + startRect.height / 2
        };
        
        const end = {
            x: event.clientX - canvasRect.left,
            y: event.clientY - canvasRect.top
        };
        
        let existingTemp = document.getElementById('temp-connection');
        if (!existingTemp) {
            existingTemp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            existingTemp.classList.add('connection-line', 'temp');
            existingTemp.setAttribute('id', 'temp-connection');
            this.connectionsSvg.appendChild(existingTemp);
        }
        
        const dx = end.x - start.x;
        const controlOffset = Math.max(Math.abs(dx) * 0.6, 100);
        const cp1x = start.x + controlOffset;
        const cp2x = end.x - controlOffset;
        
        const path = `M ${start.x} ${start.y} C ${cp1x} ${start.y}, ${cp2x} ${end.y}, ${end.x} ${end.y}`;
        existingTemp.setAttribute('d', path);
    }

    cancelConnection() {
        if (this.connectionStart) {
            this.connectionStart.element.classList.remove('connecting');
        }
        
        this.connectionStart = null;
        this.canvas.classList.remove('connection-mode');
        
        // Remove temp line
        const tempLine = document.getElementById('temp-connection');
        if (tempLine) tempLine.remove();
        
        // Clean up port states
        document.querySelectorAll('.port').forEach(port => {
            port.classList.remove('can-connect', 'cannot-connect', 'port-hover');
            port.removeEventListener('mouseenter', this.handlePortHover.bind(this));
            port.removeEventListener('mouseleave', this.handlePortLeave.bind(this));
        });
        
        document.removeEventListener('mousemove', this.drawTempConnection.bind(this));
        document.removeEventListener('mouseup', this.endConnectionAttempt.bind(this));
    }

    deleteConnection(connection) {
        const connectionKey = this.getConnectionKey(connection.output, connection.input);
        this.connections.delete(connectionKey);
        
        const lineElement = document.getElementById(connection.id);
        if (lineElement) {
            lineElement.style.transition = 'opacity 0.3s ease-out';
            lineElement.style.opacity = '0';
            setTimeout(() => lineElement.remove(), 300);
        }
        
        this.updateStats();
    }

    handleCanvasClick(event) {
        if (event.target === this.canvas || event.target === this.nodesContainer) {
            this.deselectAll();
        }
    }

    deselectAll() {
        document.querySelectorAll('.pipeline-node').forEach(node => {
            node.classList.remove('selected');
        });
        this.selectedNode = null;
        this.showNodeProperties(null);
    }

    duplicateNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        const newNode = {
            ...node,
            x: node.x + 50,
            y: node.y + 50,
            config: { ...node.config }
        };
        
        this.createNodeWithAnimation(newNode.template, newNode.x, newNode.y);
    }

    deleteNode(nodeId) {
        if (!confirm('Are you sure you want to delete this node?')) return;
        
        const nodeElement = document.getElementById(nodeId);
        
        // Animate node deletion
        nodeElement.style.transition = 'all 0.3s ease-out';
        nodeElement.style.transform = 'scale(0) rotate(180deg)';
        nodeElement.style.opacity = '0';
        
        // Remove connections involving this node
        const connectionsToRemove = [];
        this.connections.forEach((connection, key) => {
            if (connection.output.node === nodeId || connection.input.node === nodeId) {
                connectionsToRemove.push(key);
            }
        });
        
        connectionsToRemove.forEach(key => {
            const connection = this.connections.get(key);
            this.deleteConnection(connection);
        });
        
        // Remove node after animation
        setTimeout(() => {
            if (nodeElement && nodeElement.parentNode) {
                nodeElement.remove();
            }
            this.nodes.delete(nodeId);
            
            if (this.selectedNode === nodeId) {
                this.selectedNode = null;
                this.showNodeProperties(null);
            }
            
            this.updateStats();
        }, 300);
    }

    updateStats() {
        document.getElementById('node-count').textContent = `${this.nodes.size} nodes`;
        document.getElementById('connection-count').textContent = `${this.connections.size} connections`;
    }

    updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        this.connectionsSvg.setAttribute('width', rect.width);
        this.connectionsSvg.setAttribute('height', rect.height);
        this.updateConnections();
    }

    // Touch event handlers for mobile support
    handleTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleCanvasMouseDown(mouseEvent);
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleCanvasMouseMove(mouseEvent);
        }
    }

    handleTouchEnd(event) {
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleCanvasMouseUp(mouseEvent);
    }

    // Zoom and Pan functions
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3);
        this.applyTransform();
        this.updateConnections();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.3);
        this.applyTransform();
        this.updateConnections();
    }

    resetZoom() {
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.applyTransform();
        this.updateConnections();
    }

    applyTransform() {
        const transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
        this.nodesContainer.style.transform = transform;
        this.connectionsSvg.style.transform = transform;
    }

    // Template filtering
    filterTemplates(searchTerm) {
        const templateItems = document.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            const description = item.querySelector('p').textContent.toLowerCase();
            const matches = name.includes(searchTerm.toLowerCase()) || 
                          description.includes(searchTerm.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    }

    filterByCategory(category) {
        // Update active category
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Filter templates
        const templateItems = document.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            const templateData = JSON.parse(item.dataset.template);
            const matches = category === 'all' || templateData.category === category;
            item.style.display = matches ? 'block' : 'none';
        });
    }

    // Save and Deploy functions
    async savePipeline() {
        const pipelineData = {
            nodes: Array.from(this.nodes.values()),
            connections: Array.from(this.connections.values())
        };
        
        try {
            const response = await fetch('/api/pipeline-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pipelineData)
            });
            
            if (response.ok) {
                this.showNotification('Pipeline saved successfully!', 'success');
            } else {
                throw new Error('Failed to save pipeline');
            }
        } catch (error) {
            console.error('Error saving pipeline:', error);
            this.showNotification('Error saving pipeline. Please try again.', 'error');
        }
    }

    async deployPipeline() {
        if (this.nodes.size === 0) {
            this.showNotification('Please add at least one node before deploying.', 'warning');
            return;
        }
        
        if (confirm('Deploy this pipeline to Azure DevOps?')) {
            try {
                const pipelineData = {
                    nodes: Array.from(this.nodes.values()),
                    connections: Array.from(this.connections.values())
                };
                
                const response = await fetch('/api/pipeline-deploy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pipelineData)
                });
                
                if (response.ok) {
                    this.showNotification('Pipeline deployed successfully!', 'success');
                } else {
                    throw new Error('Failed to deploy pipeline');
                }
            } catch (error) {
                console.error('Error deploying pipeline:', error);
                this.showNotification('Error deploying pipeline. Please try again.', 'error');
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Load existing pipeline
    async loadPipeline(pipelineId) {
        try {
            const response = await fetch(`/api/pipeline/${pipelineId}`);
            const pipelineData = await response.json();
            
            // Clear existing
            this.nodes.clear();
            this.connections.clear();
            this.nodesContainer.innerHTML = '';
            this.connectionsSvg.innerHTML = '';
            
            // Load nodes with staggered animation
            pipelineData.nodes.forEach((nodeData, index) => {
                setTimeout(() => {
                    this.nodes.set(nodeData.id, nodeData);
                    this.renderNode(nodeData);
                    
                    const nodeElement = document.getElementById(nodeData.id);
                    nodeElement.style.transform = 'scale(0)';
                    nodeElement.style.opacity = '0';
                    
                    requestAnimationFrame(() => {
                        nodeElement.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        nodeElement.style.transform = 'scale(1)';
                        nodeElement.style.opacity = '1';
                    });
                }, index * 100);
            });
            
            // Load connections after nodes
            setTimeout(() => {
                pipelineData.connections.forEach((connectionData, index) => {
                    setTimeout(() => {
                        const key = this.getConnectionKey(connectionData.output, connectionData.input);
                        this.connections.set(key, connectionData);
                        this.renderConnectionWithAnimation(connectionData);
                    }, index * 200);
                });
            }, pipelineData.nodes.length * 100 + 500);
            
            this.updateStats();
        } catch (error) {
            console.error('Error loading pipeline:', error);
            this.showNotification('Error loading pipeline.', 'error');
        }
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 's':
                        event.preventDefault();
                        this.savePipeline();
                        break;
                    case 'd':
                        event.preventDefault();
                        if (this.selectedNode) {
                            this.duplicateNode(this.selectedNode);
                        }
                        break;
                    case 'a':
                        event.preventDefault();
                        this.selectAllNodes();
                        break;
                }
            } else {
                switch (event.key) {
                    case 'Delete':
                    case 'Backspace':
                        if (this.selectedNode) {
                            this.deleteNode(this.selectedNode);
                        }
                        break;
                    case 'Escape':
                        this.deselectAll();
                        this.cancelConnection();
                        break;
                }
            }
        });
    }

    selectAllNodes() {
        document.querySelectorAll('.pipeline-node').forEach(node => {
            node.classList.add('selected');
        });
    }
}

// Global functions for template usage
function filterTemplates(searchTerm) {
    editor.filterTemplates(searchTerm);
}

function filterByCategory(category) {
    editor.filterByCategory(category);
}

function zoomIn() {
    editor.zoomIn();
}

function zoomOut() {
    editor.zoomOut();
}

function resetZoom() {
    editor.resetZoom();
}

function savePipeline() {
    editor.savePipeline();
}

function deployPipeline() {
    editor.deployPipeline();
}

// Initialize editor when page loads
let editor;
document.addEventListener('DOMContentLoaded', function() {
    editor = new PipelineEditor();
    editor.setupKeyboardShortcuts();
    
    // Load existing pipeline if editing
    const urlParams = new URLSearchParams(window.location.search);
    const pipelineId = urlParams.get('id');
    if (pipelineId) {
        editor.loadPipeline(pipelineId);
    }
});