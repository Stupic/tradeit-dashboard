# 팀 DB 접속 가이드 (내부망 공유)

DB는 **AWS RDS(외부 비공개)**. 사내 **중앙 호스트(192.168.0.12)** 한 대가 SSH 터널을
유지하고, 나머지 PC는 그 호스트로 붙는다. → PC마다 터널을 만들 필요 없음.

```
[각 개발 PC] --LAN--> [192.168.0.12 : 13306] --SSH터널--> [AWS RDS : 3306]
```

---

## A. 중앙 호스트(192.168.0.12) — 1회 세팅

### 1) 터널을 0.0.0.0 에 바인딩 (LAN 개방)
```bash
# <RDS엔드포인트>, <bastion>은 실제 값으로 교체
autossh -M 0 -N -L 0.0.0.0:13306:<RDS엔드포인트>:3306 user@<bastion>
```
- `0.0.0.0` 바인딩이 핵심 (loopback 전용이면 다른 PC가 못 붙음)
- GUI 툴(PuTTY/DBeaver 등)이면 "다른 호스트의 접속 허용 / bind 0.0.0.0" 옵션 체크
- `autossh` = 끊겨도 자동 재접속. 상시 구동은 작업 스케줄러/서비스로 등록 권장

### 2) 방화벽 인바운드 허용 (관리자 PowerShell)
```powershell
New-NetFirewallRule -DisplayName "TAAS DB tunnel" -Direction Inbound `
  -Protocol TCP -LocalPort 13306 -Action Allow -RemoteAddress 192.168.0.0/24
```

### 3) 안정성
- **절전/최대 절전 끄기** — 호스트가 꺼지면 전원(全員) DB 끊김
- 공유기에서 **192.168.0.12 를 DHCP 고정(예약)** 으로 못박기

---

## B. 다른 PC(팀원) — `.env.local` 만 설정

`.env.example` 복사 후 그대로 사용 (이미 `DB_HOST=192.168.0.12`).
```
DB_HOST=192.168.0.12
DB_PORT=13306
DB_NAME=taas-v2
DB_USER=admin
DB_PASSWORD=__ASK_TEAM__   # 실제 값은 팀에 문의 (git 커밋 금지)
DB_TIMEZONE=+09:00
```
그다음:
```bash
npm install
npm run dev     # http://localhost:3000
```

---

## 점검(안 될 때)
```powershell
Test-NetConnection 192.168.0.12 -Port 13306   # TcpTestSucceeded : True 면 정상
```
- False → 호스트의 터널이 0.0.0.0으로 떠 있는지 / 방화벽 규칙 / 같은 서브넷인지 확인
