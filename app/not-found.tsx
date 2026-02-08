import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-2">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          The requested page could not be found. <Link href="/">Go back home</Link>
        </CardContent>
      </Card>
    </div>
  );
};
export default NotFound;
