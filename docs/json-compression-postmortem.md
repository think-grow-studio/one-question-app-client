# JSON 응답 압축으로 API 속도 개선 시도 — 검토 기록

> **핵심 한 줄**
> 전략은 **"payload가 TCP 슬로 스타트 초기 윈도우(threshold)를 넘을 때만 압축한다"** 였다.
> 그런데 ① 그 threshold가 **RFC상 확정된 단일 상수가 아니고**(권고값·Experimental·서버 의존),
> ② **실제 응답(~10.7KB)은 그 기준을 넘지 않았다.** → 현재 트래픽은 압축의 대상 조건 자체를
> 충족하지 못함. (압축이 "느렸다"가 아니라, **압축이 적용될 상황이 아니었다.**)
>
> **후속 검증(§8):** 단, size=35의 일부 응답은 18~22KB로 threshold를 넘었고, 여기에
> **gzip(`application/json` 한정)** 을 적용하니 **2 RTT → 1 RTT**, **~37%(~285ms) 단축**을 실측 확인.
> → "임계 초과 응답엔 압축이 실효" 라는 전략 자체는 옳았음이 증명됨.

---

## 0. 배경 / 구성 (측정 환경)

```
client(한국) ──→ Cloudflare(orange proxy) ──→ Oracle VM(인도) ──→ Oracle DB(인도)
```
한국 유저 · 인도 origin · Cloudflare 프록시(orange). API 응답이 warm 기준 ~400ms,
화면당 여러 호출이 누적되어 체감 지연 → 원인 진단에서 출발했다.

### 사전 발견 (이 문서의 전제가 되는 사실)
- **Cloudflare가 한국 트래픽을 미국 LA PoP로 라우팅** — 응답 헤더 `cf-ray: …-LAX` 일관 관측.
  한국 ISP 피어링 이슈로 서울(ICN)이 아님. → 한국 유저 요청이 **한국→LA→인도로 지구를 한 바퀴**.
- **구간 RTT (실측/도출):**

| 구간 | RTT | 근거 |
|---|---|---|
| 한국 ↔ 미국(LA) | ~150ms | 클라↔CF TCP 핸드셰이크 = 1 RTT (실측) |
| 미국(LA) ↔ 인도 | ~257ms | warm TTFB − 한국미국 (도출) |
| 한국 ↔ 인도 (CF 경유, 전체) | ~407ms | warm TTFB − 서버처리 |
| **한국 ↔ 인도 (직접, CF 미경유)** | **~109ms** | **VM SSH 연결 minrtt 실측 (`ss -ti`)** |

→ **거리(직접 ~109ms)보다 Cloudflare-LA 우회(+~298ms)가 더 큰 지연 요인.**
  (SSH는 origin에 직접 붙고, API는 CF 경유라 우회됨.)
- **CF↔origin = HTTP/1.1** (클라↔CF는 h2). **서버 처리 자체는 ~1~40ms** (네트워크와 무관, 로그로 확인).

### 측정 도구
- **NetworkProbe** — 자체 제작 Expo/Kotlin 네이티브 모듈(OkHttp `EventListener`). DNS/TCP/TLS/TTFB/total
  레이어별 RTT + warm/cold(keep-alive) 측정. (Android·dev 전용)
- **`[API Perf]`** — axios 인터셉터. 실제 앱 요청의 `durationMs` + `decodedBytes`(디코드 후 크기) 로깅.
- **`LoggingNioEndpoint`** (서버) — TCP 연결 수립/종료·동시 연결 수.
- **`ResponseSizeLoggingValve`** (서버) — 원본 vs 압축(on-wire) 응답 크기.

이 문서는 위 환경에서 **"응답 gzip 압축이 지연을 줄이는가"** 를 검증한 기록이다.

## 1. 전략 (가설)

압축은 전송 바이트를 줄여 **TCP 슬로 스타트가 요구하는 추가 왕복(RTT)을 절감**할 때 빨라진다.
따라서 무조건 압축이 아니라:

> **"payload가 초기 윈도우(IW)를 넘어 2번째 이상 RTT가 필요해지는 경우에만 압축한다"**

가 합리적 전략. 이 전략이 성립하려면 **(A) IW threshold가 명확해야** 하고 **(B) 실제 응답이 그
threshold를 넘어야** 한다. 두 전제를 검증한 것이 이 문서.

## 2. 전제 A 검증 — "슬로 스타트 기준은 공식 문서상 명확한가?"

### RFC 6928 (Increasing TCP's Initial Window) — 권고 공식

```
IW = min (10 * MSS, max (2 * MSS, 14600))
```
- **IW10** = 초기 윈도우 10 세그먼트.
- 전형적 MSS 1460B 기준 → **14,600 bytes ≈ 14.3 KiB**.
  - (본 스택의 공용 인터넷 경로 실측 MSS = **1448B** [`ss -ti`] → IW ≈ **14.48KB**)
- 즉 "첫 RTT에 약 14.6KB까지는 ACK 없이 전송 가능" → 이보다 작은 응답은 **1 RTT에 완결**.

### 단, "확정 상수"는 아니다 (중요)

- RFC 6928 상태 = **Experimental** (표준 트랙 아님). 원문: *"a TCP MAY start with an initial
  window that is smaller than 10 segments."* → **MAY / 권고**이지 강제 아님.
- 값이 **MSS 의존** (MSS 다르면 14600 캡과 10*MSS 중 작은 값).
- **OS·서버·CDN마다 실제 initcwnd가 다름** — Linux는 커널 3.0+부터 IW10 기본이지만,
  CDN(Cloudflare 등)은 별도 튜닝(더 큰 IW) 가능.
- 역사적으로도 값이 바뀜: RFC 3390(IW ≈ 3~4 세그먼트, ~4KB) → RFC 6928(IW10). 일반 슬로
  스타트 정의는 RFC 5681(TCP Congestion Control).

> **결론(전제 A):** threshold의 **표준 권고값은 ~14.6KB로 명확**하지만, **Experimental·MAY·
> 서버 의존**이라 **보장된 단일 상수는 아니다.** 하드한 판단 기준으로 쓰려면 **우리 스택의 실제
> IW를 측정**해야 함 — 그것도 **두 구간**: client↔CF(엣지의 IW)와 CF↔origin(origin의 IW)이 각각 다름.

## 3. 전제 B 검증 — "실제 응답이 기준을 넘는가?"

실측 (`GET /api/v1/questions/histories?size=35`, warm):
```
decodedBytes = 10,718 B  (≈ 10.5KB, 디코드 후 = 압축 전 크기)
durationMs   = 456 ms
```
- **10.5KB < ~14.6KB (IW10)** → **첫 윈도우 안, 1 RTT에 전송 완결.**
- 압축으로 ~2KB가 돼도 여전히 같은 1 윈도우 → **줄일 RTT가 없음.**

> **결론(전제 B): 실제 응답은 threshold를 넘지 않았다.** 압축의 트리거 조건 미충족.

## 4. 그래서 — 왜 "실패"인가

- 압축 전략은 "기준 초과 시"에만 유효한데, **현재 트래픽은 기준 미달** → 적용 상황이 아님.
- `durationMs 456ms`의 본체는 payload가 아니라 **한국↔(LA)↔인도 거리(왕복 ~400ms)**.
  payload(1 윈도우)는 수십 ms 기여뿐 → 압축해도 그 일부만 깎임 = 체감 무의미.
- 부수 관측: **size=35(10.5KB) ≈ size=7(~2KB)** 응답 시간 동일 (둘 다 1 RTT) → 이 범위에선
  **payload 크기가 병목이 아님.**

## 5. 측정상 한계 (왜 wire 크기를 앱에서 못 봤나)

- OkHttp가 `Accept-Encoding`을 자동 주입 + **transparent gzip 해제**하면서
  `Content-Encoding`/`Content-Length` 헤더를 **strip** → axios에서 `encoding`/`wireBytes` = **N/A**.
- 신뢰 신호는 **durationMs + decodedBytes** 뿐. 정확한 on-wire 바이트는 OkHttp
  `EventListener.responseBodyEnd(byteCount)`(NetworkProbe) 또는 서버사이드/curl로만 관측.

## 6. 최종 결론

| 항목 | 판정 |
|---|---|
| 슬로 스타트 threshold가 공식 문서상 명확한가 | △ — **RFC 6928 권고값 ~14.6KB(IW10)는 명확**하나 **Experimental·MAY·서버 의존**이라 확정 상수 아님. 실제값은 **스택별 측정 필요** |
| 실제 응답이 그 기준을 넘는가 | ❌ — 10.7KB < ~14.6KB. **미달** |
| 현재 트래픽에 압축이 속도 이득을 주는가 | ❌ — 트리거 조건 미충족 (이미 1 RTT) |
| 압축이 유효해지는 조건 | payload가 **실측 IW(≈14.6KB±)** 를 넘을 때. 그땐 RTT 절감 |
| 압축의 잔여 가치 | 데이터 사용량↓(셀룰러)·대형 응답 대비. 저비용이라 켜둘 만하나 **속도 목적 아님** |
| 이 지연(456ms)의 진짜 레버 | ① **거리(origin 위치)** ② **왕복 수 줄이기** ③ **cold 방지** |

> 결론: 압축은 **"틀린 레버"가 아니라 "조건 미충족"** 이었다. 전략(threshold 초과 시 압축)은
> 타당하나, ⓐ threshold가 RFC상 보장 상수가 아니어서 **실측 확정이 선행**되어야 하고, ⓑ 현재
> 응답이 그 기준 아래라 **지금은 해당 없음**. 본질 병목은 **payload가 아니라 거리(RTT)**.

## 7. 후속 (threshold를 정말 쓰려면)

1. **우리 스택의 실제 IW 측정** — client↔CF 엣지, CF↔origin 각각. 서버 응답을 크기별로 늘려가며
   `Response`(=respStart→respEnd) 또는 byteCount가 어느 크기에서 1 RTT→2 RTT로 꺾이는지 관찰.
2. 그 실측 임계 이상 응답에만 압축 적용 정책화.

```bash
# 압축 ON/OFF wire·time 직접 비교 (큰 응답에서만 유의미, 중앙값·warm 기준)
curl -s -H "Accept-Encoding: br,gzip"  -H "Authorization: Bearer <TOKEN>" -o /dev/null \
  -w "wire=%{size_download}B time=%{time_total}s\n" "<URL>"
curl -s -H "Accept-Encoding: identity" -H "Authorization: Bearer <TOKEN>" -o /dev/null \
  -w "wire=%{size_download}B time=%{time_total}s\n" "<URL>"
```

## 8. 검증 완료 — gzip A/B 실증

전제 B(§3)의 ~10KB와 달리, 실제로 **threshold를 넘는 응답(18~22KB)** 이 존재했고, 거기에 압축을
적용해 전략을 실증했다.

### 적용 구성
- **origin(Spring Boot)에서 gzip 압축 활성화**
- 압축 대상 MIME: **`application/json` 만** (이미지 등 이미 압축된 콘텐츠 제외 → 재압축 낭비 방지)
- 클라(OkHttp): **무설정** — `Accept-Encoding: gzip` 자동 주입 + 투명 해제

### 결과 (`GET /api/v1/questions/histories?size=35`, warm)

| 구분 | decodedBytes | durationMs | RTT(추정) |
|---|---|---|---|
| 무압축 | 18.4 KB | 768 ms | 2 |
| 무압축 | 19.8 KB | 785 ms | 2 |
| **gzip** | **22.5 KB** | **508 ms** | **1** |
| **gzip** | **22.5 KB** | **465 ms** | **1** |

> ⚠️ **RTT 횟수(2/1)는 직접 측정값이 아니라 추정.** 실측한 것은 `durationMs`·`decodedBytes`·크기별
> 패턴뿐이며, "~300ms 점프 = 슬로 스타트 추가 왕복 1번"은 **durationMs + IW10 모델로 추론**한 라벨이다.
> 실제 왕복 수는 패킷 캡처(tcpdump/Wireshark)로 확정하지 않았다.

### 해석
- 압축 후에도 `decodedBytes`는 22.5KB (= 해제 후 크기라 오히려 더 큼). 그런데 durationMs는 465~508ms.
- 무압축이면 22.5KB는 IW(~14.6KB) 초과라 **반드시 2 RTT(~770ms+)** 여야 함. 1 RTT(~485ms)로 나온 것은
  **on-wire가 gzip으로 ~2.4KB(서버 실측, JSON ~90%↓)로 줄어 첫 윈도우 안으로 복귀**했다는 직접 증거.
  (아래 "서버 실측 압축 크기" 참고)
- **22.5KB(더 큰 payload)가 18KB(더 작은 무압축)보다 ~300ms 빠름** — 크기 역전이 곧 압축 작동의 증거.

### 효과
```
대형 응답(>14.6KB):  무압축 2 RTT ~770ms  →  gzip 1 RTT ~485ms   ≈ -285ms (~37%)
소형 응답(<14.6KB):  변화 없음 (이미 1 RTT, jitter 범위)
```

### 서버 실측 압축 크기 (ResponseSizeLoggingValve)
origin(Tomcat)에 응답 크기 로깅 Valve를 추가해 **원본 vs 압축(on-wire) 크기를 직접 기록**(2026-06-03):
```
[RESP] GET /api/v1/questions/histories status=200 원본=23626B 전송=2433B(gzip) 절감=89.7%
[RESP] GET /api/v1/questions/histories status=200 원본=22966B 전송=2459B(gzip) 절감=89.3%
```
| 원본(decoded) | 전송(wire·gzip) | 절감 | 배율 |
|---|---|---|---|
| 23,626 B (~23 KB) | **2,433 B (~2.4 KB)** | **89.7%** | ~9.7x |
| 22,966 B (~22 KB) | **2,459 B (~2.4 KB)** | **89.3%** | ~9.3x |

- gzip이 이 JSON을 **~90% 압축(≈10x)**. (반복 구조 JSON이라 압축률이 매우 높음)
- **결정적**: 압축 후 **~2.4 KB ≪ IW10(~14.6 KB)** → 첫 윈도우 안 = **1 RTT 확정.** §8 앞부분의 durationMs
  추론(2 RTT→1 RTT)을 **서버 실측이 직접 뒷받침**.
- **여유도 큼**: 2.4 KB vs 14.6 KB → 원본이 **약 6배(~140 KB)** 까지 커져도 압축 후 여전히 IW 안 → 1 RTT 유지.
- 이 Valve는 **origin이 보낸 바이트**를 기록 → **비싼 인도 leg(origin→CF)가 2.4 KB로 건너감** 확인
  (= origin 압축이 올바른 위치였음).

> 참고: 앱 `decodedBytes`(~22.5KB)와 서버 `원본`(~23KB)의 ~1KB 차이는 JSON.stringify(앱) vs
> 서버 raw 응답 바이트(공백·키 순서·숫자 표기 차이) 때문. 둘 다 "압축 전 크기"로 동일 맥락.

### 어느 구간의 RTT가 줄었나 (추정)

줄어든 ~285ms가 **어느 leg의 RTT와 일치하는가**로 귀속을 추론한다. (구간 RTT는 별도 측정:
한국↔미국 ≈ 150ms[TCP 핸드셰이크 실측], 미국↔인도 ≈ 257ms[전체−한국미국 도출])

| 후보 구간 | RTT | 절감폭(~285ms)과 매칭 |
|---|---|---|
| 한국 ↔ 미국(LA) | ~150ms | ❌ 너무 작음 |
| **미국(LA) ↔ 인도 (origin↔CF)** | **~257ms** | ✅ **거의 일치** |
| 양쪽 합 | ~407ms | ❌ 너무 큼 |

- 절감폭 ~285ms ≈ **LA↔인도 RTT(257ms)** → 줄어든 1 RTT는 **origin↔CF(인도) leg**로 추정.
- **CF↔client(LA) leg는 페널티 없었던 듯** — Cloudflare가 initcwnd를 크게 튜닝하면 18~22KB도
  한 윈도우에 전송되어 추가 RTT가 안 생김(추정).
- 이 추론은 **"origin에서 압축해야 효과"** 라는 결론과도 정합적 — 병목이 인도 leg였으므로
  origin이 그 구간에 압축 바이트를 실어야 함.
- **확정 방법(미실행):** ⓐ "CF만 압축(origin 무압축)"으로 바꿔 개선이 사라지면 인도 leg 확정,
  ⓑ 각 leg 패킷 캡처로 왕복 수 직접 카운트.

### 결론 (검증)
- **전략 실증 완료** — `gzip` + `application/json` 한정 구성으로, IW를 넘던 18~22KB 응답을
  **2 RTT → 1 RTT**, **~37% 단축**.
- 단 **단건 체감은 0.77→0.49초 수준으로 극적이진 않음**, 그리고 **소형 응답엔 무효**. 한 줄 설정
  치곤 좋은 ROI이나, **체감을 바꾸는 근본 레버는 여전히 거리(origin 위치)**.
- 신뢰도: 위는 소표본(각 2회). 정책화 전 **크기대별 5~10회 중앙값**으로 한 번 더 확정 권장.

## 9. 검증 동기 — "정말 압축(RTT 절감) 때문인가?" (cwnd 교란 배제)

이 절은 **두 가지 목적**을 가진다:
1. **(인과 확정)** §8 개선이 정말 "압축이 payload를 IW 밑으로 줄여 슬로 스타트 왕복을 없앤 것"인지,
   아니면 다른 교란(커넥션 재사용으로 cwnd가 이미 커져 빨랐다)인지 구분.
2. **(반대 의문 규명)** 압축 *전*, 커넥션이 재사용되어 cwnd가 컸을 텐데 **왜 2번째 큰 요청이
   안 빨라졌나**(무압축 768ms ≈ 785ms, carry-over 없음)를 설명.

두 의문 모두 **"연결이 살아있어도 cwnd는 유지되지 않는다"** 는 같은 메커니즘으로 풀린다.

### 확인 1 — 커넥션 재사용 여부 (origin TCP 로거)
origin의 TCP 연결 로거(`LoggingNioEndpoint`, 연결 수립/종료 + 동시 연결 수)로 관찰:
- **curl 루프**: 매 요청마다 TCP 수립→종료 (각 curl이 별도 프로세스라 재사용 X)
- **앱(OkHttp)**: TCP 유지·재사용 (동시 연결 수가 유지됨) → 즉 **CF↔origin TCP도 살아있음**
- 부수 확인: 요청 protocol = **HTTP/1.1** (CF↔origin 확정), 서버 처리 **~4ms** (서버 무관 재확인)

### 확인 2 — "연결 유지 ≠ cwnd 유지" (RFC 5681 §4.1)
핵심: 연결이 살아있어도 cwnd는 리셋된다. RFC 5681 §4.1 "Restarting Idle Connections" 명문:

> *"a TCP SHOULD set cwnd to no more than **RW** before beginning transmission if the TCP has not
> sent data in an interval exceeding the **retransmission timeout**."*  (RW = min(IW, cwnd))

- **idle > RTO** 이면 → cwnd를 **RW = min(IW, cwnd) = IW** 로 리셋 (cwnd가 컸어도 IW로 되돌림)
- RTO ≈ 수백 ms~1s (인도 leg RTT ~257ms 기반, Linux 최소 200ms). 요청 간 텀이 그 이상이면 리셋.
- → **warm 커넥션이어도 cwnd는 매 요청 IW에서 시작**(텀 있으면). Linux 구현: `tcp_slow_start_after_idle`(기본 1).

### 확인 3 — "무압축 2번째 요청은 왜 안 빨라졌나" (목적 2의 답)
- **관찰**: 무압축 큰 요청을 연속으로 → 768ms ≈ 785ms (거의 동일, **carry-over 없음**)
- **기대했던 것**: TCP 재사용 + 1번째 요청에서 cwnd 성장(10→…) → 2번째는 커진 cwnd로 **1 RTT에 끝나야**
- **실제 이유**: 두 요청 사이 **idle > RTO → RFC 5681 §4.1에 따라 cwnd가 IW로 리셋** → 2번째도
  슬로 스타트를 처음부터 → 1번째와 동일하게 2 RTT.
- 즉 **"연결은 유지(handshake 절약 ✓) / cwnd는 리셋(carry-over ✗)"** 이 768≈785의 정체.
  → cwnd 성장은 사실상 **단일 transfer 안에서만** 일어나고, 텀 둔 다음 요청으로 안 넘어감.

### 결론 — 인과 확정
- cwnd는 RFC 규칙상 **idle마다 IW로 리셋**되어 요청 간 **안정적 우위를 못 줌** → "압축 요청이 우연히
  큰 cwnd를 물려받아 빨랐다"는 **교란 가설 배제**.
- 압축/무압축 차이(~285ms)는 **payload의 on-wire 크기가 IW를 넘느냐**에만 연동되고, 커넥션/cwnd
  상태와 **독립**.
- ∴ §8의 개선은 **압축이 on-wire payload를 IW 밑으로 줄여 슬로 스타트 RTT를 제거한 것**이 맞다.
- 그리고 바로 이 때문에 **압축이 "cwnd 운빨"보다 견고**: payload < IW면 cwnd가 IW로 리셋돼도 항상
  1 윈도우. (반대로 cwnd carry-over에 기대는 건 RFC 5681 §4.1 리셋 때문에 불안정)

## 10. 권고 (정리)

지연의 본질은 **payload가 아니라 거리(특히 Cloudflare-LA 우회)**. 레버를 효과/비용순으로:

| 레버 | 효과 | 비용 / 트레이드오프 | 상태 |
|---|---|---|---|
| **gzip 압축** (origin, `application/json`) | 대형(>IW) 응답 2RTT→1RTT (~37%) + 데이터 ~90%↓ | 설정 한 줄 | ✅ 적용 |
| **왕복 수 줄이기** (API aggregation·`Promise.all` 병렬) | 호출당 ~400ms 누적 절감 | API 설계 | 권장 |
| **cold 방지** (앱 foreground 커넥션 워밍) | 첫 요청 ~1100→~400ms | 작은 코드 | 권장 |
| **grey-cloud** (API DNS-only) | CF-LA 우회 제거 → ~407→~110ms | origin IP 노출·WAF/DDoS 상실(Oracle WAF로 대체 가능) | 검토 |
| **origin 서울 이전** (Oracle ap-seoul-1) | 거리 자체 제거 → ~20~50ms | 마이그레이션(Always Free면 home region 제약) | 근본 |

- **즉시 가능**: 압축(적용 완료)·왕복 수 줄이기·cold 방지 — 코드/설정 수준.
- **근본 레버**: grey-cloud / origin 서울 이전 — 보안·마이그레이션 비용을 수반하지만 거리를 실제로 줄이는 유일한 길.
- 압축은 **"싸게 얻는 부분 개선"**, 체감을 바꾸는 건 **origin 위치**.

## 참고 (공식 문서)
- **RFC 6928** — Increasing TCP's Initial Window (IW10, `min(10*MSS, max(2*MSS, 14600))`, Experimental)
  — https://www.rfc-editor.org/rfc/rfc6928
- **RFC 5681** — TCP Congestion Control (슬로 스타트 일반 정의 + **§4.1 Restarting Idle Connections**: idle>RTO 시 cwnd→RW=min(IW,cwnd) 리셋)
  — https://www.rfc-editor.org/rfc/rfc5681
- **RFC 2861** — TCP Congestion Window Validation (idle·application-limited 구간 cwnd 감쇠)
  — https://www.rfc-editor.org/rfc/rfc2861
- **RFC 6298** — Computing TCP's Retransmission Timer (RTO 계산: SRTT + 4×RTTVAR)
  — https://www.rfc-editor.org/rfc/rfc6298
- **RFC 3390** — (역사적) Increasing TCP's Initial Window (이전 IW ~3–4 세그먼트)
  — https://www.rfc-editor.org/rfc/rfc3390
