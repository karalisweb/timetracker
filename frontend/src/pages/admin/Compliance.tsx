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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        Errore nel caricamento dei dati
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-purple-400" />
            Dashboard Compliance
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Settimana: {format(parseISO(data.weekStart), 'd MMM', { locale: it })} -{' '}
            {format(parseISO(data.weekEnd), 'd MMM yyyy', { locale: it })}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Settimane inviate</p>
              <p className="text-2xl font-bold text-white">
                {data.users.filter(u => u.weekSubmitted).length}/{data.users.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Media compliance</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(
                  data.users.reduce((sum, u) => sum + (u.closedDaysThisWeek / u.workingDaysCount) * 100, 0) /
                  data.users.length
                )}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">In attesa</p>
              <p className="text-2xl font-bold text-white">
                {data.users.filter(u => !u.weekSubmitted).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Export card */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center">
          <Download className="h-5 w-5 mr-2 text-gray-400" />
          Export CSV
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Da</label>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">A</label>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50 transition-colors"
          >
            {isExporting ? 'Esportazione...' : 'Scarica CSV'}
          </button>
        </div>
      </div>

      {/* Users table - Desktop */}
      <div className="hidden md:block bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700">
            <thead className="bg-dark-850">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Collaboratore
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Giornate chiuse
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Minuti settimana
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ultima entry
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Settimana inviata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {data.users.map((user) => {
                const compliancePercent = Math.round(
                  (user.closedDaysThisWeek / user.workingDaysCount) * 100
                );
                const minutesPercent = Math.round(
                  (user.totalMinutesThisWeek / user.weeklyTargetMinutes) * 100
                );

                return (
                  <tr key={user.userId} className="hover:bg-dark-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <span className={`font-medium ${
                          compliancePercent >= 80 ? 'text-green-400' :
                          compliancePercent >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {user.closedDaysThisWeek}/{user.workingDaysCount}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({compliancePercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <span className={`font-medium ${
                          minutesPercent >= 80 ? 'text-green-400' :
                          minutesPercent >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {formatMinutes(user.totalMinutesThisWeek)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          / {formatMinutes(user.weeklyTargetMinutes)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.lastEntryDate ? (
                        <div className="flex items-center justify-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(parseISO(user.lastEntryDate), 'dd/MM')}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.weekSubmitted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Inviata
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
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

      {/* Users cards - Mobile */}
      <div className="md:hidden space-y-3">
        {data.users.map((user) => {
          const compliancePercent = Math.round(
            (user.closedDaysThisWeek / user.workingDaysCount) * 100
          );
          const minutesPercent = Math.round(
            (user.totalMinutesThisWeek / user.weeklyTargetMinutes) * 100
          );

          return (
            <div key={user.userId} className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white truncate">{user.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                </div>
                {user.weekSubmitted ? (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Inviata
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    In attesa
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Giornate: </span>
                  <span className={`font-medium ${
                    compliancePercent >= 80 ? 'text-green-400' :
                    compliancePercent >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {user.closedDaysThisWeek}/{user.workingDaysCount}
                  </span>
                  <span className="text-gray-500 ml-1">({compliancePercent}%)</span>
                </div>
                <div>
                  <span className="text-gray-400">Minuti: </span>
                  <span className={`font-medium ${
                    minutesPercent >= 80 ? 'text-green-400' :
                    minutesPercent >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {formatMinutes(user.totalMinutesThisWeek)}
                  </span>
                  <span className="text-gray-500 ml-1">/ {formatMinutes(user.weeklyTargetMinutes)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
