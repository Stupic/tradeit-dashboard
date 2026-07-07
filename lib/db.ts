import "server-only";
import mysql from "mysql2/promise";

// MariaDB 커넥션 풀 (서버 사이드 전용).
// 세션 타임존을 KST(+09:00)로 고정 → DATE(created_at) 등 "오늘/이번달" 경계가 KST 기준.

const TZ = process.env.DB_TIMEZONE ?? "+09:00";

declare global {
  // 개발 중 HMR로 풀이 중복 생성되는 것 방지
  // eslint-disable-next-line no-var
  var __taasPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true, // DATE/DATETIME을 문자열로 반환 (JS Date tz 변환 회피)
  });
  // 새 커넥션마다 세션 타임존 설정
  pool.on("connection", (conn) => {
    conn.query(`SET time_zone = '${TZ}'`);
  });
  return pool;
}

export const pool: mysql.Pool = global.__taasPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__taasPool = pool;

// 편의: 행 배열 조회
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

// 편의: 단일 행 조회
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}
