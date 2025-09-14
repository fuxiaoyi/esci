import { useRouter } from "next/router";
import { useEffect } from "react";

import GridLayout from "../layout/grid";

const Custom404 = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/").catch(console.error);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <GridLayout title="404 - Page Not Found">
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-6">
              The page you're looking for doesn't exist or you don't have permission to access it.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to home page in 3 seconds...
            </p>
            <button
              onClick={() => router.push("/").catch(console.error)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home Now
            </button>
          </div>
        </div>
      </div>
    </GridLayout>
  );
};

export default Custom404;
