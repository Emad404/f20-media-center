import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const AUTHORIZED_ROLES = ['developer', 'ceo']

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    email,
    full_name_ar,
    full_name_en,
    role,
    job_title_ar,
    job_title_en,
    department_ar,
    department_en,
    phone,
  } = body

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !AUTHORIZED_ROLES.includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!email || !full_name_ar || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // SECURITY: service_role client — must never leave this file. Do not export, do not import into any 'use client' component or any other route.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/set-password`,
    data: { password_set: false },
  })

  if (inviteError || !inviteData?.user) {
    console.error('Employee invite failed:', { success: false })
    return NextResponse.json({ error: inviteError?.message || 'Failed to invite user' }, { status: 500 })
  }

  const { error: profileError } = await serviceClient.from('profiles').insert({
    id: inviteData.user.id,
    email,
    full_name_ar,
    full_name_en: full_name_en || null,
    role,
    job_title_ar: job_title_ar || null,
    job_title_en: job_title_en || null,
    department_ar: department_ar || null,
    department_en: department_en || null,
    phone: phone || null,
  })

  if (profileError) {
    console.error('Employee profile insert failed:', { userId: inviteData.user.id, success: false })
    // Roll back the orphaned auth user so a failed invite doesn't leave a dangling account.
    await serviceClient.auth.admin.deleteUser(inviteData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  console.log('Employee invited:', { userId: inviteData.user.id, success: true })
  return NextResponse.json({ success: true, id: inviteData.user.id })
}
