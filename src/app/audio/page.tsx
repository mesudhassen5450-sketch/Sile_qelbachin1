import { redirect } from 'next/navigation'

/** Alias — long audio lives under Da’wah */
export default function AudioRedirectPage() {
  redirect('/dawah')
}
