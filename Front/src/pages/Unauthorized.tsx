import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="space-x-4">
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 