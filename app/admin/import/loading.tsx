import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ImportGroupLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    </div>
  );
}
