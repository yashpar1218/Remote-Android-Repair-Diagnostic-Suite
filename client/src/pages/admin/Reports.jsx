import { useEffect, useMemo, useState } from 'react';
import {
  Activity,  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,  Printer,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Database
} from 'lucide-react';

const REPORTS_API = 'http://localhost:5000/api/reports';

const reportConfigs = [
  { id: 'payments', name: 'Payments Report', icon: FileSpreadsheet, color: 'emerald' },
  { id: 'device-status', name: 'Device Status Report', icon: Smartphone, color: 'blue' },
  { id: 'repair-summary', name: 'Repair Summary Report', icon: Wrench, color: 'green' },
  { id: 'technician-performance', name: 'Technician Performance', icon: Users, color: 'purple' },
  { id: 'customer-satisfaction', name: 'Customer Satisfaction', icon: Star, color: 'yellow' },
  { id: 'audit-log', name: 'Audit Log Report', icon: FileText, color: 'red' },
  { id: 'firmware-usage', name: 'Firmware Usage Report', icon: Database, color: 'cyan' },
  { id: 'device-health', name: 'Device Health Report', icon: Activity, color: 'orange' },
  { id: 'user-activity', name: 'User Activity Report', icon: TrendingUp, color: 'pink' },
  { id: 'pending-repairs', name: 'Pending Repairs', icon: Clock, color: 'amber' },
  { id: 'completed-repairs', name: 'Completed Repairs', icon: CheckCircle, color: 'emerald' }
];

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500'
};

const prettifyKey = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

function getGeneratedBy() {
  try {
    const raw = sessionStorage.getItem('rads_user');
    const u = raw ? JSON.parse(raw) : null;
    return u?.name || u?.email || '-';
  } catch {
    return '-';
  }
}

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toLocaleString();
  return JSON.stringify(value);
};

const flattenObject = (source, parentKey = '') =>
  Object.entries(source || {}).reduce((acc, [key, value]) => {
    const nextKey = parentKey ? `${parentKey} ${prettifyKey(key)}` : prettifyKey(key);

    if (Array.isArray(value)) {
      acc[nextKey] = value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item)).join(', ');
      return acc;
    }

    if (value && typeof value === 'object') {
      return { ...acc, ...flattenObject(value, nextKey) };
    }

    acc[nextKey] = value;
    return acc;
  }, {});

const makeMetricRows = (source, label = 'Metric') =>
  Object.entries(flattenObject(source)).map(([metric, value]) => ({
    [label]: metric,
    Value: formatValue(value)
  }));

const makeDistributionRows = (groupedData, label) =>
  Object.entries(groupedData || {}).map(([name, count]) => ({
    [label]: name,
    Count: count
  }));

function buildReportTable(reportId, data) {
  if (!data) {
    return { columns: [], rows: [], caption: 'No data available' };
  }

  switch (reportId) {
    case 'technician-performance': {
      const technicianRows = Array.isArray(data)
        ? data
        : Array.isArray(data?.technicians)
          ? data.technicians
          : [];

      return {
        caption: 'Technician productivity summary',
        columns: ['Name', 'Email', 'Total Repairs', 'Completed Repairs', 'Completion Rate'],
        rows: technicianRows.map((tech) => ({
          Name: tech.name || '-',
          Email: tech.email || '-',
          'Total Repairs': tech.totalRepairs ?? 0,
          'Completed Repairs': tech.completedRepairs ?? 0,
          'Completion Rate': String(tech.completionRate ?? 0) + '%'
        }))
      };
    }

    case 'audit-log':
      return data.logs?.length
        ? {
            caption: 'Recent audit activity',
            columns: ['Timestamp', 'User', 'Action', 'Target', 'Command', 'IP', 'Status'],
            rows: data.logs.map((log) => ({
              Timestamp: formatValue(log.timestamp ? new Date(log.timestamp) : ''),
              User: log.user || '-',
              Action: log.action || '-',
              Target: log.target || '-',
              Command: log.command || '-',
              IP: log.ip || '-',
              Status: log.status || '-'
            }))
          }
        : {
            caption: 'Audit action totals',
            columns: ['Action', 'Count'],
            rows: makeDistributionRows(data.actionCounts, 'Action')
          };

    case 'customer-satisfaction':
      return {
        caption: 'Customer feedback metrics',
        columns: ['Metric', 'Value'],
        rows: [
          ...makeMetricRows({
            totalFeedbacks: data.totalFeedbacks,
            averageRating: data.averageRating,
            satisfactionRate: `${data.satisfactionRate ?? 0}%`
          }),
          ...makeDistributionRows(data.ratings, 'Metric').map((row) => ({ Metric: row.Metric, Value: row.Count }))
        ]
      };

    case 'device-health':
      return data.recentLogs?.length
        ? {
            caption: 'Persistent device health diagnostics',
            columns: ['Captured At', 'Device', 'Ticket', 'Battery', 'Storage', 'RAM', 'CPU', 'Temperature'],
            rows: data.recentLogs.map((log) => ({
              'Captured At': formatValue(log.created_at ? new Date(log.created_at) : ''),
              Device: log.device_id || '-',
              Ticket: log.ticket_id || '-',
              Battery: log.battery_health_label || '-',
              Storage: `${log.storage_used_label || '-'} / ${log.storage_total_label || '-'} (${log.storage_usage_percent ?? 0}%)`,
              RAM: `${log.ram_used_label || '-'} / ${log.ram_total_label || '-'} (${log.ram_usage_percent ?? 0}%)`,
              CPU: log.cpu_usage_label || '-',
              Temperature: log.device_temperature_label || log.battery_temperature_label || '-'
            }))
          }
        : {
            caption: 'Persistent device health diagnostics',
            columns: ['Metric', 'Value'],
            rows: makeMetricRows(data)
          };

    case 'firmware-usage':
      return {
        caption: 'Firmware inventory and usage',
        columns: ['Category', 'Name', 'Count'],
        rows: [
          { Category: 'Overview', Name: 'Total Firmware', Count: data.total ?? 0 },
          { Category: 'Overview', Name: 'Total Size (MB)', Count: data.totalSize ? (data.totalSize / 1024 / 1024).toFixed(2) : '0.00' },
          ...makeDistributionRows(data.byBrand, 'Name').map((row) => ({ Category: 'Brand', ...row })),
          ...makeDistributionRows(data.byStatus, 'Name').map((row) => ({ Category: 'Status', ...row }))
        ]
      };

    case 'pending-repairs':
      return data.repairs?.length
        ? {
            caption: 'Pending and in-progress repairs',
            columns: ['Created At', 'Status', 'Issue', 'Device', 'Customer', 'Technician'],
            rows: data.repairs.map((repair) => ({
              'Created At': formatValue(repair.createdAt ? new Date(repair.createdAt) : ''),
              Status: repair.status || '-',
              Issue: repair.issue || '-',
              Device: repair.deviceId?.name || repair.deviceId?.model || '-',
              Customer: repair.customerId?.name || repair.customerId?.email || '-',
              Technician: repair.technician?.name || repair.technician?.email || '-'
            }))
          }
        : {
            caption: 'Pending repair summary',
            columns: ['Metric', 'Value'],
            rows: [
              ...makeMetricRows({ totalPending: data.totalPending }),
              ...makeDistributionRows(data.byPriority, 'Metric').map((row) => ({ Metric: `${row.Metric} Priority`, Value: row.Count }))
            ]
          };

    
    case 'payments': {
      const rows = [
        { Section: 'Overview', Name: 'Total Revenue (INR)', Value: formatValue(data.totalRevenue) },
        { Section: 'Overview', Name: 'Total Payments', Value: formatValue(data.totalPayments) },
        ...makeDistributionRows(data.methodCounts, 'Name').map((row) => ({ Section: 'Method', Name: row.Name, Value: row.Count })),
        ...Object.entries(data.dailyRevenue || {}).sort((a, b) => a[0].localeCompare(b[0])).map(([date, value]) => ({
          Section: 'Daily Revenue',
          Name: date,
          Value: formatValue(value)
        }))
      ];

      return {
        caption: 'Payment revenue summary',
        columns: ['Section', 'Name', 'Value'],
        rows
      };
    }

    case 'completed-repairs':
      return data.repairs?.length
        ? {
            caption: 'Completed repair records',
            columns: ['Recorded At', 'Status', 'Issue', 'Device', 'Customer', 'Technician'],
            rows: data.repairs.map((repair) => ({
              'Recorded At': formatValue(repair.createdAt ? new Date(repair.createdAt) : ''),
              Status: repair.status || '-',
              Issue: repair.issue || '-',
              Device: repair.deviceId?.name || repair.deviceId?.model || '-',
              Customer: repair.customerId?.name || repair.customerId?.email || '-',
              Technician: repair.technician?.name || repair.technician?.email || '-'
            }))
          }
        : {
            caption: 'Completed repair summary',
            columns: ['Metric', 'Value'],
            rows: makeMetricRows(data)
          };

    default:
      return {
        caption: 'Report details',
        columns: ['Metric', 'Value'],
        rows: makeMetricRows(data)
      };
  }
}

function downloadExcelLikeFile(fileName, columns, rows) {
  if (!columns.length) return;

  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    columns.map(escapeCell).join(','),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function printAsPdf(title, columns, rows) {
  if (!columns.length) return;

  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) return;

  const generatedOn = new Date().toLocaleString();
  const generatedBy = getGeneratedBy();

  const escapeHtml = (value) =>
    String(value ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const headerCells = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const bodyRows = rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`)
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin-bottom: 6px; }
          h2 { margin-top: 0; margin-bottom: 6px; }
          p { margin-top: 0; color: #475569; }
          table { width: 80%; border-collapse: collapse; margin-top: 18px; margin-left: auto; margin-right: auto; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
          th { background: #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
        </style>
      </head>
      <body>
        <center>
          <h1>RADS - Remote Android Device Support</h1>
          <h2>${escapeHtml(title)}</h2>
          <p>Generated on: ${escapeHtml(generatedOn)}</p>
          <p>Generated by: ${escapeHtml(generatedBy)}</p>
          <p align="right">page no 1 of 1</p>
        </center>
        <table>
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows || `<tr><td colspan="${columns.length}">No data available</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('device-status');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${REPORTS_API}/${selectedReport}`);
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report:', error);
        setReportData(getMockData(selectedReport));
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedReport]);

  const currentReport = reportConfigs.find((report) => report.id === selectedReport);
  const tableData = useMemo(() => buildReportTable(selectedReport, reportData), [selectedReport, reportData]);
  const generatedBy = useMemo(() => getGeneratedBy(), []);
  const generatedOn = useMemo(() => new Date().toLocaleString(), [selectedReport]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400">Each report now opens as a table with export options.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="form-card">
            <h2 className="text-lg font-semibold text-white mb-4">Available Reports</h2>
            <div className="space-y-2">
              {reportConfigs.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    selectedReport === report.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <report.icon size={20} />
                  <span className="text-sm text-left">{report.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="form-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colorClasses[currentReport.color]} flex items-center justify-center`}>
                  <currentReport.icon size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{currentReport.name}</h2>
                  <p className="text-sm text-slate-400">{tableData.caption}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => downloadExcelLikeFile(currentReport.id, tableData.columns, tableData.rows)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <FileSpreadsheet size={18} />
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => printAsPdf(currentReport.name, tableData.columns, tableData.rows)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                >
                  <Printer size={18} />
                  Export PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <ReportTable
                title={currentReport.name}
                columns={tableData.columns}
                rows={tableData.rows}
                generatedOn={generatedOn}
                generatedBy={generatedBy}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportTable({ title, columns, rows, generatedOn, generatedBy }) {
  if (!columns.length) {
    return <div className="text-slate-400">No data available</div>;
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-lg font-bold text-white">RADS - Remote Android Device Support</h1>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">Generated on: {generatedOn}</p>
        <p className="text-sm text-slate-400">Generated by: {generatedBy}</p>
        <div className="flex justify-end text-xs text-slate-500 mt-1">
          page no 1 of 1
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">{rows.length} row{rows.length === 1 ? '' : 's'}</p>
        <Download size={16} className="text-slate-500" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-800">
            <tr>
              {columns.map((column) => (
                <th key={column} className="text-left py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${columns[0] || 'row'}`} className="border-t border-slate-700/70 hover:bg-slate-800/50">
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${column}`} className="py-3 px-4 text-slate-200 align-top">
                      {formatValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-6 px-4 text-center text-slate-400">
                  No rows found for this report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getMockData(reportId) {
  const mockData = {
    'device-status': { total: 45, connected: 28, disconnected: 12, repairing: 5, connectionRate: 62 },
    'repair-summary': { total: 120, completed: 85, inProgress: 20, pending: 10, cancelled: 5, completionRate: 71 },
    'technician-performance': [
      { name: 'John Doe', email: 'john@example.com', totalRepairs: 25, completedRepairs: 22, completionRate: 88 },
      { name: 'Jane Smith', email: 'jane@example.com', totalRepairs: 30, completedRepairs: 28, completionRate: 93 },
      { name: 'Mike Johnson', email: 'mike@example.com', totalRepairs: 18, completedRepairs: 15, completionRate: 83 }
    ],
    'customer-satisfaction': {
      totalFeedbacks: 85,
      averageRating: 4.2,
      satisfactionRate: 84,
      ratings: { '5 Star': 42, '4 Star': 26, '3 Star': 10, '2 Star': 4, '1 Star': 3 }
    },
    'audit-log': { logs: [], actionCounts: { login: 45, device_connect: 30, repair_update: 25 } },
    'firmware-usage': {
      total: 56,
      byBrand: { Samsung: 15, Xiaomi: 12, OnePlus: 8, Google: 6 },
      byStatus: { active: 44, testing: 9, deprecated: 3 },
      totalSize: 5368709120
    },
    payments: {
      totalRevenue: 0,
      totalPayments: 0,
      methodCounts: { card: 0, netbanking: 0 },
      dailyRevenue: {}
    },
    'device-health': { totalPartitions: 120, healthy: 95, warning: 18, critical: 7, healthScore: 79, averageUsage: 54 },
    'user-activity': { totalUsers: 65, byRole: { ADMIN: 3, TECHNICIAN: 12, CUSTOMER: 50 }, recentSignups: 15, signupRate: 23 },
    'pending-repairs': { totalPending: 30, byPriority: { high: 8, medium: 12, low: 10 }, repairs: [] },
    'completed-repairs': { totalCompleted: 85, last30Days: 42, repairs: [] }
  };

  return mockData[reportId] || {};
}



