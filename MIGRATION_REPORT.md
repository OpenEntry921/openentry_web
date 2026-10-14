# MIGRATION_REPORT

조사·검증일: 2026-10-14 (KST). 대상: OpenEntry921/openentry_web 및 openentry.io 공개 웹사이트.

## 확보·복원 범위

- 조사: 메인 11페이지, 별도 xrp.openentry.io 첫 화면 1개. 사이트맵·HTML 링크·메인 공개 번들의 경로 목록이 일치했다.
- 복원: 메인 11페이지. 원문·한영 데이터·메뉴·SVG·Canvas·상호작용 코드를 보존했다. 원본 개발 프로젝트나 AWS 내부 코드는 확보하지 못했다.
- 공개 사이트 파일 수집 성공: 176개. Git에 보관: 175개 = 메인 17개 + 메인 폰트 CSS/파일 137개 + 지갑 공개 파일 21개. 지갑 파일 1개는 보안상 제외했다.
- 폰트 라이선스 3개는 공식 Google Fonts 저장소에서 별도로 확보했다. 생성한 manifest·프로젝트 코드·문서 및 라이선스는 위 사이트 파일 수에 포함하지 않는다.
- 메인 공개 PDF·동영상·다운로드 JSON은 조사한 공개 참조에서 발견하지 못했다. 외부 연구자료는 원래 링크를 보존하며 전체 외부 도메인을 수집하지 않았다.
- 자산별 URL·HTTP 상태·해시·사용 위치: archive/manifest.json, font-manifest.json, external-manifest.json. 폰트 최초 실패와 후속 해결: missing-assets.json.

## 원본 파일과 새 구현의 구분

archive/public-source 및 archive/fonts는 변경하지 않은 공개 응답이다. src/pages는 수집 HTML에서 실행 자산 경로만 변경했다. src/site.js와 src/styles.css는 원본 공개 번들을 서식 정리한 파일이다. CSS의 Google Fonts import를 로컬 import로 바꾸고, 빌드에서 원본 @font-face URL만 로컬로 변환한다. 원본 글꼴 family·weight·unicode-range를 유지한다.

새로 작성한 부분은 Node 정적 서버, 빌드·수집·검증 스크립트, package manifest·lockfile 및 문서이다. React/Next.js·새 DB·API 서버를 추가하지 않았다. 원본 사이트는 DOM 기반 페이지 생성 코드와 CSS·Canvas를 사용한다. 원본 번들에 빌드 도구 흔적은 있지만 원래 package.json·소스맵·CI·개발 소스 구조는 알 수 없다.

## 문제와 해결

1. 최초 원본·GitHub API 접근은 프록시 차단. 필요한 도메인 설정 초안을 저장한 뒤 현재 실행에서 HTTPS 수집·GitHub API 접근이 가능해졌다.
2. Google Fonts는 추가 접근이 필요했다. 원본 CSS와 136개 폰트를 TLS 검증을 유지해 확보하고 로컬에서 제공한다. 정상 실행 시 외부 자산 요청이 없다.
3. 일반 샌드박스 Chromium에서 인증서 오류가 발생했다. 기존 NSS 인증서 저장소 접근이 가능한 실행으로 실제 원본 HTTPS 비교를 수행한다. 인증서 검증을 끄지 않았다. 로컬 복원 사이트 검사는 일반 실행으로 통과했다.
4. 원본 하위 페이지는 /network → /network/ 등의 301 리다이렉트를 사용한다. 같은 처리를 로컬 서버에 구현했다. 초기 비교의 메뉴 색상 차이는 이 URL 차이로 진단했다.
5. XRP 공개 진입 번들에서 지갑 시드로 보이는 고정 문자열을 발견했다. 해당 파일을 Git 보관 대상에서 제외하고 해시·제외 사유만 남겼다. 값을 사용하거나 유효성을 검사하지 않았다. 지갑은 서비스로 복원하지 않았다.

## 검증 결과

- npm ci, npm run build, npm test 통과. 메인 17개와 폰트 137개 원본 파일 해시 및 빌드의 로컬 링크·자산을 확인했다.
- 로컬 브라우저: 11페이지 HTTP 200, h1·로고, 각 페이지 EN/KR 전환 통과.
- 예시 UI 선택 버튼 29개, PvP·정책 결과 문구, 키보드 탭, 언어 기억, 페이지 이동, 움직임 일시정지 통과.
- 홈 화면 390·768·1440px 가로 넘침 없음. 모바일 메뉴 열기·Escape 닫기 통과.
- 브라우저 콘솔·JavaScript 오류 없음, 외부 자산 요청 없음. 페이지 이동으로 취소된 ERR_ABORTED 요청은 실제 로딩 실패와 구분한다.
- 대표 4페이지(/, /network, /technology, /solutions/tokenization) × 3너비의 수집 원본 비교: 텍스트·화면 크기·정적 픽셀 일치. 폰트는 원본 확보 파일을 사용한다.
- 실제 운영 사이트 최종 비교도 12개 화면에서 텍스트·크기·정적 픽셀 차이 0으로 통과했다. docs/validation/live-comparison-results.json에 기록했다. 비교에서는 CSS animation·transition을 멈추고 reveal을 표시하며 Canvas를 숨긴다. 동적 애니메이션 전체나 Canvas 픽셀 일치를 뜻하지 않는다.

실행 기록은 docs/validation에 포함하고 대용량 캡처와 빌드 출력은 Git에 포함하지 않는다.

## 미복원·미검증

AWS 서버·DB·인증·API 구현, 지갑 연결·키 보관·서명·송금·금융거래, 지갑 내부 전체 경로는 미복원이다. 지갑 공개 자산은 실행하지 않는 부분 보관이며 금융 기능이 정상 작동한다는 뜻이 아니다. 외부 연구자료 링크, 실제 메일 발송·클립보드 쓰기, Canvas의 정확한 동작·전체 스크롤 애니메이션, 모든 하위 페이지의 모든 모바일 기능은 검증 완료로 주장하지 않는다.

원본과의 구조 차이는 편집 가능한 공개 번들 정리, 로컬 자산 경로, 독립 Node 정적 서버와 신규 빌드·검증 도구이다. canonical·sitemap·JSON-LD의 원본 도메인은 보존되어 있어 새 운영 도메인 배포 시 검토가 필요하다.

## GitHub·환경·배포

명시적으로 승인된 최소 README 첫 커밋만 main에 생성했다. 이후 변경은 restore/openentry-public-site에서 작성한다. main 추가 Push·Merge·AWS 변경·DNS 변경·Cloudtype 실제 배포는 수행하지 않는다.

재사용 환경 설정 초안에 네트워크 도메인, install_script, start_skill을 저장했다. 초안 저장과 환경 게시·새 작업 복원 검증은 별개이며 후자는 아직 수행하지 않았다. Node 서비스로 Cloudtype 배포 가능한 구조이나 플랫폼 배포 테스트는 하지 않았다. README에 명령·PORT·정적 경로·도메인 제약을 기록했다.
