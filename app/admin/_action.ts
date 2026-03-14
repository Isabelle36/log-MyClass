'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'

export async function setRole(formData: FormData) {
  const client = await clerkClient()

  // Check that the user trying to set the Role is an admin
  if (!(await checkRole('admin'))) {
    return
  }

  const id = formData.get('id') as string | null
  const role = formData.get('role') as string | null

  if (!id || !role) {
    return
  }

  try {
    await client.users.updateUserMetadata(id, {
      publicMetadata: { role },
    })
  } catch {
    return
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient()

  if (!(await checkRole('admin'))) {
    return
  }

  const id = formData.get('id') as string | null
  if (!id) {
    return
  }

  try {
    await client.users.updateUserMetadata(id, {
      publicMetadata: { role: null },
    })
  } catch {
    return
  }
}