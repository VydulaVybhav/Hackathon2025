from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this in production

# In-memory storage for demo purposes
# In production, you'd use a proper database
pipelines = [
    {
        'id': 1,
        'name': 'ML Model Training Pipeline',
        'description': 'Automated training pipeline for machine learning models',
        'status': 'active',
        'template': 'MLOps Training',
        'created_at': '2024-01-15'
    },
    {
        'id': 2,
        'name': 'Data Processing Pipeline',
        'description': 'ETL pipeline for data warehouse operations',
        'status': 'inactive',
        'template': 'Data Engineering',
        'created_at': '2024-01-10'
    },
    {
        'id': 3,
        'name': 'CI/CD Deployment Pipeline',
        'description': 'Continuous integration and deployment pipeline',
        'status': 'active',
        'template': 'DevOps CI/CD',
        'created_at': '2024-01-08'
    }
]

templates_data = [
    {
        'name': 'MLOps Training',
        'description': 'Machine learning model training and validation'
    },
    {
        'name': 'Data Engineering',
        'description': 'ETL and data processing workflows'
    },
    {
        'name': 'DevOps CI/CD',
        'description': 'Continuous integration and deployment'
    },
    {
        'name': 'API Testing',
        'description': 'Automated API testing and validation'
    },
    {
        'name': 'Security Scanning',
        'description': 'Security vulnerability scanning'
    }
]

@app.route('/')
def index():
    """Main landing page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard page showing all pipelines"""
    return render_template('dashboard.html', pipelines=pipelines)

@app.route('/api/pipelines')
def api_pipelines():
    """API endpoint to get all pipelines"""
    return jsonify(pipelines)

@app.route('/api/pipelines', methods=['POST'])
def create_pipeline():
    """API endpoint to create a new pipeline"""
    data = request.get_json()
    
    # Generate new ID
    new_id = max([p['id'] for p in pipelines]) + 1 if pipelines else 1
    
    new_pipeline = {
        'id': new_id,
        'name': data.get('name', ''),
        'description': data.get('description', ''),
        'status': 'inactive',
        'template': data.get('template', ''),
        'created_at': datetime.now().strftime('%Y-%m-%d')
    }
    
    pipelines.append(new_pipeline)
    
    return jsonify({
        'success': True,
        'pipeline': new_pipeline
    })

@app.route('/api/pipelines/<int:pipeline_id>', methods=['DELETE'])
def delete_pipeline(pipeline_id):
    """API endpoint to delete a pipeline"""
    global pipelines
    pipelines = [p for p in pipelines if p['id'] != pipeline_id]
    
    return jsonify({'success': True})

@app.route('/api/pipelines/<int:pipeline_id>/deploy', methods=['POST'])
def deploy_pipeline(pipeline_id):
    """API endpoint to deploy a pipeline"""
    for pipeline in pipelines:
        if pipeline['id'] == pipeline_id:
            pipeline['status'] = 'active'
            break
    
    return jsonify({'success': True})

@app.route('/api/templates')
def api_templates():
    """API endpoint to get all templates"""
    return jsonify(templates_data)

@app.route('/editor')
@app.route('/editor/<pipeline_name>')
def pipeline_editor(pipeline_name=None):
    """Pipeline visual editor page"""
    return render_template('editor.html', pipeline_name=pipeline_name)

@app.route('/api/pipeline-templates')
def api_pipeline_templates():
    """API endpoint to get pipeline node templates"""
    templates = [
        {
            'id': 'data-source',
            'name': 'Data Source',
            'description': 'Connect to databases, APIs, or files',
            'category': 'data',
            'icon': '🗄️',
            'inputs': 0,
            'outputs': 1,
            'config': {
                'type': {'type': 'select', 'options': ['MySQL', 'PostgreSQL', 'MongoDB', 'REST API', 'CSV File']},
                'connectionString': {'type': 'text', 'placeholder': 'Connection details'}
            }
        },
        {
            'id': 'data-transform',
            'name': 'Data Transform',
            'description': 'Clean, filter, and transform data',
            'category': 'processing',
            'icon': '⚙️',
            'inputs': 1,
            'outputs': 1,
            'config': {
                'transformation': {'type': 'textarea', 'placeholder': 'Enter transformation logic'},
                'outputFormat': {'type': 'select', 'options': ['JSON', 'CSV', 'Parquet']}
            }
        },
        {
            'id': 'ml-training',
            'name': 'ML Training',
            'description': 'Train machine learning models',
            'category': 'ml',
            'icon': '🤖',
            'inputs': 1,
            'outputs': 2,
            'config': {
                'algorithm': {'type': 'select', 'options': ['Random Forest', 'XGBoost', 'Neural Network', 'Linear Regression']},
                'parameters': {'type': 'textarea', 'placeholder': 'Model parameters (JSON)'}
            }
        },
        {
            'id': 'model-validation',
            'name': 'Model Validation',
            'description': 'Validate and test model performance',
            'category': 'ml',
            'icon': '✅',
            'inputs': 2,
            'outputs': 1,
            'config': {
                'metrics': {'type': 'text', 'placeholder': 'Validation metrics'},
                'threshold': {'type': 'number', 'placeholder': 'Acceptance threshold'}
            }
        },
        {
            'id': 'deployment',
            'name': 'Deploy Model',
            'description': 'Deploy model to production',
            'category': 'deployment',
            'icon': '🚀',
            'inputs': 1,
            'outputs': 1,
            'config': {
                'platform': {'type': 'select', 'options': ['Azure ML', 'AWS SageMaker', 'Docker', 'Kubernetes']},
                'environment': {'type': 'select', 'options': ['Development', 'Staging', 'Production']}
            }
        },
        {
            'id': 'monitoring',
            'name': 'Model Monitor',
            'description': 'Monitor model performance and drift',
            'category': 'monitoring',
            'icon': '📊',
            'inputs': 1,
            'outputs': 1,
            'config': {
                'alertThreshold': {'type': 'number', 'placeholder': 'Alert threshold'},
                'dashboardUrl': {'type': 'text', 'placeholder': 'Monitoring dashboard URL'}
            }
        },
        {
            'id': 'notification',
            'name': 'Notification',
            'description': 'Send alerts and notifications',
            'category': 'monitoring',
            'icon': '📧',
            'inputs': 1,
            'outputs': 0,
            'config': {
                'type': {'type': 'select', 'options': ['Email', 'Slack', 'Teams', 'Webhook']},
                'recipient': {'type': 'text', 'placeholder': 'Recipient details'}
            }
        },
        {
            'id': 'data-validation',
            'name': 'Data Validation',
            'description': 'Validate data quality and schema',
            'category': 'processing',
            'icon': '🔍',
            'inputs': 1,
            'outputs': 2,
            'config': {
                'schema': {'type': 'textarea', 'placeholder': 'Expected data schema'},
                'qualityRules': {'type': 'textarea', 'placeholder': 'Data quality rules'}
            }
        }
    ]
    return jsonify(templates)

@app.route('/api/pipeline-save', methods=['POST'])
def save_pipeline_design():
    """API endpoint to save pipeline design"""
    data = request.get_json()
    
    # In production, you'd save to database
    # For now, we'll just return success
    print("Saving pipeline design:", data)
    
    return jsonify({'success': True, 'message': 'Pipeline saved successfully'})

@app.route('/api/pipeline-deploy', methods=['POST'])
def deploy_pipeline_design():
    """API endpoint to deploy pipeline design"""
    data = request.get_json()
    
    # In production, you'd convert the visual design to actual pipeline code
    # and deploy to Azure DevOps
    print("Deploying pipeline design:", data)
    
    return jsonify({'success': True, 'message': 'Pipeline deployed successfully'})

@app.route('/api/pipeline/<int:pipeline_id>')
def get_pipeline_design(pipeline_id):
    """API endpoint to get pipeline design for editing"""
    # In production, you'd load from database
    # For now, return empty design
    return jsonify({
        'nodes': [],
        'connections': []
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)