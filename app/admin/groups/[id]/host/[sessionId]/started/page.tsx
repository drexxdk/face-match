import { redirect } from 'next/navigation';
import { use } from 'react';

export default function GameStartedPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const params = use(paramsPromise);
  // Redirect to host page - game started is now shown in a modal
  redirect(`/admin/groups/${params.id}/host`);
}
