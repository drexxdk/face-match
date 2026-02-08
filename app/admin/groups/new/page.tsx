import { redirect } from 'next/navigation';

export default function NewGroupPage() {
  // Redirect to groups list page - group creation is now handled via modal
  redirect('/admin/groups');
}
