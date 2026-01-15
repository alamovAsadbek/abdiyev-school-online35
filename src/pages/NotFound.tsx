import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
      <div className="relative flex min-h-screen items-center justify-center bg-muted overflow-hidden">

        {/* Smoke bubbles */}
        <div className="absolute top-10 left-1/4 w-6 h-6 bg-primary/30 rounded-full animate-ping"></div>
        <div className="absolute top-20 right-1/4 w-4 h-4 bg-primary/30 rounded-full animate-pulse"></div>

        <div className="text-center z-10">

          {/* Lab containers */}
          <div className="flex justify-center gap-16 mb-10">

            {/* Flask 1 */}
            <div className="relative w-28 h-40 border-4 border-primary rounded-b-3xl rounded-t-lg overflow-hidden">
              <div className="absolute bottom-0 w-full h-1/2 bg-primary/70 animate-liquid"></div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-8 border-4 border-primary rounded"></div>
            </div>

            {/* Flask 2 */}
            <div className="relative w-28 h-40 border-4 border-primary rounded-b-3xl rounded-t-lg overflow-hidden rotate-3">
              <div className="absolute bottom-0 w-full h-2/3 bg-primary/50 animate-liquid2"></div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-8 border-4 border-primary rounded"></div>
            </div>
          </div>

          <h1 className="text-7xl font-extrabold text-primary mb-4 animate-pulse">
            404
          </h1>

          <p className="text-xl text-muted-foreground mb-2">
            Chemical Reaction Failed
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            Sahifa laboratoriyada portlab ketdi 🧪
          </p>

          <a
              href="/"
              className="inline-block px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Return to Laboratory
          </a>
        </div>

        {/* Animations */}
        <style>
          {`
        @keyframes liquid {
          0% { height: 45%; }
          50% { height: 55%; }
          100% { height: 45%; }
        }
        .animate-liquid {
          animation: liquid 3s ease-in-out infinite;
        }

        @keyframes liquid2 {
          0% { height: 65%; }
          50% { height: 55%; }
          100% { height: 65%; }
        }
        .animate-liquid2 {
          animation: liquid2 4s ease-in-out infinite;
        }
        `}
        </style>
      </div>
  );
};

export default NotFound;
