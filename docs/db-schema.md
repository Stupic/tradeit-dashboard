# DB 스키마 참조 (대시보드 관련 테이블)

> **DB**: `taas-v2` (MariaDB, AWS RDS) — 사내 중앙 호스트 SSH 터널 경유(`192.168.0.12:13306`).
> 백엔드(TaaS-be)를 안 봐도 되도록 **실 DB에서 직접 추출**한 참조. (기준: 2026-07-08)
> 대시보드가 실제로 조회하는 7개 테이블만 정리. 집계 로직은 [`lib/dashboard-query.ts`](../lib/dashboard-query.ts).

---

## 관계도 (대시보드 사용 범위)

```
users ──1:N── payments ──1:N── payment_histories ──N:1── subscriptions ──N:1── grades
  │                                                            │                   │
  └── last_login_at (접속자)          subscriptions.user_id ───┘   grade_id ───────┘
page_visit_logs (방문, users와 조인 없이 login_id/ip 문자열로만 연결)
```

주요 FK:
- `payments.user_id` → `users.id`
- `subscriptions.user_id` → `users.id`, `subscriptions.grade_id` → `grades.id`, `subscriptions.payment_id` → `payments.id`
- `payment_histories.payment_id` → `payments.id`, `payment_histories.subscription_id` → `subscriptions.id`

---

## 지표 ↔ 테이블 매핑 (빠른 참조)

| 지표 | 테이블 | 필터 / 컬럼 |
|---|---|---|
| 회원가입수(누적/월/오늘) | `users` | `status<>'WITHDRAWN' AND deleted_at IS NULL`, 기간=`created_at` |
| 접속자 수(오늘) | `users` | `DATE(last_login_at)=오늘` |
| 결제건수 | `payment_histories` | `payment_status='COMPLETED'`, 기간=`created_at` |
| 총수익 | `payment_histories` | `SUM(amount)` where `COMPLETED` |
| 매출 구성(등급별) | `payment_histories`→`subscriptions`→`grades` | 당월 `COMPLETED`, `GROUP BY grade` |
| 방문 트래픽(PV/UV) | `page_visit_logs` | `source`(기본 CRM), `created_at` |

> "오늘/이번달" 경계는 **KST(+09:00)** — DB 세션 tz를 `+09:00`으로 고정([`lib/db.ts`](../lib/db.ts)).

---

## 테이블 상세

### users — 회원
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint UN, PK | |
| status | enum(`ACTIVE`,`INACTIVE`,`SUSPENDED`,`WITHDRAWN`) | 회원 상태 |
| login_id | varchar(255), UNIQUE | 로그인 ID |
| name / email / company_name / department / position / contact | varchar | 프로필 |
| signup_type | tinyint | 0:일반, 1:구글 |
| last_login_at | timestamp NULL | **최근 접속일 → 접속자 수 집계 기준** |
| created_at | timestamp | **가입일 → 가입 추이/집계 기준** |
| deleted_at | timestamp NULL | 소프트 삭제 |
| paddle_customer_id | varchar NULL | Paddle 고객 ID |

### payments — 결제(수단/빌링) 정보
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint UN, PK | |
| user_id | bigint UN, FK→users | |
| billing_day | tinyint UN | 결제일(1-28) |
| payment_method | varchar NULL | 결제 수단 |
| transaction_id | varchar NULL | 외부 결제 트랜잭션 ID |
| created_at / updated_at / deleted_at | timestamp | |

### subscriptions — 구독
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint UN, PK | |
| user_id | bigint UN, FK→users | |
| grade_id | bigint UN, FK→grades | **현재 등급 → 매출 구성 조인** |
| subscription_type | enum(`NEW`,`RENEWAL`,`UPGRADE`,`DOWNGRADE`) | 구독 유형 |
| subscription_id | varchar NULL | Paddle subscription.id |
| previous_grade_id | bigint UN NULL, FK→grades | 업/다운그레이드 시 |
| payment_id | bigint UN, FK→payments | |
| status | enum(`ACTIVE`,`EXPIRED`,`CANCELLED`,`PAST_DUE`) | 구독 상태 |
| applied_date / expired_date | datetime NULL | 적용/만료 |
| created_at / updated_at / deleted_at | timestamp | |

### payment_histories — 결제 이력 (**매출/결제건수의 원천**)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint UN, PK | |
| payment_id | bigint UN, FK→payments | |
| subscription_id | bigint UN, FK→subscriptions | **NOT NULL — 모든 결제가 구독에 연결** |
| amount | decimal(12,2) | **결제 금액 → 총수익/매출구성** |
| payment_status | enum(`PENDING`,`COMPLETED`,`FAILED`,`REFUNDED`) | **집계는 `COMPLETED`만** |
| failed_reason | varchar NULL | 실패 사유 |
| created_at | timestamp | **결제 시각 → 기간 집계 기준** |

### grades — 등급
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint UN, PK | |
| grade_code | varchar(20), UNIQUE | 예: `GRADE_PRO` |
| grade_name | varchar(50) | 예: `Pro` |
| monthly_credit / max_credit | int UN | 크레딧 정책 |
| display_order | int UN | 낮을수록 상위 표시 |
| is_activated | tinyint(1) | 활성 여부 |

**실제 등급 값 (2026-07 기준)**
| id | grade_code | grade_name | display_order |
|---|---|---|---|
| 1 | GRADE_PLUS | Plus | 50 |
| 2 | GRADE_PRO | Pro | 100 |
| 3 | GRADE_PREMIUM | Premium | 150 |

### page_visit_logs — 방문 로그 (**방문 트래픽**)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint, PK | |
| source | varchar(10) | **`CRM` / `ADMIN`** (대시보드 기본=CRM) |
| page_url | varchar(500) | 방문 경로 |
| login_id | varchar(100) NULL | JWT에서 추출, 비로그인 시 NULL → UV(login) |
| ip | varchar(50) NULL | UV(ip) |
| user_agent / referrer | varchar NULL | |
| created_at | timestamp | 방문 시각 |

### login_histories — 로그인 이력 (⚠️ **대시보드 미사용**)
토큰 유효기간이 길어 "접속 시점"을 정확히 반영하지 못해 접속자 집계엔 안 씀
(대신 `users.last_login_at` 사용). 참고용으로만 존재.
`id, login_id, ip, action, token, rf_token, comment, created_at(datetime)`.

---

## 주의사항
- **매출/결제 집계는 `payment_status='COMPLETED'`만** 포함 (PENDING/FAILED/REFUNDED 제외).
- **`amount` 통화** — Paddle 결제라 USD 저장 가정, 그대로 합산해 `currency="USD"` 반환. 실제 저장 통화가 다르면 [`lib/dashboard-query.ts`](../lib/dashboard-query.ts)의 `currency`만 교체.
- **매출 구성**은 스키마상 "단일 결제" 개념이 없어(모든 `payment_histories`가 `subscription_id` 보유) **등급(grade)별**로 집계.
- **소프트 삭제** — `users`/`payments`/`subscriptions`/`grades`는 `deleted_at` 사용. 집계 시 `deleted_at IS NULL` 확인.
- 스키마가 바뀌면 이 문서도 갱신할 것 (실 DB `information_schema`에서 재추출).
