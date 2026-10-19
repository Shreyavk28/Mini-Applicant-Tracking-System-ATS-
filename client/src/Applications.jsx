import { useCallback, useEffect, useState } from "react";
import { applicationApi } from "./api";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offered",
  "Hired",
  "Rejected",
];

const EMPTY_FORM = {
  candidate_id: "",
  job_id: "",
  stage: "Applied",
};

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.errors?.join(", ") ||
        `Request failed (${response.status})`
    );
  }

  return result;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stageStyle(stage) {
  const styles = {
    Applied: "bg-blue-50 text-blue-700",
    Screening: "bg-violet-50 text-violet-700",
    Interview: "bg-amber-50 text-amber-700",
    Offered: "bg-cyan-50 text-cyan-700",
    Hired: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-red-50 text-red-700",
  };

  return styles[stage] || "bg-slate-100 text-slate-700";
}

function ApplicationModal({ candidates, jobs, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.candidate_id || !form.job_id || !form.stage) {
      setError("Please select a candidate, a job, and an application stage.");
      return;
    }

    setSaving(true);

    try {
      await fetchJson("/applications", {
        method: "POST",
        body: JSON.stringify({
          candidate_id: Number(form.candidate_id),
          job_id: Number(form.job_id),
          stage: form.stage,
        }),
      });

      await onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to create the application.");
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
              Talent operations
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Add application
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Link an existing candidate to a job opening.
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

        {candidates.length === 0 || jobs.length === 0 ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {candidates.length === 0
              ? "No candidates are available. Add a candidate first."
              : "No jobs are available. Add a job before creating an application."}
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Candidate *
              </span>
              <select
                name="candidate_id"
                value={form.candidate_id}
                onChange={change}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">Select a candidate</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name} ({candidate.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Job position *
              </span>
              <select
                name="job_id"
                value={form.job_id}
                onChange={change}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">Select a job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                    {job.department ? ` — ${job.department}` : ""}
                    {job.location ? ` (${job.location})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Initial stage *
              </span>
              <select
                name="stage"
                value={form.stage}
                onChange={change}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

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
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || candidates.length === 0 || jobs.length === 0}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "Add application"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stageFilter, setStageFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [applicationResult, jobResult, candidateResult] = await Promise.all([
        applicationApi.list({
          stage: stageFilter,
          job_id: jobFilter,
        }),
        fetchJson("/jobs"),
        fetchJson("/candidates?limit=100"),
      ]);

      setApplications(applicationResult.data || []);
      setJobs(jobResult.data || []);
      setCandidates(candidateResult.data || []);
    } catch (err) {
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, [stageFilter, jobFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function createApplication() {
    setNotice("Application created successfully.");
    await loadApplications();
  }

  async function changeStage(application, stage) {
    if (application.stage === stage) return;

    setBusyId(application.id);
    setError("");
    setNotice("");

    try {
      await applicationApi.updateStage(application.id, stage);
      setNotice(`Application stage updated to ${stage}.`);
      await loadApplications();
    } catch (err) {
      setError(err.message || "Unable to update the application stage.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteApplication(application) {
    const confirmed = window.confirm(
      `Delete this application for ${
        application.candidate_name || "this candidate"
      }? This cannot be undone.`
    );

    if (!confirmed) return;

    setBusyId(application.id);
    setError("");
    setNotice("");

    try {
      await applicationApi.remove(application.id);
      setApplications((current) =>
        current.filter((item) => item.id !== application.id)
      );
      setNotice("Application deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete the application.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            TALENT OPERATIONS
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Applications
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Track candidates through every stage of your hiring pipeline.
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setNotice("");
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          <span className="text-lg">+</span> Add application
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Application directory
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {applications.length} application
              {applications.length === 1 ? "" : "s"} displayed
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              aria-label="Filter by stage"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">All stages</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>

            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              aria-label="Filter by job"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
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
              onClick={loadApplications}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4">Applied on</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="font-semibold text-slate-800">
                      No applications found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create an application to link a candidate to a job.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      + Add your first application
                    </button>
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr
                    key={application.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">
                        {application.candidate_name || "Unknown candidate"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {application.candidate_email || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">
                        {application.job_title || "Unknown position"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[application.department, application.location]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDate(application.applied_at || application.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stageStyle(
                            application.stage
                          )}`}
                        >
                          {application.stage}
                        </span>
                        <select
                          value={application.stage}
                          disabled={busyId === application.id}
                          onChange={(event) =>
                            changeStage(application, event.target.value)
                          }
                          aria-label={`Change stage for ${
                            application.candidate_name || "application"
                          }`}
                          className="block max-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500 disabled:opacity-50"
                        >
                          {STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={busyId === application.id}
                        onClick={() => deleteApplication(application)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <ApplicationModal
          candidates={candidates}
          jobs={jobs}
          onClose={() => setShowModal(false)}
          onCreated={createApplication}
        />
      )}
    </div>
  );
}
