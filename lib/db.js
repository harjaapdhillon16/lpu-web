import mysql from "mysql2/promise";

const globalDatabase = globalThis;

const resultColumns = `
  id, document_type, registration_no, document_no, student_name, programme,
  father_name, mother_name, batch_year, study_mode, exam_session, result_status,
  cgpa, equivalent_percentage, issue_date, certificate_number, print_date, place,
  completion_statement, terms_json, photo_filename, photo_mime, created_at, updated_at,
  CASE WHEN photo_blob IS NULL THEN 0 ELSE 1 END AS has_photo
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
      await pool.query(`
        CREATE TABLE IF NOT EXISTS academic_results (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          document_type VARCHAR(60) NOT NULL,
          registration_no VARCHAR(80) NOT NULL,
          document_no VARCHAR(80) NOT NULL,
          student_name VARCHAR(120) NOT NULL,
          programme VARCHAR(160) NOT NULL,
          father_name VARCHAR(120) NOT NULL DEFAULT '',
          mother_name VARCHAR(120) NOT NULL DEFAULT '',
          batch_year VARCHAR(20) NOT NULL DEFAULT '',
          study_mode VARCHAR(80) NOT NULL DEFAULT '',
          exam_session VARCHAR(80) NOT NULL,
          result_status VARCHAR(40) NOT NULL,
          cgpa VARCHAR(12) NOT NULL DEFAULT '',
          equivalent_percentage VARCHAR(12) NOT NULL DEFAULT '',
          issue_date VARCHAR(10) NOT NULL,
          certificate_number VARCHAR(80) NOT NULL DEFAULT '',
          print_date VARCHAR(10) NOT NULL,
          place VARCHAR(120) NOT NULL DEFAULT '',
          completion_statement VARCHAR(240) NOT NULL DEFAULT '',
          terms_json LONGTEXT NOT NULL,
          photo_blob MEDIUMBLOB NULL,
          photo_mime VARCHAR(80) NULL,
          photo_filename VARCHAR(180) NULL,
          created_at VARCHAR(30) NOT NULL,
          updated_at VARCHAR(30) NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_academic_result_lookup (document_type, registration_no, document_no),
          KEY idx_academic_registration (registration_no),
          KEY idx_academic_document (document_no),
          KEY idx_academic_student (student_name)
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

export async function findPublicResult(documentType, registrationNumber, documentNumber) {
  await ensureSchema();
  const [rows] = await getPool().execute(
    `SELECT ${resultColumns} FROM academic_results
     WHERE document_type = ? AND registration_no = ? AND document_no = ? LIMIT 1`,
    [documentType, registrationNumber, documentNumber],
  );
  return rows[0] || null;
}

export async function findResultById(id) {
  await ensureSchema();
  const [rows] = await getPool().execute(
    `SELECT ${resultColumns} FROM academic_results WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function listResults(search = "") {
  await ensureSchema();
  if (!search) {
    const [rows] = await getPool().query(
      `SELECT ${resultColumns} FROM academic_results ORDER BY updated_at DESC LIMIT 250`,
    );
    return rows;
  }

  const like = `%${search}%`;
  const [rows] = await getPool().execute(
    `SELECT ${resultColumns} FROM academic_results
     WHERE registration_no LIKE ? OR document_no LIKE ? OR student_name LIKE ?
     ORDER BY updated_at DESC LIMIT 250`,
    [like, like, like],
  );
  return rows;
}

export async function createResult(payload, photo) {
  await ensureSchema();
  const now = new Date().toISOString();
  const [result] = await getPool().execute(
    `INSERT INTO academic_results (
      document_type, registration_no, document_no, student_name, programme,
      father_name, mother_name, batch_year, study_mode, exam_session, result_status,
      cgpa, equivalent_percentage, issue_date, certificate_number, print_date, place,
      completion_statement, terms_json, photo_blob, photo_mime, photo_filename,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.documentType,
      payload.registrationNumber,
      payload.documentNumber,
      payload.studentName,
      payload.programme,
      payload.fatherName,
      payload.motherName,
      payload.batchYear,
      payload.studyMode,
      payload.examSession,
      payload.resultStatus,
      payload.cgpa,
      payload.equivalentPercentage,
      payload.issueDate,
      payload.certificateNumber,
      payload.printDate,
      payload.place,
      payload.completionStatement,
      JSON.stringify(payload.terms),
      photo?.buffer || null,
      photo?.mime || null,
      photo?.filename || null,
      now,
      now,
    ],
  );
  return findResultById(result.insertId);
}

export async function updateResult(id, payload, photoUpdate) {
  await ensureSchema();
  const now = new Date().toISOString();
  await getPool().execute(
    `UPDATE academic_results SET
      document_type = ?, registration_no = ?, document_no = ?, student_name = ?,
      programme = ?, father_name = ?, mother_name = ?, batch_year = ?, study_mode = ?,
      exam_session = ?, result_status = ?, cgpa = ?, equivalent_percentage = ?,
      issue_date = ?, certificate_number = ?, print_date = ?, place = ?,
      completion_statement = ?, terms_json = ?,
      photo_blob = CASE WHEN ? = 1 THEN ? ELSE photo_blob END,
      photo_mime = CASE WHEN ? = 1 THEN ? ELSE photo_mime END,
      photo_filename = CASE WHEN ? = 1 THEN ? ELSE photo_filename END,
      updated_at = ?
     WHERE id = ?`,
    [
      payload.documentType,
      payload.registrationNumber,
      payload.documentNumber,
      payload.studentName,
      payload.programme,
      payload.fatherName,
      payload.motherName,
      payload.batchYear,
      payload.studyMode,
      payload.examSession,
      payload.resultStatus,
      payload.cgpa,
      payload.equivalentPercentage,
      payload.issueDate,
      payload.certificateNumber,
      payload.printDate,
      payload.place,
      payload.completionStatement,
      JSON.stringify(payload.terms),
      photoUpdate.changed ? 1 : 0,
      photoUpdate.photo?.buffer || null,
      photoUpdate.changed ? 1 : 0,
      photoUpdate.photo?.mime || null,
      photoUpdate.changed ? 1 : 0,
      photoUpdate.photo?.filename || null,
      now,
      id,
    ],
  );
  return findResultById(id);
}

export async function deleteResult(id) {
  await ensureSchema();
  await getPool().execute("DELETE FROM academic_results WHERE id = ?", [id]);
}

export async function getCandidatePhoto(id) {
  await ensureSchema();
  const [rows] = await getPool().execute(
    "SELECT photo_blob AS data, photo_mime AS mime FROM academic_results WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0]?.data ? rows[0] : null;
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
