# TAAS 비즈니스 현황 대시보드 — 초안 & API 명세서

> 대상: 관리자 대시보드 (Next.js) + `api_admin` (Spring Boot, Port 801)
> 갱신 주기: 30초 ~ 1분 폴링
> DB: MariaDB (schema.sql 기준)

---

## 1. 개요

이미지의 "비즈니스 현황" 대시보드는 4개 핵심 지표(회원가입수 · 결제건수 · 총수익 · 접속자수)와
추이 그래프(최근 7일), 매출 구성(도넛), 실시간 시계로 구성됩니다.

폴링 방식이므로 **화면에 필요한 모든 데이터를 1개의 집계 엔드포인트로 반환**하는 것을 기본으로 합니다.
(라운드트립 최소화 → `GET /api/admin/dashboard/overview`)

---

## 2. 지표 ↔ 스키마 매핑

| 화면 지표 | 소스 테이블 | 산출 방식 |
|---|---|---|
| **회원가입수** 누적 | `users` | `COUNT(*) WHERE status <> 'WITHDRAWN' AND deleted_at IS NULL` |
| 회원가입수 이번 달 | `users` | `COUNT(*)` where `created_at` in 당월 |
| 회원가입수 오늘 | `users` | `COUNT(*)` where `DATE(created_at) = :date` |
| **결제건수** 누적/이번달/오늘 | `payment_histories` | `COUNT(*) WHERE payment_status='COMPLETED'` (+ 기간 필터) |
| **총수익** 누적/이번달/오늘 | `payment_histories` | `SUM(amount) WHERE payment_status='COMPLETED'` (+ 기간 필터) |
| **접속자 수** (오늘) | `users.last_login_at` | `COUNT(*) WHERE DATE(last_login_at) = :date` — 오늘 실제 접속한 회원 수 |
| **방문 트래픽** (PV/UV) | `page_visit_logs` | 오늘 방문수(PV)=`COUNT(*)`, 순방문자(UV)=`COUNT(DISTINCT login_id)` / `COUNT(DISTINCT ip)` |
| 신규 회원 (오늘의 요약) | `users` | = 회원가입 오늘 |
| **회원가입 추이** (최근 7일) | `users` | 일자별 `COUNT(*)` GROUP BY `DATE(created_at)` |
| **매출/결제건수 추이** (최근 7일) | `payment_histories` | 일자별 `SUM(amount)` / `COUNT(*)` GROUP BY `DATE(created_at)` |
| **매출 구성** (이번 달) | `payment_histories` + `subscriptions` | 구독/단일/기타로 분류하여 `SUM(amount)` (아래 §3.2 확인 필요) |
| 증감률(▲/▼ %) | 파생 | (오늘 − 어제) / 어제 × 100, 월 지표는 (이번달 − 지난달) / 지난달 |
| 실시간 시계 09:41:23 | 프론트 | 클라이언트 로컬시간, 서버 불필요 |

**성능용 인덱스는 대부분 존재**합니다:
`IDX_payment_histories_status`, `IDX_payment_histories_created`, `IDX_pvl_created_at`, `IDX_users_status`.
단, `users.created_at`, `login_histories.created_at` 기준 집계가 잦으므로 인덱스 추가 검토 권장(§6).

---

## 3. ⚠️ 시작 전 확인 필요한 사항 (의사결정 필요)

작업 전 아래 3가지는 **스키마상 확정되지 않아** 임의로 정하지 않고 확인이 필요합니다.

### 3.1 통화 (총수익 표기) — ✅ 결정: USD($)
- `payment_histories.amount`를 **USD로 그대로 합산**, `currency="USD"` 반환(환율 변환 없음).
- 프론트는 `$` 로 표기. (추후 KRW 저장/변환이 확인되면 `currency` 값만 교체)

### 3.2 "매출 구성" 분류 — ✅ 결정: 등급(grade)별
- `payment_histories` → `subscriptions` → `grades` 조인 후 **등급별 `SUM(amount)`**.
- 응답 `items[]`는 `{ key: grade_code, label: grade_name, amount, ratio }` (금액 내림차순).
- 등급 수가 가변이므로 프론트 도넛은 **인덱스 순서로 색 배정**(마지막 조각은 중립 회색).
- (이미지의 "구독/단일/기타" 라벨과는 다름 — 실제 단일결제 개념이 스키마에 없어 등급별로 대체)

### 3.3 "접속자 수" 정의 — ✅ 확정
- `login_histories`는 **토큰 유효기간이 길어 접속 시점을 정확히 반영하지 못함** → 사용하지 않음.
- **접속자 수 = `users.last_login_at`가 오늘인 회원 수** 로 확정.
  `COUNT(*) FROM users WHERE DATE(last_login_at) = :date`
  - 참고: `last_login_at`은 "가장 최근 접속" 1건만 기록 → "오늘 접속한 회원 수"로는 정확하나,
    하루 중 재방문/세션 수는 알 수 없음(그건 아래 방문 트래픽으로 보완).
- **방문 트래픽(PV/UV)** 은 `page_visit_logs`로 별도 지표 추가.
  - `source`(CRM/ADMIN) 컬럼 존재 → 기본 **CRM**(서비스 방문) 기준, 파라미터로 전환 가능.

### 3.4 기준일(date) 및 타임존
- 화면 우상단 날짜 선택기(2024.05.20) 존재 → 특정일 기준 조회 지원 필요.
- 서버/DB 타임존(KST 가정) 확정 필요. 모든 "오늘/이번달" 경계는 **KST 자정** 기준.

---

## 4. API 명세

> **구현 상태(2026-07): `/overview` 구현 완료.** `api_admin` 모듈에 추가됨 —
> `controllers/DashboardController.java`, `services/dashboard/DashboardService.java`,
> `dto/dashboard/DashboardOverviewDTO.java`. `/api/admin/**` 기본 인증에 포함되어
> 별도 Security 설정 불필요. 집계는 네이티브 쿼리, "오늘/이번달" 경계는 KST 기준.
> §4.3 분리 엔드포인트는 부하 발생 시 확장(현재 미구현).

### 4.1 공통
- **Base URL**: `http://<host>:801`
- **인증**: 기존 admin JWT (Authorization 헤더). 컨트롤러는 `/api/admin/**` 하위 배치.
- **응답 래퍼**: 프로젝트 표준 `ApiResponse`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": { /* 지표별 payload */ }
}
```

---

### 4.2 [메인] 대시보드 종합 조회 (폴링 대상)

```
GET /api/admin/dashboard/overview
```

**Query Parameters**

| 이름 | 타입 | 필수 | 기본 | 설명 |
|---|---|---|---|---|
| `date` | string(`YYYY-MM-DD`) | N | 오늘(KST) | 기준일. "오늘/이번달" 계산 기준 |
| `trendDays` | int | N | 7 | 추이 그래프 일수 |
| `visitSource` | string(`CRM`\|`ADMIN`) | N | `CRM` | 방문 트래픽 집계 대상 |

**Response `data`**

```json
{
  "baseDate": "2024-05-20",
  "serverTime": "2024-05-20T09:41:23+09:00",
  "currency": "KRW",

  "members": {
    "total": 128560,
    "thisMonth": 3245,
    "today": 128,
    "changeRate": 12.4          // 오늘 vs 어제 (%)
  },
  "payments": {
    "total": 45230,
    "thisMonth": 1287,
    "today": 56,
    "changeRate": 8.7
  },
  "revenue": {
    "total": 1245670000,
    "thisMonth": 32450000,
    "today": 1680000,
    "changeRate": 15.3
  },
  "activeUsers": {               // users.last_login_at 기준 오늘 접속 회원 수
    "today": 2345,
    "changeRate": 7.2
  },
  "visits": {                    // page_visit_logs 기준 (source=CRM 기본)
    "source": "CRM",
    "pvToday": 8720,             // COUNT(*)
    "uvToday": 2103,             // COUNT(DISTINCT login_id)  (비로그인 제외)
    "uvByIpToday": 2540,         // COUNT(DISTINCT ip)        (비로그인 포함)
    "changeRate": 5.1
  },

  "trends": {
    "members":  [ { "date": "2024-05-14", "value": 8200 }, ... ],   // trendDays개
    "revenue":  [ { "date": "2024-05-14", "value": 22000000 }, ... ],
    "payments": [ { "date": "2024-05-14", "value": 1150 }, ... ],
    "visits":   [ { "date": "2024-05-14", "value": 7100 }, ... ]    // 일별 PV
  },

  "revenueComposition": {        // 이번 달
    "total": 32450000,
    "items": [
      { "key": "SUBSCRIPTION", "label": "구독 결제", "amount": 18236900, "ratio": 56.2 },
      { "key": "ONE_TIME",     "label": "단일 결제", "amount": 9313150,  "ratio": 28.7 },
      { "key": "ETC",          "label": "기타",     "amount": 4899950,  "ratio": 15.1 }
    ]
  }
}
```

> `data`가 화면 1:1 대응이라, 프론트는 이 응답만 30~60초마다 폴링하면 전체 갱신됨.
> 추이/매출구성은 하루 단위로만 바뀌므로, 부하가 커지면 §6처럼 분리·캐싱 가능.

---

### 4.3 (선택) 분리 엔드포인트

부하 분산이나 부분 갱신이 필요할 때 아래로 쪼갤 수 있음.
초기에는 4.2 하나로 충분.

| 엔드포인트 | 용도 | 갱신주기 |
|---|---|---|
| `GET /api/admin/dashboard/summary` | 4개 핵심 지표 + 오늘의 요약 | 30초 (실시간) |
| `GET /api/admin/dashboard/trends?days=7` | 추이 3종 | 5분/1시간 캐시 |
| `GET /api/admin/dashboard/revenue-composition?month=YYYY-MM` | 매출 구성 | 5분 캐시 |

---

### 4.4 핵심 집계 SQL (참고)

```sql
-- 결제건수/총수익: 기간별 (오늘/이번달/누적을 조건부 집계로 한 번에)
SELECT
  COUNT(*)                                                                AS cnt_total,
  SUM(amount)                                                             AS rev_total,
  COUNT(CASE WHEN created_at >= :monthStart THEN 1 END)                   AS cnt_month,
  SUM(CASE WHEN created_at >= :monthStart THEN amount ELSE 0 END)         AS rev_month,
  COUNT(CASE WHEN DATE(created_at) = :date THEN 1 END)                    AS cnt_today,
  SUM(CASE WHEN DATE(created_at) = :date THEN amount ELSE 0 END)          AS rev_today
FROM payment_histories
WHERE payment_status = 'COMPLETED';

-- 회원 추이 (최근 N일)
SELECT DATE(created_at) d, COUNT(*) v
FROM users
WHERE created_at >= :fromDate AND deleted_at IS NULL
GROUP BY DATE(created_at) ORDER BY d;

-- 접속자 수 (오늘, users.last_login_at 기준)
SELECT COUNT(*)
FROM users
WHERE DATE(last_login_at) = :date
  AND deleted_at IS NULL;

-- 방문 트래픽 (오늘, page_visit_logs 기준)
SELECT
  COUNT(*)                                            AS pv,
  COUNT(DISTINCT login_id)                            AS uv_login,
  COUNT(DISTINCT ip)                                  AS uv_ip
FROM page_visit_logs
WHERE DATE(created_at) = :date
  AND source = :source;   -- 기본 'CRM'
```

> 추이는 데이터 없는 날짜가 빠지므로, **프론트 또는 서비스에서 날짜 축을 채워** 0으로 보정.

---

## 5. Next.js 프론트 구조 초안

```
app/
  dashboard/
    page.tsx                 // 서버컴포넌트: 초기 SSR fetch
    _components/
      BusinessOverview.tsx   // 중앙 "BUSINESS OVERVIEW" 허브 + 실시간 시계
      MetricNode.tsx         // 회원가입/결제/총수익 원형 노드 (누적·이번달·오늘·증감)
      TrendChart.tsx         // 최근 7일 라인차트 (재사용)
      RevenueDonut.tsx       // 매출 구성 도넛
      TodaySummary.tsx       // 오늘의 요약 4칸
      RealtimeClock.tsx      // 클라이언트 로컬 시계
    _hooks/
      useDashboard.ts        // 폴링 훅 (SWR/React Query, refreshInterval)
    _lib/
      api.ts                 // fetch 래퍼 (ApiResponse 언랩)
      format.ts              // ₩ 통화/천단위/퍼센트 포맷
```

**폴링 훅 예시 (SWR)**

```ts
const { data } = useSWR('/api/admin/dashboard/overview', fetcher, {
  refreshInterval: 30_000,        // 30초
  revalidateOnFocus: true,
  keepPreviousData: true,         // 깜빡임 방지
});
```

- 시계는 `serverTime`로 초기화 후 클라이언트 `setInterval(1s)`로 진행 (서버 폴링과 분리).
- 차트: Recharts 또는 ECharts. 값 라벨/그라디언트는 이미지 스타일에 맞춤.
- 다크 테마 고정(네이비/글로우). 색: 회원=블루, 결제=그린, 수익=오렌지.

---

## 6. 성능 · 캐싱 노트

- **폴링 부하**: 30초 주기 × 관리자 수. 종합 API가 매번 여러 집계 쿼리를 돌리므로
  서버측 **단기 캐시(10~30초, Redis 존재 `localhost:16379`)** 권장. 특히 추이/매출구성은 5분 캐시.
- **인덱스 검토**:
  - `users(created_at)` — 회원 추이/일별 가입수 집계용 (현재 status 인덱스만 존재)
  - `users(last_login_at)` — 접속자 수 집계용 (현재 인덱스 없음) **← 추가 권장**
  - `page_visit_logs`는 `IDX_pvl_created_at`, `IDX_pvl_source` 존재 → OK
  - `payment_histories`는 `created_at`, `payment_status` 인덱스 존재 → OK
- **정합성**: "누적" 총수익은 매번 전체 SUM이면 무거워질 수 있음 →
  데이터 커지면 일자별 집계 테이블(요약 배치) 또는 Redis 카운터 검토.
- 응답에 `serverTime` 포함해 클라이언트-서버 시간차 보정.

---

## 7. 구현 순서(제안)

1. §3 의사결정 확정(통화/매출구성/접속자 정의)
2. `api_admin`에 `DashboardController` + `DashboardService` 추가 (native query 집계)
3. `GET /overview` 단일 엔드포인트부터 구현 → Swagger 확인
4. Next.js 스캐폴딩 + `useDashboard` 폴링 훅 + 컴포넌트
5. 부하 측정 후 캐시/인덱스/엔드포인트 분리 적용
```
```
