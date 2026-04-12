import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageBackground } from "@/components/PageBackground";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center">
        <div className="aero-glass text-center p-12">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <Button className="aero-button-accent" asChild>
            <a href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </a>
          </Button>
        </div>
      </div>
    </PageBackground>
  );
};

export default NotFound;
