import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';

export default function NotFoundPage() {
  return (
    <div className="container py-24 text-center">
      <p className="text-primary font-semibold">404</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Page Not Found</h1>
      <p className="mt-3 text-gray-600">The page you're looking for doesn't exist or has moved.</p>
      <Button className="mt-6" asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}
