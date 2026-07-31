"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRef, useState } from "react";
import Transcript from "./Transcript";

const initialForm = {
  documentType: "",
  registrationNumber: "",
  documentNumber: "",
};

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Academic Records Office home">
        <img src="/assets/portal-mark.svg" alt="Academic Records Office" />
      </Link>
      <nav className="desktop-nav">
        <a href="#verification">VERIFICATION</a>
        <a href="#process">HOW IT WORKS</a>
        <a href="#about">ABOUT</a>
        <a className="admin-link" href="/admin">
          Admin login ↗
        </a>
      </nav>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
        <b className="sr-only">Toggle navigation</b>
      </button>
      {menuOpen && (
        <nav className="mobile-nav">
          <a href="#verification">Verification</a>
          <a href="#process">How it works</a>
          <a href="#about">About</a>
          <a href="/admin">Admin login</a>
        </nav>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer id="about" className="site-footer">
      <div>
        <img src="/assets/portal-mark.svg" alt="Academic Records Office" />
        <span className="footer-label">UNIVERSITY RECORDS PORTAL</span>
        <h2>Academic Document Verification</h2>
        <p>Structured result verification with HTML transcript generation.</p>
      </div>
      <div>
        <h2>Verification help</h2>
        <a href="#verification">Start verification</a>
        <a href="#process">How it works</a>
        <a href="/admin">Staff administration</a>
      </div>
      <div>
        <h2>Supported records</h2>
        <span>Degree certificates</span>
        <span>Academic transcripts</span>
        <span>Skill certificates</span>
        <span>Candidate photographs</span>
      </div>
      <div>
        <h2>Records service</h2>
        <p>
          Verify published academic records using the document type, registration number, and document number.
        </p>
      </div>
    </footer>
  );
}

export default function Verifier() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const transcriptRef = useRef(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  async function verify(event) {
    event.preventDefault();
    if (!form.documentType || !form.registrationNumber.trim() || !form.documentNumber.trim()) {
      setError("Select a document type and enter both reference numbers.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The record could not be verified.");
      setResult(data.result);
      setTimeout(() => document.querySelector("#verified-result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    if (!transcriptRef.current) return;
    setDownloading(true);
    try {
      const images = [...transcriptRef.current.querySelectorAll("img")];
      await Promise.all(
        images.map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
              }),
        ),
      );
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(transcriptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = 210;
      const pageHeight = 297;
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      const pageCount = Math.max(1, Math.ceil((imageHeight - 0.5) / pageHeight));
      const image = canvas.toDataURL("image/jpeg", 0.94);

      for (let page = 0; page < pageCount; page += 1) {
        if (page > 0) pdf.addPage();
        pdf.addImage(image, "JPEG", 0, -(page * pageHeight), pageWidth, imageHeight, undefined, "FAST");
      }
      const filename = `${result.registrationNumber}-${result.certificateNumber || "transcript"}`
        .replace(/[^A-Za-z0-9._-]/g, "_")
        .slice(0, 100);
      pdf.save(`${filename}.pdf`);
    } catch (downloadError) {
      setError(`PDF generation failed: ${downloadError.message}`);
    } finally {
      setDownloading(false);
    }
  }

  function resetVerification() {
    setResult(null);
    setForm(initialForm);
    setError("");
    setTimeout(() => document.querySelector("#documentType")?.focus(), 0);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section id="verification" className="verification-section">
          <div className="verification-shell">
            <span className="eyebrow">Secure records lookup</span>
            <h1>Academic Transcript / Diploma / Degree Authentication</h1>
            <img className="verification-mark" src="/assets/portal-mark.svg" alt="" />
            <div className="verification-rule" />

            {!result && (
              <form className="verification-form" onSubmit={verify}>
                <label htmlFor="documentType">Select Document to Verify:</label>
                <select id="documentType" name="documentType" value={form.documentType} onChange={updateField}>
                  <option value="">--- Select ---</option>
                  <option value="Degree">Degree</option>
                  <option value="Academic Transcript">Academic Transcript</option>
                  <option value="Skill Development Certificate">Skill Development Certificate</option>
                </select>
                <label htmlFor="registrationNumber">Registration Number:</label>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  value={form.registrationNumber}
                  onChange={updateField}
                  autoComplete="off"
                />
                <label htmlFor="documentNumber">Document Number:</label>
                <input
                  id="documentNumber"
                  name="documentNumber"
                  value={form.documentNumber}
                  onChange={updateField}
                  autoComplete="off"
                />
                <span />
                <div className="verification-action">
                  <button className="blue-button" type="submit" disabled={loading}>
                    {loading ? "Authenticating…" : "Authenticate"} <span>→</span>
                  </button>
                  {error && <p role="alert">{error}</p>}
                </div>
              </form>
            )}
          </div>
        </section>

        {result && (
          <section id="verified-result" className="verified-result-section">
            <div className="result-toolbar">
              <div>
                <span className="verified-badge">✓ Record matched</span>
                <h2>Structured transcript preview</h2>
                <p>The PDF is generated from this HTML only when requested.</p>
              </div>
              <div>
                <button className="outline-button" type="button" onClick={resetVerification}>
                  Verify another
                </button>
                <button className="orange-button" type="button" onClick={downloadPdf} disabled={downloading}>
                  {downloading ? "Generating PDF…" : "Download PDF"} <span>↓</span>
                </button>
              </div>
            </div>
            {error && <p className="result-error">{error}</p>}
            <div className="transcript-stage">
              <Transcript result={result} documentRef={transcriptRef} />
            </div>
          </section>
        )}

        <section id="process" className="process-strip">
          <div>
            <span>01</span>
            <h2>Select document type</h2>
            <p>Choose the same record category configured by the administrator.</p>
          </div>
          <div>
            <span>02</span>
            <h2>Enter exact identifiers</h2>
            <p>All three lookup values must match before result data is returned.</p>
          </div>
          <div>
            <span>03</span>
            <h2>Render and download</h2>
            <p>The transcript is structured HTML and becomes a PDF only on request.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
