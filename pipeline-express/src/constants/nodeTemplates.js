import {
  Webhook,
  Database,
  Mail,
  Calendar,
  Code,
  Filter,
  MessageSquare,
  Clock,
} from 'lucide-react';

export const NODE_TEMPLATES = [
  {
    type: 'trigger',
    label: 'Neural Link',
    description: 'Trigger on data stream',
    icon: Webhook,
    config: { protocol: 'TCP', port: '8080' },
  },
  {
    type: 'action',
    label: 'Data Matrix',
    description: 'Query the mainframe',
    icon: Database,
    config: { cluster: 'main_db', query: 'SELECT' },
  },
  {
    type: 'action',
    label: 'Comms Link',
    description: 'Send secure message',
    icon: Mail,
    config: { channel: 'encrypted', priority: 'high' },
  },
  {
    type: 'action',
    label: 'Time Sync',
    description: 'Schedule operation',
    icon: Calendar,
    config: { cycle: '0 9 * * *', zone: 'GMT' },
  },
  {
    type: 'action',
    label: 'Code Inject',
    description: 'Execute payload',
    icon: Code,
    config: { runtime: 'node.js', timeout: '30s' },
  },
  {
    type: 'action',
    label: 'Data Filter',
    description: 'Process and filter',
    icon: Filter,
    config: { rule: 'status === "active"' },
  },
  {
    type: 'action',
    label: 'Net Broadcast',
    description: 'Network transmission',
    icon: MessageSquare,
    config: { network: 'darknet', encryption: 'AES' },
  },
  {
    type: 'action',
    label: 'Sleep Mode',
    description: 'Delay execution',
    icon: Clock,
    config: { duration: '5m', mode: 'standby' },
  },
];
