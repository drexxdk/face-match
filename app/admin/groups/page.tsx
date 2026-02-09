import { redirect } from 'next/navigation';

export default async function GroupsPage() {
  // Redirect to main admin page
  redirect('/admin');
}
