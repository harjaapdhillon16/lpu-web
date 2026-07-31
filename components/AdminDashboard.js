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
  fatherName: "",
  motherName: "",
  batchYear: "",
  studyMode: "",
  examSession: "",
  resultStatus: "Completed",
  cgpa: "",
  equivalentPercentage: "",
  issueDate: "",
  certificateNumber: "",
  printDate: "",
  place: "Phagwara (Punjab)",
  completionStatement: "The student has successfully completed the Programme",
  terms: [],
};

function emptyTerm(number) {
  return { label: `Term : ${number}`, tgpa: "", percentage: "", courses: [] };
}

function emptyCourse() {
  return { code: "", name: "", credits: "", grade: "" };
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
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
          <p>Enter every transcript field, candidate photograph, term, course, credit, and grade as structured data.</p>
        </div>
        <aside>
          <strong>UNIVERSITY RECORDS PORTAL</strong>
          <span>Manage the structured records available through public verification.</span>
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

function Editor({ record, onClose, onSaved }) {
  const [form, setForm] = useState(() => (record ? structuredClone(record) : structuredClone(emptyResult)));
  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  function updateTerm(index, key, value) {
    setForm((current) => ({
      ...current,
      terms: current.terms.map((term, termIndex) => (termIndex === index ? { ...term, [key]: value } : term)),
    }));
  }

  function addTerm() {
    setForm((current) => ({ ...current, terms: [...current.terms, emptyTerm(current.terms.length + 1)] }));
  }

  function removeTerm(index) {
    setForm((current) => ({ ...current, terms: current.terms.filter((_, termIndex) => termIndex !== index) }));
  }

  function addCourse(termIndex) {
    setForm((current) => ({
      ...current,
      terms: current.terms.map((term, index) =>
        index === termIndex ? { ...term, courses: [...term.courses, emptyCourse()] } : term,
      ),
    }));
  }

  function updateCourse(termIndex, courseIndex, key, value) {
    setForm((current) => ({
      ...current,
      terms: current.terms.map((term, index) =>
        index === termIndex
          ? {
              ...term,
              courses: term.courses.map((course, indexOfCourse) =>
                indexOfCourse === courseIndex ? { ...course, [key]: value } : course,
              ),
            }
          : term,
      ),
    }));
  }

  function removeCourse(termIndex, courseIndex) {
    setForm((current) => ({
      ...current,
      terms: current.terms.map((term, index) =>
        index === termIndex
          ? { ...term, courses: term.courses.filter((_, indexOfCourse) => indexOfCourse !== courseIndex) }
          : term,
      ),
    }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (photo && photo.size > 2 * 1024 * 1024) throw new Error("The candidate photo must be 2 MB or smaller.");
      const body = new FormData();
      const payload = { ...form };
      delete payload.hasPhoto;
      delete payload.photoFilename;
      delete payload.photoUrl;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.id;
      body.set("payload", JSON.stringify(payload));
      if (photo) body.set("candidatePhoto", photo);
      body.set("removePhoto", String(removePhoto));

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
            <span className="eyebrow">{record ? "Edit structured record" : "New structured record"}</span>
            <h2 id="editor-title">{record ? "Edit exam result" : "Add exam result"}</h2>
          </div>
          <button className="editor-close" type="button" onClick={onClose}>×</button>
        </header>

        <form onSubmit={save}>
          <fieldset>
            <legend><span>01</span> Verification identity</legend>
            <div className="editor-grid">
              <label className="full-field">
                <span>Document type *</span>
                <select name="documentType" value={form.documentType} onChange={field}>
                  <option value="Degree">Degree</option>
                  <option value="Academic Transcript">Academic Transcript</option>
                  <option value="Skill Development Certificate">Skill Development Certificate</option>
                </select>
              </label>
              <label>
                <span>Registration number *</span>
                <input name="registrationNumber" value={form.registrationNumber} onChange={field} required />
              </label>
              <label>
                <span>Document number *</span>
                <input name="documentNumber" value={form.documentNumber} onChange={field} required />
              </label>
              <label>
                <span>Certificate number</span>
                <input name="certificateNumber" value={form.certificateNumber} onChange={field} />
              </label>
              <label>
                <span>Examination session *</span>
                <input name="examSession" value={form.examSession} onChange={field} placeholder="e.g. May 2026" required />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span> Candidate information</legend>
            <div className="editor-grid">
              <label className="full-field">
                <span>Candidate name *</span>
                <input name="studentName" value={form.studentName} onChange={field} required />
              </label>
              <label>
                <span>Father&apos;s name</span>
                <input name="fatherName" value={form.fatherName} onChange={field} />
              </label>
              <label>
                <span>Mother&apos;s name</span>
                <input name="motherName" value={form.motherName} onChange={field} />
              </label>
              <label>
                <span>Batch year *</span>
                <input name="batchYear" value={form.batchYear} onChange={field} placeholder="e.g. 2022" required />
              </label>
              <label>
                <span>Study mode *</span>
                <input name="studyMode" value={form.studyMode} onChange={field} placeholder="e.g. Regular" required />
              </label>
              <label className="full-field">
                <span>Programme *</span>
                <input name="programme" value={form.programme} onChange={field} required />
              </label>
              <label className="full-field photo-input">
                <span>Candidate photo · JPG, PNG or WebP · 2 MB maximum</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={(event) => {
                    setPhoto(event.target.files?.[0] || null);
                    setRemovePhoto(false);
                  }}
                />
                <small>
                  {photo?.name || (record?.hasPhoto ? `Current: ${record.photoFilename || "candidate photo"}` : "No photo selected")}
                </small>
              </label>
              {record?.hasPhoto && (
                <label className="remove-photo full-field">
                  <input
                    type="checkbox"
                    checked={removePhoto}
                    onChange={(event) => {
                      setRemovePhoto(event.target.checked);
                      if (event.target.checked) setPhoto(null);
                    }}
                  />
                  Remove current candidate photo
                </label>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>03</span> Overall result and document footer</legend>
            <div className="editor-grid">
              <label>
                <span>Result status *</span>
                <select name="resultStatus" value={form.resultStatus} onChange={field}>
                  <option>Pass</option>
                  <option>Distinction</option>
                  <option>First Division</option>
                  <option>Second Division</option>
                  <option>Completed</option>
                </select>
              </label>
              <label>
                <span>CGPA</span>
                <input name="cgpa" type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={field} />
              </label>
              <label>
                <span>Equivalent percentage</span>
                <input
                  name="equivalentPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.equivalentPercentage}
                  onChange={field}
                />
              </label>
              <label>
                <span>Issue date *</span>
                <input name="issueDate" type="date" value={form.issueDate} onChange={field} required />
              </label>
              <label>
                <span>Print date *</span>
                <input name="printDate" type="date" value={form.printDate} onChange={field} required />
              </label>
              <label>
                <span>Place *</span>
                <input name="place" value={form.place} onChange={field} required />
              </label>
              <label className="full-field">
                <span>Completion statement</span>
                <input name="completionStatement" value={form.completionStatement} onChange={field} />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <div className="terms-heading">
              <legend><span>04</span> Terms and course rows</legend>
              <button className="small-outline-button" type="button" onClick={addTerm}>+ Add term</button>
            </div>
            {!form.terms.length && (
              <div className="no-terms">
                <p>No terms added yet. Add a term, then enter each course as plain text.</p>
                <button type="button" onClick={addTerm}>Add first term</button>
              </div>
            )}
            <div className="term-editors">
              {form.terms.map((term, termIndex) => (
                <section className="term-editor" key={termIndex}>
                  <header>
                    <div className="term-meta-inputs">
                      <label>
                        <span>Term label</span>
                        <input
                          value={term.label}
                          onChange={(event) => updateTerm(termIndex, "label", event.target.value)}
                        />
                      </label>
                      <label>
                        <span>TGPA</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={term.tgpa}
                          onChange={(event) => updateTerm(termIndex, "tgpa", event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Equivalent %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={term.percentage}
                          onChange={(event) => updateTerm(termIndex, "percentage", event.target.value)}
                        />
                      </label>
                    </div>
                    <button type="button" onClick={() => removeTerm(termIndex)} aria-label="Remove term">×</button>
                  </header>
                  <div className="course-editor-heading">
                    <strong>Course rows</strong>
                    <button type="button" onClick={() => addCourse(termIndex)}>+ Add course</button>
                  </div>
                  {!term.courses.length && <p className="empty-courses">No courses in this term.</p>}
                  {term.courses.map((course, courseIndex) => (
                    <div className="course-editor-row" key={courseIndex}>
                      <span>{courseIndex + 1}</span>
                      <input
                        placeholder="Course code"
                        value={course.code}
                        onChange={(event) => updateCourse(termIndex, courseIndex, "code", event.target.value)}
                      />
                      <input
                        placeholder="Course name"
                        value={course.name}
                        onChange={(event) => updateCourse(termIndex, courseIndex, "name", event.target.value)}
                      />
                      <input
                        placeholder="Credits"
                        type="number"
                        min="0"
                        max="99"
                        step="0.5"
                        value={course.credits}
                        onChange={(event) => updateCourse(termIndex, courseIndex, "credits", event.target.value)}
                      />
                      <input
                        placeholder="Grade"
                        value={course.grade}
                        onChange={(event) => updateCourse(termIndex, courseIndex, "grade", event.target.value)}
                      />
                      <button type="button" onClick={() => removeCourse(termIndex, courseIndex)} aria-label="Remove course">×</button>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </fieldset>

          {error && <p className="editor-error" role="alert">{error}</p>}
          <footer>
            <button className="outline-button" type="button" onClick={onClose}>Cancel</button>
            <button className="orange-button" type="submit" disabled={saving}>
              {saving ? "Saving structured result…" : record ? "Save changes" : "Publish result"} <span>→</span>
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

  const photoCount = useMemo(() => results.filter((result) => result.hasPhoto).length, [results]);

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
            <span className="eyebrow">Structured records management</span>
            <h1>Exam results</h1>
          </div>
          <button className="orange-button" type="button" onClick={() => setEditor(null)}>+ Add result</button>
        </header>

        <section className="admin-metrics">
          <article><span>Total records</span><strong>{results.length}</strong><p>Published to the verifier</p></article>
          <article><span>Candidate photos</span><strong>{photoCount}</strong><p>Stored securely in MySQL</p></article>
          <article>
            <span>Last updated</span>
            <strong>{results[0]?.updatedAt ? new Date(results[0].updatedAt).toLocaleDateString("en-IN") : "—"}</strong>
            <p>Most recent record change</p>
          </article>
        </section>

        <section className="admin-records">
          <header>
            <div><h2>All result records</h2><p>Plain fields are rendered into the public transcript HTML.</p></div>
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
              <p>Create the first structured transcript record.</p>
              <button className="orange-button" type="button" onClick={() => setEditor(null)}>Add first result</button>
            </div>
          ) : (
            <div className="records-table-wrap">
              <table>
                <thead><tr><th>Candidate</th><th>Registration</th><th>Document</th><th>Session</th><th>Terms</th><th>Photo</th><th /></tr></thead>
                <tbody>
                  {results.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.studentName}</strong><small>{record.programme}</small></td>
                      <td className="mono">{record.registrationNumber}</td>
                      <td><strong className="mono">{record.documentNumber}</strong><small>{record.documentType}</small></td>
                      <td>{record.examSession}</td>
                      <td>{record.terms.length}</td>
                      <td>{record.hasPhoto ? "● Added" : "○ None"}</td>
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
            <p>The structured record and candidate photo will be permanently deleted.</p>
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
