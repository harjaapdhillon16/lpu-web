"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Transcript from "./Transcript";

const initialForm = {
  documentType: "",
  registrationNumber: "",
  documentNumber: "",
};

const topLinks = [
  ["JOBS", "https://www.lpu.in/jobs/"],
  ["HAPPENINGS", "https://happenings.lpu.in/"],
  ["FRESHMEN INDUCTION", "https://www.lpu.in/events/freshmeninduction/"],
  ["STUDY ABROAD", "https://www.lpu.in/international-relations/"],
  ["LPUNEST", "https://www.lpu.in/nest/"],
  ["INTERNATIONAL ADMISSIONS", "https://www.lpu.in/international/"],
  ["ONLINE EDUCATION", "https://www.lpuonline.com/"],
  ["DISTANCE EDUCATION", "https://www.lpude.in/"],
  ["CONTACT", "https://www.lpu.in/contact-us/contact-us.php"],
];

const mainLinks = [
  ["ABOUT", "https://www.lpu.in/about-lpu/", true],
  ["ADMISSIONS", "https://www.lpu.in/admission/admissions.php", true],
  ["ACADEMICS", "https://www.lpu.in/academics/", true],
  ["CAMPUS LIFE", "https://www.lpu.in/campus-life/entrepreneurship.php", true],
  ["PLACEMENTS", "https://www.lpu.in/placements.php", false],
  ["RESEARCH", "https://www.lpu.in/academics/research.php", true],
];

const footerGroups = [
  {
    title: "Admissions",
    links: [
      ["Admissions 2026-27", "https://www.lpu.in/admission/admissions.php"],
      ["International Admission 2026-27", "https://www.lpu.in/international/"],
      ["Distance Education Admissions", "https://www.lpude.in/admissions/overview.php"],
      ["Online Education Admissions", "https://www.lpuonline.com/"],
      ["Scholarship & Financial Aid", "https://www.lpu.in/scholarship/scholarship.php"],
      ["Reserved Seats", null],
      ["Fee Deposits", "https://www.lpu.in/frmloginaccounts.aspx"],
      ["FAQs", "https://www.lpu.in/faq.php"],
      ["LPU Blog", "https://www.lpu.in/blog"],
      ["Download Prospectus", "https://www.lpu.in/admission/prospectus-and-forms.php"],
    ],
  },
  {
    title: "Academics",
    links: [
      ["Conferences", "https://www.lpu.in/conferences/"],
      ["Joint Placement Drive", "https://www.lpu.in/jpd"],
      ["Alumni", "https://alumni.lpu.in/"],
      ["Entrepreneurship", "https://www.lpu.in/campus-life/entrepreneurship.php"],
      ["Top Engineering College in India", "https://www.lpu.in/engineering/"],
      ["Top MBA Colleges", "https://www.lpu.in/mba/"],
      ["Entitlement Application (OL)", "https://lpu.in/downloads/UGC-Application-OL-2025-26.pdf"],
      ["Entitlement Application (ODL)", "https://lpu.in/downloads/UGC-Application-ODL-2025-26.pdf"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Happenings", "https://happenings.lpu.in/"],
      ["Convocations@LPU", "https://www.lpu.in/convocation/convocation-pictures.php"],
      ["Distance Education", "http://www.lpude.in/"],
      ["Online Education", "https://www.lpuonline.com/"],
      ["Online Fee Payment", "https://www.lpu.in/frmLoginAccounts.aspx"],
      ["UMS Login", "https://ums.lpu.in/lpuums/"],
      ["Apply Certificate", "https://ums.lpu.in/lpuums/LoginNew.aspx?loginPage=ExtCert"],
      ["eSanad", "https://www.lpu.in/esanad/"],
      ["UGC Cyber Hygiene Handbook", "https://www.lpu.in/downloads/a_handbook_on_basics_of_cyber_hygiene.pdf"],
    ],
  },
  {
    title: "Others",
    links: [
      ["NISP", "https://www.lpu.in/downloads/nisp.pdf"],
      ["NIRF", null],
      ["UGC Public Self Disclosure", "https://www.lpu.in/downloads/ugc-public-self-disclosure.pdf"],
      ["Act", "https://www.lpu.in/lpu-assets/download/act/act.pdf"],
      ["UGC e-Samadhan Portal", "https://samadhaan.ugc.ac.in"],
      ["Supplier Registration", "https://docs.google.com/forms/d/e/1FAIpQLScHTG-vQoSOKIRPGnuNZ2bc66M6BOpJXOxBUxOFAUdfz35UkA/viewform"],
      ["Careers @ LPU", "https://www.lpu.in/jobs"],
      ["Parent's Login", "https://ums.lpu.in/lpuums"],
      ["Tenders", "https://lpu.in/tenders/"],
    ],
  },
];

const footerBottomLinks = [
  ["Anti Ragging", "https://www.lpu.in/anti-ragging.php"],
  ["ICC", null],
  ["Student Well-Being", null],
  ["Privacy Policy", "https://www.lpu.in/privacy.php"],
  ["Disclaimer", "https://www.lpu.in/disclaimer.php"],
  ["Terms and Conditions", "https://www.lpu.in/terms-conditions.php"],
  ["Student Grievance Redressal", "https://www.lpu.in/student-grievance-redressal.php"],
  ["Caste Based Discrimination", "https://www.lpu.in/caste-based-discrimination.php"],
  ["RTI", "https://www.lpu.in/rti"],
  ["Feedback", "https://lovelyprofessionaluniversity.outgrow.us/LPU-Website-Survey"],
];

function getCountdown() {
  const closingTime = new Date("2026-07-31T23:59:59+05:30").getTime();
  const remaining = Math.max(0, closingTime - Date.now());
  const pad = (value) => String(value).padStart(2, "0");
  return {
    days: pad(Math.floor(remaining / 86400000)),
    hours: pad(Math.floor((remaining / 3600000) % 24)),
    minutes: pad(Math.floor((remaining / 60000) % 60)),
    seconds: pad(Math.floor((remaining / 1000) % 60)),
  };
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState(() => getCountdown());

  useEffect(() => {
    const update = () => setCountdown(getCountdown());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div className="lpu-announcement">
        <a href="https://admission.lpu.in/">
          <strong>Final Countdown Has Begun! Time Remaining:</strong>
          <span className="lpu-countdown" aria-label="Admissions closing countdown">
            <b suppressHydrationWarning>{countdown.days}</b><i>:</i>
            <b suppressHydrationWarning>{countdown.hours}</b><i>:</i>
            <b suppressHydrationWarning>{countdown.minutes}</b><i>:</i>
            <b suppressHydrationWarning>{countdown.seconds}</b>
          </span>
          <strong>Admissions Closing on <em>31 July 2026</em>, Apply Now</strong>
        </a>
      </div>
      <header className="site-header">
        <div className="lpu-header-row">
          <div className="lpu-header-logo">
            <a href="https://www.lpu.in/" aria-label="Lovely Professional University home">
              <img
                className="lpu-main-logo"
                src="https://www.lpu.in/images/logo/LPU-logo-dark.svg"
                alt="Lovely Professional University"
              />
            </a>
            <a href="https://www.lpu.in/" aria-label="LPU NAAC accreditation">
              <img
                className="lpu-naac-logo"
                src="https://www.lpu.in/images/logo/naac-logo-new.webp"
                alt="NAAC A++ grade"
              />
            </a>
          </div>
          <div className="lpu-header-right">
            <div className="lpu-top-links">
              <nav>
                {topLinks.map(([label, href]) => (
                  <a
                    className={label === "FRESHMEN INDUCTION" || label === "LPUNEST" ? "active" : ""}
                    href={href}
                    key={label}
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <img
                src="https://www.lpu.in/lpu-assets/images/logo/social-media-new.svg"
                alt="LPU"
              />
            </div>
            <div className="lpu-primary-row">
              <nav className="lpu-primary-nav">
                {mainLinks.map(([label, href, dropdown]) => (
                  <a href={href} key={label}>
                    {label}
                    {dropdown && <span className="lpu-chevron" aria-hidden="true" />}
                  </a>
                ))}
              </nav>
              <a className="lpu-search" href="https://www.lpu.in/result.php" aria-label="Search LPU">
                <img src="https://www.lpu.in/images/icons/Search.svg" alt="" />
              </a>
              <a className="lpu-apply" href="https://admission.lpu.in/">
                <span>Apply now</span>
                <img src="https://www.lpu.in/images/icons/arrow-dark.svg" alt="" />
              </a>
              <button
                className="menu-toggle"
                type="button"
                aria-expanded={menuOpen}
                aria-label="Toggle navigation"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="mobile-nav">
              {mainLinks.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
              <Link href="/admin">ADMIN LOGIN</Link>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}

function SocialIcons() {
  return (
    <div className="lpu-social-icons" aria-label="LPU social media">
      <a href="https://www.facebook.com/LPUUniversity" aria-label="Facebook">
        <svg viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" /></svg>
      </a>
      <a href="https://twitter.com/lpuuniversity" aria-label="X">
        <svg viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" /></svg>
      </a>
      <a href="https://www.instagram.com/lpuuniversity/?hl=en" aria-label="Instagram">
        <svg viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8z" /></svg>
      </a>
      <a href="https://www.linkedin.com/company/lovely-professional-university" aria-label="LinkedIn">
        <svg viewBox="0 0 448 512"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" /></svg>
      </a>
      <a href="https://www.youtube.com/user/LPUuniversity" aria-label="YouTube">
        <svg viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zM232.145 337.591V175.185l142.739 81.205z" /></svg>
      </a>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer id="about" className="lpu-site-footer">
      <div className="lpu-footer-main">
        <aside className="lpu-footer-address">
          <img
            className="lpu-footer-logo"
            src="https://www.lpu.in/lpu-assets/images/logo/logo-dark.svg"
            alt="Lovely Professional University"
          />
          <div className="lpu-locate">Locate Us</div>
          <strong>Lovely Professional University</strong>
          <p>Jalandhar-Delhi, G.T. Road,<br />Phagwara, Punjab<br />(INDIA) -144411.</p>
          <div className="lpu-phone">
            <a href="tel:+911824517000">Tel: +91-1824-517000</a>
            <a href="tel:+911824404404">Tel: +91-1824-404404</a>
          </div>
          <a className="lpu-directions" href="https://www.lpu.in/admission/lpu-in-your-town.php#lpu-town">
            <img src="https://www.lpu.in/lpu-assets/images/icons/chevron-right.svg" alt="" />
            Get Directions
          </a>
        </aside>
        <div className="lpu-footer-right">
          <div className="lpu-footer-icons">
            <section>
              <h2>Follow us</h2>
              <SocialIcons />
            </section>
            <section>
              <h2>LPU Touch</h2>
              <div className="lpu-touch-icons">
                <a href="https://play.google.com/store/apps/details?id=ums.lovely.university&hl=en" aria-label="Google Play">▶</a>
                <a href="https://itunes.apple.com/in/app/lputouch/id509819753?mt=8" aria-label="App Store">A</a>
              </div>
            </section>
            <section className="lpu-digital-links">
              <a href="http://iviewd.com/lpu2/">
                <img src="https://www.lpu.in/lpu-assets/images/icons/360-view.svg" alt="360 degree View" />
              </a>
              <a href="https://nad.digilocker.gov.in/">
                <img src="https://www.lpu.in/lpu-assets/images/icons/digi-locker.svg" alt="DigiLocker" />
              </a>
            </section>
            <section>
              <h2>LPU in Media</h2>
              <a href="https://www.lpu.in/LPUMedia/newshome.php">Press Coverage</a>
            </section>
          </div>
          <div className="lpu-footer-links">
            {footerGroups.map((group) => (
              <section key={group.title}>
                <h2>{group.title}</h2>
                {group.links.map(([label, href]) => (
                  href
                    ? <a href={href} key={label}>{label}</a>
                    : <span className="lpu-footer-trigger" key={label}>{label}</span>
                ))}
                {group.title === "Academics" && <small>(Under Category-1 HEI)</small>}
              </section>
            ))}
          </div>
        </div>
      </div>
      <div className="lpu-footer-bottom">
        <nav>
          {footerBottomLinks.map(([label, href]) => (
            href ? <a href={href} key={label}>{label}</a> : <span key={label}>{label}</span>
          ))}
        </nav>
        <span>
          Problem with this page?{" "}
          <a href="mailto:webmaster@lpu.co.in?subject=Mail%20from%20lpu.in%20Website">Contact Webmaster</a>
        </span>
        <span>Copyrights © 2026 All Rights Reserved by Lovely Professional University</span>
      </div>
    </footer>
  );
}

function FloatingTools() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <nav className="lpu-sticky-links" aria-label="LPU quick links">
          <a href="https://admission.lpu.in/" target="_blank" rel="noreferrer">Apply Now</a>
          <a href="https://iviewd.com/lpu2/" target="_blank" rel="noreferrer">
            <img src="https://www.lpu.in/lpu-assets/images/icons/360-view-w.svg" alt="" />
            Virtual Tour
          </a>
          <span>
            <img src="https://www.lpu.in/lpu-assets/images/icons/phone-full.svg" alt="" />
            Schedule a Call
          </span>
          <a
            href="https://api.whatsapp.com/send?phone=+919852569000&text=Hi%2C%20I%20need%20assistance%20for%20Admission%20at%20LPU."
            target="_blank"
            rel="noreferrer"
          >
            <img src="https://www.lpu.in/lpu-assets/images/icons/whatsapp-white.svg" alt="" />
            WhatsApp
          </a>
          <span>
            <img src="https://www.lpu.in/lpu-assets/images/icons/live-video.svg" alt="" />
            Live Video Counselling
          </span>
          <a href="https://www.lpu.in/admission/lpu-in-your-town.php">
            <img src="https://www.lpu.in/lpu-assets/images/icons/town.svg" alt="" />
            LPU Office in your City
          </a>
        </nav>
      )}
      <button
        className="lpu-sticky-tab"
        type="button"
        aria-label={open ? "Close quick links" : "Open quick links"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <img src="https://www.lpu.in/lpu-assets/images/icons/sticky-icon.svg" alt="" />
      </button>
      <button className="lpu-chatbot" type="button" aria-label="Open LPU assistant">
        <span>Hi, How may I assist you today?</span>
        <img
          src="https://y350p4k09m.in3.agent.nopaperforms.com/media/uploads/agent_icon/c258015e9e43439192dd8f0fea139c79.png"
          alt=""
        />
      </button>
    </>
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
    <div className="lpu-page">
      <SiteHeader />
      <main className="lpu-public-main">
        <section id="verification" className="verification-section">
          <div className={`verification-shell${result ? " verification-shell-result" : ""}`}>
            <h1>Academic Transcript / Diploma / Degree Authentication</h1>
            <img
              className="verification-mark"
              src="https://www.lpu.in/authenticate/lpu_logo_login.png"
              alt="Lovely Professional University"
            />
            <div className="verification-rule" />

            {!result && (
              <form className="verification-form" onSubmit={verify}>
                <label htmlFor="documentType">Select Document to Verify:</label>
                <select id="documentType" name="documentType" value={form.documentType} onChange={updateField}>
                  <option value="">--- Select ---</option>
                  <option value="Degree">Degree</option>
                  <option value="Academic Transcript">Academic Transcript</option>
                  <option value="Skill Development Certificate">Lovely Centre for Skill Development</option>
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
                    {loading ? "Authenticating…" : "Authenticate"}
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
      </main>
      <SiteFooter />
      <FloatingTools />
    </div>
  );
}
