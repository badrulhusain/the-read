import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlogCard } from "@/components/blog/BlogCard";
import { showApiError } from "@/lib/api";
import { adminService } from "@/services/admin.service";
import type { Blog } from "@/types/blog";
import type { AdminStats } from "@/types/user";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({});
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadDashboard() {
    setLoading(true);
    setError("");
    adminService
      .dashboard()
      .then((summary) => {
        setStats(summary.stats as AdminStats);
        setBlogs(summary.recentItems);
      })
      .catch((err) => {
        setError("Could not load the admin dashboard summary.");
        showApiError(err, "Could not load the admin dashboard summary.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadDashboard, []);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">
          Admin desk
        </p>
        <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-[#231b17]">
          Admin dashboard
        </h2>
      </div>
      {error && <RetryMessage message={error} onRetry={loadDashboard} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Users"
          value={count(stats.users, stats.totalUsers)}
          loading={loading}
        />
        <Stat
          label="Editors"
          value={count(stats.editors, stats.totalEditors)}
          loading={loading}
        />
        <Stat
          label="Admins"
          value={count(stats.admins, stats.totalAdmins)}
          loading={loading}
        />
        <Stat
          label="Total blogs"
          value={count(stats.totalBlogs)}
          loading={loading}
        />
        <Stat
          label="Submitted"
          value={count(stats.submittedBlogs)}
          loading={loading}
        />
        <Stat
          label="Under review"
          value={count(stats.underReviewBlogs)}
          loading={loading}
        />
        <Stat
          label="Approved"
          value={count(stats.approvedBlogs)}
          loading={loading}
        />
        <Stat
          label="Published"
          value={count(stats.publishedBlogs)}
          loading={loading}
        />
        <Stat
          label="Rejected"
          value={count(stats.rejectedBlogs)}
          loading={loading}
        />
      </div>
      <Card>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/users">Manage users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/blogs">Manage blogs</Link>
          </Button>
          <Button asChild variant="outline">
          <Link to="/admin/publication-queue">Ready to publish</Link>
          </Button>
        </CardContent>
      </Card>
      <section>
        <h3 className="mb-3 font-serif text-2xl font-semibold text-[#231b17]">
          Recent admin items
        </h3>
        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-[#ded3c4] bg-[#fbf7ef]"
              />
            ))}
          </div>
        ) : blogs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} showStatus />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-[#74685f]">
              No recent admin items yet.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function count(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number") ?? 0;
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent>
        {loading ? (
          <div className="h-10 w-16 animate-pulse rounded bg-[#eee6da]" />
        ) : (
          <div className="font-serif text-4xl font-semibold text-[#7b2d32]">
            {value}
          </div>
        )}
        <div className="mt-1 text-sm font-medium text-[#74685f]">{label}</div>
      </CardContent>
    </Card>
  );
}

function RetryMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 text-[#74685f]">
        <span>{message}</span>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
