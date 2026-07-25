import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const AUTHORIZED_ROLES = ['developer', 'ceo']

export async function POST(request: NextRequest) {
  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing employee id' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !AUTHORIZED_ROLES.includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // SECURITY: service_role client — must never leave this file. Do not export, do not import into any 'use client' component or any other route.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Delete the profile row first: if this fails, nothing irreversible has happened yet
  // (the auth account is untouched). Deleting the auth account first would risk an
  // unrecoverable state if the profile delete failed afterward.
  const { error: profileError } = await serviceClient.from('profiles').delete().eq('id', id)
  if (profileError) {
    console.error('Employee profile deletion failed:', { userId: id, success: false })
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { error: authError } = await serviceClient.auth.admin.deleteUser(id)
  if (authError) {
    console.error('Employee auth deletion failed:', { userId: id, success: false })
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  console.log('Employee deleted:', { userId: id, success: true })
  return NextResponse.json({ success: true })
}
