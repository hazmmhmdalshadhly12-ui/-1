import { useEffect, useState } from 'react'
import { getUserLogs, exportLogsToTxt } from '../../lib/supabaseClient'
import { FileText, Download, LogIn, LogOut, Search, Calendar, Loader2, RefreshCw } from 'lucide-react'

export default function LogsAdmin() {
  const [logs, setLogs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await getUserLogs()
      setLogs(data)
      setFiltered(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    let result = logs
    if (search) {
      result = result.filter(l =>
        (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.phone || '').includes(search)
      )
    }
    if (actionFilter !== 'all') {
      result = result.filter(l => l.action === actionFilter)
    }
    setFiltered(result)
  }, [search, actionFilter, logs])

  const handleExport = () => {
    exportLogsToTxt(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-vision-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-vision-primary" />
            سجل المستخدمين
          </h1>
          <p className="text-vision-text-muted text-sm mt-1">تتبع دخول وخروج المستخدمين مع الاسم ورقم الهاتف</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vision-surfaceLight text-sm font-medium hover:bg-vision-surfaceLight/80 transition-colors">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
          <button onClick={handleExport} className="vision-btn-primary text-sm py-2 px-4">
            <Download className="w-4 h-4" />
            تحميل بينات.txt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vision-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهاتف..."
            className="vision-input pr-10"
          />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="vision-input sm:w-40">
          <option value="all">كل الأحداث</option>
          <option value="login">دخول</option>
          <option value="logout">خروج</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="vision-card text-center">
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-vision-text-muted text-sm">إجمالي السجلات</div>
        </div>
        <div className="vision-card text-center">
          <div className="text-2xl font-bold text-vision-success">{logs.filter(l => l.action === 'login').length}</div>
          <div className="text-vision-text-muted text-sm">عمليات الدخول</div>
        </div>
        <div className="vision-card text-center">
          <div className="text-2xl font-bold text-vision-danger">{logs.filter(l => l.action === 'logout').length}</div>
          <div className="text-vision-text-muted text-sm">عمليات الخروج</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vision-surfaceLight">
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">#</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">الاسم</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">رقم الهاتف</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">الحدث</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => (
              <tr key={log.id} className="border-b border-vision-surfaceLight/50 hover:bg-vision-surfaceLight/30 transition-colors">
                <td className="py-3 px-4 text-sm text-vision-text-muted">{i + 1}</td>
                <td className="py-3 px-4 font-medium">{log.full_name || '—'}</td>
                <td className="py-3 px-4 text-sm" dir="ltr">{log.phone || '—'}</td>
                <td className="py-3 px-4">
                  {log.action === 'login' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-vision-success/10 text-vision-success">
                      <LogIn className="w-3 h-3" />
                      دخول
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-vision-danger/10 text-vision-danger">
                      <LogOut className="w-3 h-3" />
                      خروج
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-vision-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleString('ar-EG')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-vision-surfaceLight mx-auto mb-4" />
          <p className="text-vision-text-muted">لا توجد سجلات</p>
        </div>
      )}
    </div>
  )
}