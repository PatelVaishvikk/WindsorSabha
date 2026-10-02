import Link from "next/link";
export default function NotFound() {
  return (
    <div className="panel p-8">
      <h1>Record not found</h1>
      <p className="subtitle">
        It may have been removed or the link may be incorrect.
      </p>
      <Link href="/dashboard" className="button mt-5">
        Back to overview
      </Link>
    </div>
  );
}
