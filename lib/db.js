import mysql from "mysql2/promise";

const globalDatabase = globalThis;

const resultColumns = `
  id, document_type, registration_no, document_no, student_name, programme,
  exam_session, issue_date, pdf_object_key, pdf_filename, pdf_size_bytes,
  created_at, updated_at
`;

function configuration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  const parsed = new URL(databaseUrl);
  const configuredCa = process.env.MYSQL_CA?.replace(/\\n/g, "\n");
  const requireOnly = parsed.searchParams.get("ssl-mode")?.toUpperCase() === "REQUIRED";

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ssl: configuredCa
      ? { ca: configuredCa, rejectUnauthorized: true }
      : { rejectUnauthorized: !requireOnly },
    waitForConnections: true,
    connectionLimit: 4,
    maxIdle: 2,
    idleTimeout: 60_000,
    queueLimit: 0,
    dateStrings: true,
    charset: "utf8mb4",
  };
}

export function getPool() {
  if (!globalDatabase.__academicVerificationPool) {
    globalDatabase.__academicVerificationPool = mysql.createPool(configuration());
  }
  return globalDatabase.__academicVerificationPool;
}

export async function ensureSchema() {
  if (!globalDatabase.__academicVerificationSchema) {
    globalDatabase.__academicVerificationSchema = (async () => {
      const pool = getPool();
      // The row holds the landing-page identifiers plus a reference to the PDF in Supabase storage.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS academic_result_documents (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          document_type VARCHAR(60) NOT NULL,
          registration_no VARCHAR(80) NOT NULL,
          document_no VARCHAR(80) NOT NULL,
          student_name VARCHAR(120) NOT NULL DEFAULT '',
          programme VARCHAR(160) NOT NULL DEFAULT '',
          exam_session VARCHAR(80) NOT NULL DEFAULT '',
          issue_date VARCHAR(10) NOT NULL DEFAULT '',
          pdf_object_key VARCHAR(320) NOT NULL,
          pdf_filename VARCHAR(200) NOT NULL DEFAULT 'result.pdf',
          pdf_size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
          created_at VARCHAR(30) NOT NULL,
          updated_at VARCHAR(30) NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_academic_document_lookup (document_type, registration_no, document_no),
          KEY idx_academic_document_registration (registration_no),
          KEY idx_academic_document_number (document_no),
          KEY idx_academic_document_student (student_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS academic_audit_log (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          action VARCHAR(40) NOT NULL,
          result_id BIGINT UNSIGNED NULL,
          ip_address VARCHAR(80) NULL,
          created_at VARCHAR(30) NOT NULL,
          PRIMARY KEY (id),
          KEY idx_academic_audit_result (result_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })().catch((error) => {
      globalDatabase.__academicVerificationSchema = null;
      throw error;
    });
  }
  return globalDatabase.__academicVerificationSchema;
}

export async function databaseHealth() {
  await ensureSchema();
  await getPool().query("SELECT 1");
}

export async function findPublicResult({ documentType, registrationNumber, documentNumber }) {
  await ensureSchema();
  const [rows] = await getPool().execute(
    `SELECT ${resultColumns} FROM academic_result_documents
     WHERE document_type = ? AND registration_no = ? AND document_no = ? LIMIT 1`,
    [documentType, registrationNumber, documentNumber],
  );
  return rows[0] || null;
}

export async function findResultById(id) {
  await ensureSchema();
  const [rows] = await getPool().execute(
    `SELECT ${resultColumns} FROM academic_result_documents WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function listResults(search = "") {
  await ensureSchema();
  if (!search) {
    const [rows] = await getPool().query(
      `SELECT ${resultColumns} FROM academic_result_documents ORDER BY updated_at DESC LIMIT 250`,
    );
    return rows;
  }

  const like = `%${search}%`;
  const [rows] = await getPool().execute(
    `SELECT ${resultColumns} FROM academic_result_documents
     WHERE registration_no LIKE ? OR document_no LIKE ? OR student_name LIKE ?
     ORDER BY updated_at DESC LIMIT 250`,
    [like, like, like],
  );
  return rows;
}

export async function createResult(payload, pdf) {
  await ensureSchema();
  const now = new Date().toISOString();
  const [result] = await getPool().execute(
    `INSERT INTO academic_result_documents (
      document_type, registration_no, document_no, student_name, programme,
      exam_session, issue_date, pdf_object_key, pdf_filename, pdf_size_bytes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.documentType,
      payload.registrationNumber,
      payload.documentNumber,
      payload.studentName,
      payload.programme,
      payload.examSession,
      payload.issueDate,
      pdf.objectKey,
      pdf.filename,
      pdf.size,
      now,
      now,
    ],
  );
  return findResultById(result.insertId);
}

/** `pdf` is null when the administrator edits identifiers without replacing the document. */
export async function updateResult(id, payload, pdf) {
  await ensureSchema();
  const now = new Date().toISOString();
  const replacing = pdf ? 1 : 0;
  await getPool().execute(
    `UPDATE academic_result_documents SET
      document_type = ?, registration_no = ?, document_no = ?, student_name = ?,
      programme = ?, exam_session = ?, issue_date = ?,
      pdf_object_key = CASE WHEN ? = 1 THEN ? ELSE pdf_object_key END,
      pdf_filename = CASE WHEN ? = 1 THEN ? ELSE pdf_filename END,
      pdf_size_bytes = CASE WHEN ? = 1 THEN ? ELSE pdf_size_bytes END,
      updated_at = ?
     WHERE id = ?`,
    [
      payload.documentType,
      payload.registrationNumber,
      payload.documentNumber,
      payload.studentName,
      payload.programme,
      payload.examSession,
      payload.issueDate,
      replacing,
      pdf?.objectKey || null,
      replacing,
      pdf?.filename || null,
      replacing,
      pdf?.size || 0,
      now,
      id,
    ],
  );
  return findResultById(id);
}

export async function deleteResult(id) {
  await ensureSchema();
  await getPool().execute("DELETE FROM academic_result_documents WHERE id = ?", [id]);
}

export async function writeAudit(action, resultId, ipAddress) {
  await ensureSchema();
  await getPool().execute(
    "INSERT INTO academic_audit_log (action, result_id, ip_address, created_at) VALUES (?, ?, ?, ?)",
    [action, resultId || null, ipAddress || null, new Date().toISOString()],
  );
}

export function isDuplicateError(error) {
  return error?.code === "ER_DUP_ENTRY";
}
