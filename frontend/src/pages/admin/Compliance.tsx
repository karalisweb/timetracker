import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { ComplianceDashboard } from '../../types';
import { BarChart3, Download, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Compliance() {
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFrom, setExportFrom] = useState(format(new Date(), 'yyyy-MM-01'));
  const [exportTo, setExportTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getCompliance();
      setData(data);
    } catch (error) {
      console.error('Error loading compliance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await adminApi.exportCsv(exportFrom, exportTo);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet_${exportFrom}_${exportTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        Errore nel caricamento dei dati
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-blue-600" />
            Dashboard Compliance
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Settimana: {format(parseISO(data.weekStart), 'd MMM', { locale: it })} -{' '}
            {format(parseISO(data.weekEnd), 'd MMM yyyy', { locale: it })}
          </p>
        </div>
      </div>

      {/* Export card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Da</label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">A</label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {isExporting ? 'Esportazione...' : 'Scarica CSV'}
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collaboratore
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giornate chiuse
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Minuti settimana
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ultima entry
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Settimana inviata
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.users.map((user) => {
                const compliancePercent = Math.round(
                  (user.closedDaysThisWeek / user.workingDaysCount) * 100
                );
                const minutesPercent = Math.round(
                  (user.totalMinutesThisWeek / user.weeklyTargetMinutes) * 100
                );

                return (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <span className={`font-medium ${
                          compliancePercent >= 80 ? 'text-green-600' :
                          compliancePercent >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {user.closedDaysThisWeek}/{user.workingDaysCount}
                        </span>
                        <span className="ml-2 text-sm text-gray-400">
                          ({compliancePercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <span className={`font-medium ${
                          minutesPercent >= 80 ? 'text-green-600' :
                          minutesPercent >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatMinutes(user.totalMinutesThisWeek)}
                        </span>
                        <span className="ml-2 text-sm text-gray-400">
                          / {formatMinutes(user.weeklyTargetMinutes)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.lastEntryDate ? (
                        <div className="flex items-center justify-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(parseISO(user.lastEntryDate), 'dd/MM')}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.weekSubmitted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Inviata
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          In attesa
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Settimane inviate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.users.filter(u => u.weekSubmitted).length}/{data.users.length}
              </p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Media compliance</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  data.users.reduce((sum, u) => sum + (u.closedDaysThisWeek / u.workingDaysCount) * 100, 0) /
                  data.users.length
                )}%
              </p>
            </div>
            <BarChart3 className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In attesa</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.users.filter(u => !u.weekSubmitted).length}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
