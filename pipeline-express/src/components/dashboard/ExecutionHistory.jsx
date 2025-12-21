import React from 'react';
import { History, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardCard from './DashboardCard';
import './ExecutionHistory.css';

function ExecutionHistory() {
  // Placeholder data - in a real app, this would come from an API or state management
  const executions = [];

  if (executions.length === 0) {
    return (
      <DashboardCard title="Execution History" icon={History}>
        <div className="execution-history-empty">
          <History size={48} className="empty-icon" />
          <p>No workflow executions yet</p>
          <p className="empty-subtitle">
            Execute a workflow to see its history here
          </p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Execution History" icon={History}>
      <div className="execution-history-list">
        {executions.map((execution, index) => (
          <div key={index} className={`execution-item ${execution.status}`}>
            <div className="execution-status-icon">
              {execution.status === 'success' && <CheckCircle size={20} />}
              {execution.status === 'failed' && <XCircle size={20} />}
              {execution.status === 'running' && <Clock size={20} />}
            </div>
            <div className="execution-info">
              <div className="execution-name">{execution.workflowName}</div>
              <div className="execution-time">{execution.timestamp}</div>
            </div>
            <div className={`execution-badge ${execution.status}`}>
              {execution.status}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default ExecutionHistory;
