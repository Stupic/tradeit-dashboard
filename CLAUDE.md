# CLAUDE.md

이 저장소에서 작업할 때 Claude Code가 참고하는 가이드.

## 프로젝트

TAAS 비즈니스 현황 대시보드 (Next.js 14 App Router + TypeScript).
**백엔드 서버 없음** — Next.js Route Handler가 서버 사이드에서 MariaDB(`taas-v2`)를
직접 집계한다. 30초 폴링으로 갱신, 스크롤 없이 한 화면(고정 스케일).

## 작업 전 반드시 읽을 문서

- **[docs/db-schema.md](docs/db-schema.md)** — DB 테이블/컬럼/enum/등급값 (실 DB 추출).
  DB·쿼리·지표 관련 작업 전 필독. 백엔드(TaaS-be) 안 봐도 됨.
- **[docs/dashboard-spec.md](docs/dashboard-spec.md)** — 지표↔스키마 매핑, API 명세, 결정사항.
- **[docs/team-db-access.md](docs/team-db-access.md)** — 내부망 DB 접속(중앙 호스트 터널).

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `lib/db.ts` | MariaDB 풀 (server-only, 세션 tz=+09:00) |
| `lib/dashboard-query.ts` | 집계 SQL → `DashboardOverview` |
| `app/api/dashboard/overview/route.ts` | 실 DB 엔드포인트 (폴링 대상) |
| `app/api/mock/overview/route.ts` | 목업 폴백 |
| `lib/useDashboard.ts` | SWR 폴링 훅 |
| `lib/useDataChanges.ts` | 데이터 변동 감지(가입자/결제/매출) — 알림·효과 연결 지점 |
| `lib/types.ts` | 응답 타입 (API/쿼리/프론트 공용) |
| `components/Dashboard.tsx` | 레이아웃 오케스트레이션 |
| `components/FitScreen.tsx` | 뷰포트 맞춤 스케일러 (스크롤 없음) |

## 규칙 / 관례

- **DB 집계**는 네이티브 SQL, "오늘/이번달" 경계는 **KST(+09:00)**.
- **매출/결제 집계**는 `payment_status='COMPLETED'`만. 소프트삭제 테이블은 `deleted_at IS NULL`.
- **통화**는 `amount` 그대로 USD 표기 (`currency` 값만 바꾸면 전환).
- DB 자격증명은 `.env.local`(gitignore)에만. `NEXT_PUBLIC_` 금지, `import "server-only"` 유지.
- **비밀번호/키를 추적 파일(.env.example, 문서, 커밋)에 넣지 말 것.**
- 차트는 **Recharts v3**, 색은 dataviz 검증 팔레트(회원=파랑/결제=초록/수익=주황).
- 스키마 변경 시 `docs/db-schema.md`를 실 DB `information_schema`에서 재추출해 갱신.

## 명령어

```bash
npm run dev      # 개발 (http://localhost:3000) — 중앙 호스트 터널 필요
npm run build    # 프로덕션 빌드 (타입체크 포함)
```

> 검증: 레이아웃/차트 변경은 `next build` 후 dev 구동 → 실제 렌더 확인(스크린샷) 권장.
