"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const emptyResult = {
  documentType: "Academic Transcript",
  registrationNumber: "",
  documentNumber: "",
  studentName: "",
  programme: "",
  examSession: "",
  issueDate: "",
};

const documentTypes = ["Degree", "Academic Transcript", "Skill Development Certificate"];

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function readableSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Login({ onAuthenticated }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!pin) return setError("Enter the admin PIN.");
    setLoading(true);
    setError("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      onAuthenticated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login-visual">
        <Link href="/">← Back to verification</Link>
        <div>
          <span className="eyebrow">Academic Records Office</span>
          <h1>Results<br />administration.</h1>
          <p>Enter the verification identifiers for a record and upload the result PDF that the public portal should display.</p>
        </div>
        <aside>
          <strong>UNIVERSITY RECORDS PORTAL</strong>
          <span>Manage the result documents available through public verification.</span>
        </aside>
      </section>
      <section className="admin-login-panel">
        <form onSubmit={submit}>
          <img src="/assets/portal-mark.svg" alt="Academic Records Office" />
          <span className="eyebrow">Restricted access</span>
          <h2>Enter admin PIN</h2>
          <p>Use the PIN configured in the server environment.</p>
          <label htmlFor="admin-pin">Admin PIN</label>
          <input
            id="admin-pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            autoFocus
          />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="orange-button wide-button" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in to administration"} <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function TextField({ label, name, form, onChange, required = false, full = false, ...props }) {
  return (
    <label className={full ? "full-field" : ""}>
      <span>{label}{required ? " *" : ""}</span>
      <input name={name} value={form[name] ?? ""} onChange={onChange} required={required} {...props} />
    </label>
  );
}

function Editor({ record, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...emptyResult,
    ...(record
      ? {
          documentType: record.documentType,
          registrationNumber: record.registrationNumber,
          documentNumber: record.documentNumber,
          studentName: record.studentName,
          programme: record.programme || "",
          examSession: record.examSession || "",
          issueDate: record.issueDate || "",
        }
      : {}),
  }));
  const [pdf, setPdf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    if (!record && !pdf) {
      setError("Upload the result PDF for this record.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.set("payload", JSON.stringify(form));
      if (pdf) body.set("resultPdf", pdf);
      const data = await api(record ? `/api/admin/results/${record.id}` : "/api/admin/results", {
        method: record ? "PUT" : "POST",
        body,
      });
      onSaved(data.result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editor-overlay">
      <button className="editor-backdrop" type="button" onClick={onClose} aria-label="Close editor" />
      <section className="result-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header>
          <div>
            <span className="eyebrow">PDF result record</span>
            <h2 id="editor-title">{record ? "Edit result" : "Add result"}</h2>
          </div>
          <button className="editor-close" type="button" onClick={onClose}>×</button>
        </header>
        <form onSubmit={save}>
          <fieldset>
            <legend><b>01</b> Public verification identifiers</legend>
            <p className="fieldset-note">
              A visitor is shown this PDF only when all three values match exactly what is entered here.
            </p>
            <div className="editor-grid">
              <label>
                <span>Document type *</span>
                <select name="documentType" value={form.documentType} onChange={field} required>
                  {documentTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <TextField label="Registration number" name="registrationNumber" form={form} onChange={field} required />
              <TextField label="Document number" name="documentNumber" form={form} onChange={field} required />
            </div>
          </fieldset>

          <fieldset>
            <legend><b>02</b> Result PDF</legend>
            <p className="fieldset-note">
              The uploaded file is stored in Supabase storage; only a reference is kept in MySQL.
            </p>
            <label className="photo-input full-field">
              <span>{record ? "Replace PDF (optional)" : "Result PDF *"}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => { setPdf(event.target.files?.[0] || null); setError(""); }}
              />
              {record?.pdfFilename && (
                <small>
                  Current file: <b>{record.pdfFilename}</b> ({readableSize(record.pdfSizeBytes)}){" "}
                  <a href={record.pdfUrl} target="_blank" rel="noreferrer">Open ↗</a>
                </small>
              )}
              {pdf && <small>Selected: {pdf.name} ({readableSize(pdf.size)})</small>}
            </label>
          </fieldset>

          <fieldset>
            <legend><b>03</b> Reference details</legend>
            <p className="fieldset-note">Used to label the record in this dashboard and above the PDF viewer.</p>
            <div className="editor-grid">
              <TextField label="Student name" name="studentName" form={form} onChange={field} required />
              <TextField label="Programme" name="programme" form={form} onChange={field} />
              <TextField label="Examination session" name="examSession" form={form} onChange={field} />
              <TextField label="Issue date" name="issueDate" form={form} onChange={field} type="date" />
            </div>
          </fieldset>

          {error && <p className="editor-error" role="alert">{error}</p>}
          <footer>
            <button className="outline-button" type="button" onClick={onClose}>Cancel</button>
            <button className="orange-button" type="submit" disabled={saving}>
              {saving ? "Uploading result…" : record ? "Save changes" : "Publish result"} <span>→</span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(null);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState(undefined);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [message, setMessage] = useState("");

  const storedBytes = useMemo(
    () => results.reduce((total, result) => total + (result.pdfSizeBytes || 0), 0),
    [results],
  );

  async function loadResults(query = "") {
    setLoading(true);
    try {
      const data = await api(`/api/admin/results${query ? `?query=${encodeURIComponent(query)}` : ""}`);
      setResults(data.results);
    } catch (error) {
      if (error.message.includes("authentication")) setAuthenticated(false);
      else setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api("/api/admin/session")
      .then(() => {
        setAuthenticated(true);
        loadResults();
      })
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return undefined;
    const timer = setTimeout(() => loadResults(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search, authenticated]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  async function removeRecord() {
    if (!deleteRecord) return;
    try {
      await api(`/api/admin/results/${deleteRecord.id}`, { method: "DELETE" });
      setDeleteRecord(null);
      setMessage("Result removed.");
      await loadResults(search.trim());
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (authenticated === null) return <main className="admin-loading">Loading administration…</main>;
  if (!authenticated) return <Login onAuthenticated={() => { setAuthenticated(true); loadResults(); }} />;

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link href="/"><img src="/assets/portal-mark.svg" alt="Academic Records Office" /></Link>
        <span>ADMINISTRATION</span>
        <nav>
          <button className="active" type="button">▦ <b>Result records</b><em>{results.length}</em></button>
          <Link href="/" target="_blank">↗ <b>Public verifier</b></Link>
        </nav>
        <div>
          <p><i /> Secure admin session</p>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-page-header">
          <div>
            <span className="eyebrow">PDF records management</span>
            <h1>Exam results</h1>
          </div>
          <button className="orange-button" type="button" onClick={() => setEditor(null)}>+ Add result</button>
        </header>

        <section className="admin-metrics">
          <article><span>Total records</span><strong>{results.length}</strong><p>Published to the verifier</p></article>
          <article><span>Stored PDFs</span><strong>{readableSize(storedBytes)}</strong><p>Held in Supabase storage</p></article>
          <article>
            <span>Last updated</span>
            <strong>{results[0]?.updatedAt ? new Date(results[0].updatedAt).toLocaleDateString("en-IN") : "—"}</strong>
            <p>Most recent record change</p>
          </article>
        </section>

        <section className="admin-records">
          <header>
            <div><h2>All result records</h2><p>Each record maps the three lookup identifiers to one uploaded PDF.</p></div>
            <input
              type="search"
              placeholder="Search name, registration or document…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </header>
          {message && <p className="admin-message">{message}</p>}
          {loading ? (
            <div className="records-empty">Loading records…</div>
          ) : !results.length ? (
            <div className="records-empty">
              <strong>No results yet</strong>
              <p>Add the identifiers for a record and upload its result PDF.</p>
              <button className="orange-button" type="button" onClick={() => setEditor(null)}>Add first result</button>
            </div>
          ) : (
            <div className="records-table-wrap">
              <table>
                <thead><tr><th>Candidate</th><th>Registration</th><th>Document</th><th>Session</th><th>PDF</th><th /></tr></thead>
                <tbody>
                  {results.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.studentName}</strong><small>{record.programme}</small></td>
                      <td className="mono">{record.registrationNumber}</td>
                      <td><strong className="mono">{record.documentNumber}</strong><small>{record.documentType}</small></td>
                      <td>{record.examSession || "—"}</td>
                      <td>
                        <a href={record.pdfUrl} target="_blank" rel="noreferrer">View ↗</a>
                        <small>{readableSize(record.pdfSizeBytes)}</small>
                      </td>
                      <td>
                        <div className="record-actions">
                          <button type="button" onClick={() => setEditor(record)} aria-label={`Edit ${record.studentName}`}>✎</button>
                          <button type="button" onClick={() => setDeleteRecord(record)} aria-label={`Delete ${record.studentName}`}>×</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {editor !== undefined && (
        <Editor
          record={editor}
          onClose={() => setEditor(undefined)}
          onSaved={async () => {
            setEditor(undefined);
            setMessage(editor ? "Result updated." : "Result published.");
            await loadResults(search.trim());
          }}
        />
      )}

      {deleteRecord && (
        <div className="confirm-overlay">
          <section>
            <span>!</span>
            <h2>Remove this result?</h2>
            <p>The record and its uploaded PDF will be permanently deleted.</p>
            <div>
              <button className="outline-button" type="button" onClick={() => setDeleteRecord(null)}>Keep record</button>
              <button className="danger-button" type="button" onClick={removeRecord}>Remove result</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
