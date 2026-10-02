"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="panel p-8">
      <h1>We couldn’t load the workspace</h1>
      <p className="subtitle">
        The service is temporarily unavailable. Please try again or contact your
        administrator if the problem continues.
      </p>
      <button className="button primary mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
