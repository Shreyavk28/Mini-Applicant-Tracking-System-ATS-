
import { useCallback, useEffect, useState } from "react";
import { candidateApi, jobApi } from "./api";
import Applications from "./Applications";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  skills: "",
  experience_years: "0",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function Field({ label, error, ...props }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
      />
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function CandidateModal({ candidate, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(candidate || {}),
    phone: candidate?.phone ?? "",
    skills: candidate?.skills ?? "",
    experience_years: String(candidate?.experience_years ?? 0),
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function change(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("Please enter the candidate's full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    const experience = Number(form.experience_years);

    if (
      form.experience_years.trim() === "" ||
      !Number.isFinite(experience) ||
      experience < 0 ||
      experience > 999.9
    ) {
      setError("Experience must be between 0 and 999.9 years.");
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      skills: form.skills.trim() || null,
      experience_years: experience,
    };

    setSaving(true);

    try {
      if (candidate) {
        await candidateApi.update(candidate.id, payload);
      } else {
        await candidateApi.create(payload);
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to save the candidate.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Talent management
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {candidate ? "Edit candidate" : "Add candidate"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the candidate's professional details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Full name *"
              name="full_name"
              value={form.full_name}
              onChange={change}
              placeholder="e.g. Ananya Sharma"
              maxLength={100}
              required
            />
          </div>
          <Field
            label="Email address *"
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            placeholder="ananya@example.com"
            maxLength={150}
            required
          />
          <Field
            label="Phone number"
            name="phone"
            value={form.phone}
            onChange={change}
            placeholder="Contact number"
            maxLength={20}
          />
          <div className="sm:col-span-2">
            <Field
              label="Skills"
              name="skills"
              value={form.skills}
              onChange={change}
              placeholder="React, Node.js, SQL"
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Experience (years)"
              name="experience_years"
              type="number"
              min="0"
              max="999.9"
              step="0.1"
              value={form.experience_years}
              onChange={change}
              required
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            {saving
              ? "Saving..."
              : candidate
                ? "Save changes"
                : "Add candidate"}
          </button>
        </div>
      </form>
    </div>
  );
}

const emptyJobForm = { title: "", department: "", location: "", employment_type: "Full-time" };

function JobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...emptyJobForm, ...(job || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setError("");
    const payload = { title: form.title.trim(), department: form.department.trim(), location: form.location.trim(), employment_type: form.employment_type };
    if (!payload.title || !payload.department || !payload.location || !payload.employment_type) { setError("Please complete all required fields."); return; }
    setSaving(true);
    try { if (job) await jobApi.update(job.id, payload); else await jobApi.create(payload); await onSaved(Boolean(job)); onClose(); }
    catch (err) { setError(err.message || "Unable to save this job."); }
    finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
    <form onSubmit={submit} className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Talent operations</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{job ? "Edit job" : "Add job"}</h2><p className="mt-1 text-sm text-slate-500">Manage an opening in your recruitment pipeline.</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Close form" className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">✕</button></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Job title *" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Full Stack Developer Intern" maxLength={150} required /></div><Field label="Department *" name="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" maxLength={100} required /><Field label="Location *" name="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru" maxLength={150} required /><div className="sm:col-span-2"><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">Employment type *</span><select name="employment_type" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50">{["Full-time", "Part-time", "Contract", "Internship"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label></div></div>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">{saving ? "Saving..." : job ? "Save changes" : "Add job"}</button></div>
    </form></div>;
}

function MetricCard({ icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">
          {label}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [query, setQuery] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobsNotice, setJobsNotice] = useState("");
  const [jobModal, setJobModal] = useState(null);
  const [jobQuery, setJobQuery] = useState("");
  const [dashboardApplications, setDashboardApplications] = useState([]);
  const [dashboardDetailsError, setDashboardDetailsError] = useState("");
  const [dashboardDetailsLoading, setDashboardDetailsLoading] = useState(false);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await candidateApi.list({
        q: query.trim(),
        minExperience,
        maxExperience,
        page,
        limit: 10,
      });

      setCandidates(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || "Unable to load candidates.");
    } finally {
      setLoading(false);
    }
  }, [query, minExperience, maxExperience, page]);

  const loadMetrics = useCallback(async () => {
    try {
      const result = await candidateApi.dashboard();
      setMetrics(result.data);
    } catch {
      setMetrics(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCandidates();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadCandidates]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true); setJobsError("");
    try { const result = await jobApi.list(); setJobs(Array.isArray(result) ? result : result.data || result.jobs || []); }
    catch (err) { setJobsError(err.message || "Unable to load jobs."); setJobs([]); }
    finally { setJobsLoading(false); }
  }, []);
  useEffect(() => { loadJobs(); }, [loadJobs]);
  const filteredJobs = jobs.filter((job) => `${job.title || ""} ${job.department || ""} ${job.location || ""} ${job.employment_type || ""}`.toLowerCase().includes(jobQuery.trim().toLowerCase()));

  const loadDashboardDetails = useCallback(async () => {
    setDashboardDetailsLoading(true);
    setDashboardDetailsError("");
    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
    try {
      const response = await fetch(`${apiBase}/applications`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || "Unable to load applications.");
      setDashboardApplications(Array.isArray(body) ? body : body.data || body.applications || []);
    } catch (err) {
      setDashboardDetailsError(err.message || "Unable to load dashboard details.");
      setDashboardApplications([]);
    } finally {
      setDashboardDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardDetails();
  }, [loadDashboardDetails]);

  const pipelineStages = ["Applied", "Screening", "Interview", "Offered", "Hired", "Rejected"];
  const pipelineCounts = pipelineStages.map((stage) => ({
    stage,
    count: dashboardApplications.filter((item) => String(item.stage || "Applied").toLowerCase() === stage.toLowerCase()).length,
  }));
  const recentApplications = [...dashboardApplications]
    .sort((a, b) => new Date(b.applied_at || b.created_at || 0) - new Date(a.applied_at || a.created_at || 0))
    .slice(0, 5);
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);
  const candidateNameForApplication = (item) => item.candidate_name || item.full_name || item.candidate?.full_name || item.name || "Candidate";
  const jobTitleForApplication = (item) => item.job_title || item.title || item.job?.title || "Position";


  async function refreshAfterSave() {
    setNotice(
      modal?.candidate ? "Candidate updated successfully." : "Candidate added successfully."
    );

    if (page !== 1) {
      setPage(1);
    } else {
      await loadCandidates();
    }

    await loadMetrics();
  }

  async function deleteCandidate(candidate) {
    const confirmed = window.confirm(
      `Delete ${candidate.full_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      await candidateApi.remove(candidate.id);
      setNotice("Candidate deleted successfully.");

      const remainingOnPage = candidates.length === 1 && page > 1;
      if (remainingOnPage) {
        setPage((current) => current - 1);
      } else {
        await loadCandidates();
      }

      await loadMetrics();
    } catch (err) {
      setError(err.message || "Unable to delete candidate.");
    }
  }

  function resetFilters() {
    setQuery("");
    setMinExperience("");
    setMaxExperience("");
    setPage(1);
  }

  const totalCandidates = metrics?.totalCandidates ?? pagination.total;
  const activeApplications = metrics?.totalApplications ?? "—";
  const totalJobs = metrics?.totalJobs ?? jobs.length;
  const hasFilters =
    query !== "" || minExperience !== "" || maxExperience !== "";

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#111b35] text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-xl font-black">
            H
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">HireFlow</p>
            <p className="text-xs text-slate-400">Talent workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-7" aria-label="Main navigation">
          <button
            type="button"
            onClick={() => setActivePage("dashboard")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${activePage === "dashboard" ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <span>▦</span> Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActivePage("candidates")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${activePage === "candidates" ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <span>♙</span> Candidates
          </button>
          <button
            type="button"
            onClick={() => setActivePage("applications")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${activePage === "applications" ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <span>▤</span> Applications
          </button>
          <button
            type="button"
            onClick={() => setActivePage("jobs")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${activePage === "jobs" ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <span>▣</span> Jobs
          </button>
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            ATS Workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Keep your hiring pipeline organized in one place.
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-black text-white lg:hidden">
                H
              </div>
              <div>
                <p className="text-sm text-slate-500">
                  Workspace / <span className="text-slate-800">{activePage === "applications" ? "Applications" : activePage === "jobs" ? "Jobs" : activePage === "dashboard" ? "Dashboard" : "Candidates"}</span>
                </p>
                <h1 className="text-lg font-bold text-slate-900">
                  {activePage === "applications" ? "Application management" : activePage === "jobs" ? "Job management" : activePage === "dashboard" ? "Hiring overview" : "Candidate directory"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:block">
                Recruitment team
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                HF
              </div>
            </div>
          </div>
        </header>

        {activePage === "applications" ? (
          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8">
            <Applications />
          </div>
        ) : activePage === "jobs" ? (
          <div className="mx-auto max-w-[1600px] space-y-6 px-5 py-8 sm:px-8">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">TALENT OPERATIONS</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Job directory</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create and manage the positions your candidates can apply for.</p></div><button onClick={() => { setJobsNotice(""); setJobModal({ job: null }); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"><span className="text-lg">+</span> Add job</button></section>
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="text-lg font-bold text-slate-900">Openings</h3><p className="mt-1 text-sm text-slate-500">View and maintain your job listings.</p></div><span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{jobs.length} job{jobs.length === 1 ? "" : "s"}</span></div><div className="mt-5"><input value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} placeholder="Search title, department, location, or type..." aria-label="Search jobs" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50" /></div></div>
              {jobsNotice && <div role="status" className="border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-800">{jobsNotice}</div>}{jobsError && <div role="alert" className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{jobsError}<button onClick={loadJobs} className="ml-3 font-semibold underline">Retry</button></div>}
              <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left"><thead className="bg-slate-50/80"><tr className="text-xs font-semibold uppercase tracking-wider text-slate-500"><th className="px-6 py-4">Job title</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Employment type</th><th className="px-6 py-4">Added on</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{jobsLoading ? <tr><td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-500">Loading jobs...</td></tr> : filteredJobs.length === 0 ? <tr><td colSpan="6" className="px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">▣</div><p className="mt-4 font-semibold text-slate-800">{jobQuery ? "No matching jobs" : "No jobs yet"}</p><p className="mt-1 text-sm text-slate-500">{jobQuery ? "Try a different search." : "Add your first job opening to get started."}</p>{!jobQuery && <button onClick={() => setJobModal({ job: null })} className="mt-4 font-semibold text-indigo-600">+ Add your first job</button>}</td></tr> : filteredJobs.map((job) => <tr key={job.id} className="transition hover:bg-slate-50/80"><td className="px-6 py-4"><p className="font-semibold text-slate-800">{job.title}</p><p className="mt-0.5 text-xs text-slate-500">Job ID: {job.id}</p></td><td className="px-6 py-4 text-sm text-slate-600">{job.department}</td><td className="px-6 py-4 text-sm text-slate-600">{job.location}</td><td className="px-6 py-4"><span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-sm font-semibold text-indigo-700">{job.employment_type}</span></td><td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{formatDate(job.created_at)}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => { setJobsNotice(""); setJobModal({ job }); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-indigo-50">Edit</button><button onClick={async () => { if (!window.confirm(`Delete "${job.title}"? The database may prevent deletion while applications are linked.`)) return; setJobsError(""); setJobsNotice(""); try { await jobApi.remove(job.id); setJobsNotice("Job deleted successfully."); await loadJobs(); await loadMetrics(); } catch (err) { setJobsError(err.message || "Unable to delete this job."); } }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button></div></td></tr>)}</tbody></table></div>
              <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:px-6">Showing {filteredJobs.length} of {jobs.length} job{jobs.length === 1 ? "" : "s"}</div>
            </section>
          </div>
        ) : (
        <div className="mx-auto max-w-[1600px] space-y-7 px-5 py-8 sm:px-8">
          {activePage === "dashboard" ? (
            <>
              <section className="mb-7">
                <p className="text-sm font-semibold text-indigo-600">
                  MONDAY · TALENT OPERATIONS
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Find your next great hire.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Your hiring overview at a glance. Track candidates, applications, open positions, and successful hires.
                </p>
              </section>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="♙"
              label="Total candidates"
              value={totalCandidates}
              detail="Candidate profiles in your database"
            />
            <MetricCard
              icon="▤"
              label="Applications"
              value={activeApplications}
              detail="Applications across all hiring stages"
            />
            <MetricCard
              icon="▣"
              label="Open positions"
              value={totalJobs}
              detail="Jobs currently recorded"
            />
            <MetricCard
              icon="✓"
              label="Hired"
              value={
                metrics?.applicationsByStage?.find(
                  (item) => item.stage === "Hired"
                )?.total ?? 0
              }
              detail="Applications marked as hired"
            />
              </section>

              {dashboardDetailsError && (
                <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {dashboardDetailsError}<button onClick={loadDashboardDetails} className="ml-3 font-semibold underline">Retry</button>
                </div>
              )}

              <section className="grid gap-5 xl:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-900">Application pipeline</h3><p className="mt-1 text-sm text-slate-500">Applications by current hiring stage</p></div><button onClick={() => setActivePage("applications")} className="text-sm font-semibold text-indigo-600">View applications</button></div>
                  {dashboardDetailsLoading ? <p className="p-5 text-sm text-slate-500">Loading pipeline…</p> : <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">{pipelineCounts.map(({ stage, count }) => <div key={stage} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">{stage}</p><p className="mt-2 text-2xl font-bold text-slate-900">{count}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${dashboardApplications.length ? Math.min(100, count / dashboardApplications.length * 100) : 0}%` }} /></div></div>)}</div>}
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-900">Recent applications</h3><p className="mt-1 text-sm text-slate-500">Latest activity in your hiring pipeline</p></div><button onClick={() => setActivePage("applications")} className="text-sm font-semibold text-indigo-600">View all</button></div>
                  {dashboardDetailsLoading ? <p className="p-5 text-sm text-slate-500">Loading applications…</p> : recentApplications.length === 0 ? <div className="px-5 py-8 text-center"><p className="font-semibold text-slate-800">No applications yet</p><p className="mt-1 text-sm text-slate-500">Add an application to link a candidate to a job.</p><button onClick={() => setActivePage("applications")} className="mt-3 font-semibold text-indigo-600">+ Add application</button></div> : <div className="divide-y divide-slate-100">{recentApplications.map((item, index) => <div key={item.id ?? `${candidateNameForApplication(item)}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{candidateNameForApplication(item)}</p><p className="mt-1 truncate text-sm text-slate-500">{jobTitleForApplication(item)}</p></div><span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{item.stage || "Applied"}</span></div>)}</div>}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-900">Recent candidates</h3><p className="mt-1 text-sm text-slate-500">Recently added candidate profiles</p></div><button onClick={() => setActivePage("candidates")} className="text-sm font-semibold text-indigo-600">View candidates</button></div>
                {loading ? <p className="p-5 text-sm text-slate-500">Loading candidates…</p> : recentCandidates.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">No candidates found.</p> : <div className="divide-y divide-slate-100">{recentCandidates.map((candidate) => <div key={candidate.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(candidate.full_name)}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{candidate.full_name}</p><p className="truncate text-sm text-slate-500">{candidate.email}</p></div></div><span className="shrink-0 text-sm text-slate-500">{Number(candidate.experience_years || 0)} yrs experience</span></div>)}</div>}
              </section>
            </>
          ) : (
            <>
              <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">
                    TALENT MANAGEMENT
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Candidate directory
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Search, filter, add, and manage candidate profiles in one place.
                  </p>
                </div>
                <button
                  onClick={() => setModal({ candidate: null })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  <span className="text-lg">+</span> Add candidate
                </button>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Candidate directory
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Search, filter, and manage your candidate profiles.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  {pagination.total} candidate{pagination.total === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="relative md:col-span-2 xl:col-span-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    ⌕
                  </span>
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, email, or skills..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </label>

                <input
                  type="number"
                  min="0"
                  max="999.9"
                  step="0.1"
                  value={minExperience}
                  onChange={(event) => {
                    setMinExperience(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Min experience (years)"
                  aria-label="Minimum experience"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

                <input
                  type="number"
                  min="0"
                  max="999.9"
                  step="0.1"
                  value={maxExperience}
                  onChange={(event) => {
                    setMaxExperience(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Max experience (years)"
                  aria-label="Maximum experience"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters ×
                </button>
              )}
            </div>

            {notice && (
              <div
                role="status"
                className="border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-800"
              >
                {notice}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700"
              >
                {error}
                <button
                  onClick={loadCandidates}
                  className="ml-3 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-slate-50/80">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Skills</th>
                    <th className="px-6 py-4">Experience</th>
                    <th className="px-6 py-4">Added on</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-sm text-slate-500">
                        Loading candidates...
                      </td>
                    </tr>
                  ) : candidates.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                          ♙
                        </div>
                        <p className="mt-4 font-semibold text-slate-800">
                          No candidates found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or add a new candidate.
                        </p>
                        <button
                          onClick={() => setModal({ candidate: null })}
                          className="mt-4 font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          + Add your first candidate
                        </button>
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                              {initials(candidate.full_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {candidate.full_name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {candidate.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-6 py-4">
                          <p className="line-clamp-2 text-sm text-slate-600">
                            {candidate.skills || "Not specified"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-semibold text-emerald-700">
                            {Number(candidate.experience_years)} yrs
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {formatDate(candidate.created_at)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              title="Edit candidate"
                              onClick={() => setModal({ candidate })}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              Edit
                            </button>
                            <button
                              title="Delete candidate"
                              onClick={() => deleteCandidate(candidate)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-red-600 hover:border-red-200 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">
                Page {pagination.page || 1} of {Math.max(1, pagination.totalPages || 0)}
                {" · "}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  ← Previous
                </button>
                <button
                  disabled={
                    loading ||
                    page >= Math.max(1, pagination.totalPages || 0)
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            </div>
              </section>
            </>
          )}

          <footer className="flex flex-col justify-between gap-2 pb-4 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} HireFlow ATS</p>
            <p>Built with React, Tailwind CSS, Express & MySQL</p>
          </footer>
        </div>
        )}
      </main>

      {modal && (
        <CandidateModal
          candidate={modal.candidate}
          onClose={() => setModal(null)}
          onSaved={refreshAfterSave}
        />
      )}
      {jobModal && <JobModal job={jobModal.job} onClose={() => setJobModal(null)} onSaved={async (wasEdit) => { setJobsNotice(wasEdit ? "Job updated successfully." : "Job added successfully."); await loadJobs(); await loadMetrics(); }} />}
    </div>
  );
}
