import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yvkjqdmitwouluiqkuvv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JIeqxToOTSXqZ7cRanPkcg_IUa3XdBO'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

export async function signUp({ email, password, fullName, phone, parentPhone, grade }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        full_name: fullName,
        phone,
        parent_phone: parentPhone,
        grade,
        role: 'student'
      }])

    if (profileError) throw profileError
  }

  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// User Logging
export async function logUserAction(userId, action, fullName, phone) {
  try {
    await supabase.from('user_logs').insert([{
      user_id: userId,
      full_name: fullName,
      phone: phone,
      action: action,
      user_agent: navigator.userAgent,
    }])
  } catch (e) {
    console.error('Logging error:', e)
  }
}

export async function getUserLogs() {
  const { data, error } = await supabase
    .from('user_logs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export function exportLogsToTxt(logs) {
  let content = '╔═══════════════════════════════════════════════════════════════╗\n'
  content +=    '║           Vision Academy - سجل دخول/خروج المستخدمين          ║\n'
  content +=    '╚═══════════════════════════════════════════════════════════════╝\n\n'
  content +=    '┌────┬────────────────────┬─────────────────┬──────────┬─────────────────────────────┐\n'
  content +=    '│ #  │ الاسم              │ رقم الهاتف      │ الحدث    │ التاريخ                     │\n'
  content +=    '├────┼────────────────────┼─────────────────┼──────────┼─────────────────────────────┤\n'

  logs.forEach((log, i) => {
    const name = (log.full_name || '—').padEnd(18).substring(0, 18)
    const phone = (log.phone || '—').padEnd(15).substring(0, 15)
    const action = log.action === 'login' ? 'دخول  ' : 'خروج  '
    const date = new Date(log.created_at).toLocaleString('ar-EG')
    content += `│ ${String(i + 1).padStart(2)} │ ${name} │ ${phone} │ ${action} │ ${date.padEnd(27)} │\n`
  })

  content +=    '└────┴────────────────────┴─────────────────┴──────────┴─────────────────────────────┘\n'
  content +=    `\nإجمالي السجلات: ${logs.length}\n`
  content +=    `تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n`
  content +=    `Vision Academy © ${new Date().getFullYear()}\n`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'بينات.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}