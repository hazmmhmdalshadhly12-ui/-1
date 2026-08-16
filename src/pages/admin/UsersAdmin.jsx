import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Users, Search, GraduationCap, Loader2 } from 'lucide-react'

export default function UsersAdmin() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  useEffect(() => {
    let result = users
    if (search) {
      result = result.filter(u => 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (gradeFilter !== 'all') {
      result = result.filter(u => u.grade === gradeFilter)
    }
    setFiltered(result)
  }, [search, gradeFilter, users])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-vision-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">الطلاب</h1>
        <p className="text-vision-text-muted text-sm mt-1">قائمة الطلاب المسجلين في الأكاديمية</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vision-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم أو الإيميل..."
            className="vision-input pr-10"
          />
        </div>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="vision-input sm:w-48">
          <option value="all">كل الصفوف</option>
          <option value="first_secondary">الأول الثانوي</option>
          <option value="second_secondary">الثاني الثانوي</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vision-surfaceLight">
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">#</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">الاسم</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">الصف</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">الموبايل</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">ولي الأمر</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-vision-text-muted">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className="border-b border-vision-surfaceLight/50 hover:bg-vision-surfaceLight/30">
                <td className="py-3 px-4 text-sm text-vision-text-muted">{i + 1}</td>
                <td className="py-3 px-4 font-medium">{u.full_name || '—'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-xs bg-vision-surfaceLight text-vision-text-muted">
                    {u.grade === 'first_secondary' ? 'الأول' : 'الثاني'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-vision-text-muted" dir="ltr">{u.phone || '—'}</td>
                <td className="py-3 px-4 text-sm text-vision-text-muted" dir="ltr">{u.parent_phone || '—'}</td>
                <td className="py-3 px-4 text-sm text-vision-text-muted">{new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-vision-text-muted">لا توجد نتائج</div>
      )}
    </div>
  )
}