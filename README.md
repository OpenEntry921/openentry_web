# OpenEntry Web

openentry.io의 공개 파일을 기반으로 만든 독립 실행 프로젝트입니다. AWS 내부 소스·DB를 확보한 프로젝트는 아닙니다. 운영 사이트 변경·DNS 변경·배포·Merge를 하지 않았습니다.

## 설치·실행

Node.js 22 이상(검증: 24.19.0), npm이 필요합니다. 런타임 외부 패키지는 없습니다.

```sh
cd /workspace/openentry_web
npm ci --cache /tmp/openentry-npm-cache
npm run build
npm start
```

기본 포트는 3000이며 `PORT`로 변경합니다. 필수 비밀키나 API 환경변수는 없습니다. `npm run dev`는 빌드 후 서버를 실행하며 자동 재빌드는 하지 않습니다. 수정 후 빌드하고 브라우저를 새로고침하세요.

## 구조·유지보수

- `archive/public-source/`: 메인 공개 원본 파일 17개. URL·해시·수집 상태·사용 위치는 `archive/manifest.json`.
- `archive/external/`: 지갑 공개 파일을 실행하지 않는 보관 영역. `external-manifest.json`에 보안상 제외 파일을 기록했습니다.
- `src/pages/`: 확보한 11개 HTML과 SEO 파일. 실행 자산 경로만 로컬 프로젝트 경로로 바꿨습니다.
- `src/site.js`, `src/styles.css`: 공개 번들을 서식 정리한 편집 가능한 파일. 원본 개발 소스가 아닙니다. 문구·페이지·이벤트 처리 코드는 `site.js`에서 수정합니다. 초기 HTML도 동일하게 수정해야 JavaScript 실행 전·검색엔진 콘텐츠가 일치합니다.
- `public/`: 원본 로고와 favicon.
- `archive/fonts/`: 원본 Google Fonts CSS와 중복 제거한 폰트 파일 136개. 빌드가 dist/fonts로 복사합니다.
- `docs/validation/`: 이 작업에서 실행한 검증 결과.
- `scripts/`: 새로 작성한 빌드·서버·검증 도구. `dist/`는 빌드 출력이며 Git에 포함하지 않습니다.

원본은 독립 DOM 렌더링·CSS·Canvas로 동작합니다. React로 다시 작성하면 콘텐츠와 동작 차이가 생길 수 있어 공개 구현을 유지했습니다. 서버는 정적 파일만 제공하며 DB·거래·인증 서비스를 추가하지 않았습니다.

## 검증

```sh
npm test
# 별도 터미널에서 npm start 실행 후:
npm run test:browser
```

브라우저 검사는 Chromium이 필요합니다. 기본 `/usr/bin/chromium`, 다른 설치는 `CHROMIUM_PATH`로 지정하세요. 브라우저·비교 결과와 캡처는 Git 제외된 `validation/`에 저장합니다. 브라우저 오류와 외부 자산 요청을 검사하며 실제 오류가 있으면 실패합니다. 페이지 이동에 따른 ERR_ABORTED 요청만 구분합니다.

원본 수집본 비교는 같은 서버를 3002 포트에서 archive/public-source에 대해 실행하고 `npm run test:compare`를 사용합니다. 비교용 서버 시작 명령:

```sh
node scripts/reference-server.mjs
```

비교는 4개 대표 페이지 × 3 화면 너비, 동일 텍스트·전체 이미지 픽셀을 검사합니다. 동적 Canvas는 숨기고 CSS 애니메이션·transition은 비교에서 멈춥니다. Canvas의 픽셀 일치나 실제 운영 브라우저의 전체 디자인 일치 검증을 뜻하지 않습니다.

## 폰트와 비교 조건

원본 Google Fonts CSS와 136개 폰트 파일을 archive/fonts에 보관하고 빌드 시 URL만 로컬 경로로 변환합니다. DM Sans, IBM Plex Mono, Noto Sans KR 및 원본 weight·unicode-range를 유지합니다. 폰트 라이선스는 archive/font-licenses에 보관하며 빌드에 함께 포함합니다. 사이트 실행에 외부 폰트 접속은 필요하지 않습니다.

초기 네트워크 차단을 해결한 뒤 검증했습니다. 비교용 수집본 서버는 원본 Google Fonts 요청에 확보한 원본 폰트 파일을 응답해 같은 폰트로 비교합니다. 실제 운영 사이트 비교는 REFERENCE_ORIGIN=https://openentry.io npm run test:compare 명령을 사용합니다. TLS 검증은 유지해야 합니다. 클라우드 Chromium은 NSS 신뢰 저장소에 정상 접근할 실행 권한이 필요할 수 있습니다.

## 현재 제한

메인의 Wallet 링크는 원래 외부 사이트로 이동하는 링크만 유지합니다. 지갑 앱·금융거래·서명·송금은 이 프로젝트에서 제공하지 않습니다. 서버 API·DB·인증·실제 금융 기능 복원은 별도 권한과 보안 검증이 필요합니다.

## Cloudtype 배포 준비

Node.js 서비스로 배포 가능한 구조입니다. 설치 `npm ci`, 빌드 `npm run build`, 시작 `npm start`, 포트 `PORT`를 설정합니다. devDependencies는 검증 도구로만 사용합니다. 정적 호스팅도 가능하지만 `/network` 등 확장자 없는 경로를 해당 디렉터리의 index.html로 제공해야 합니다. canonical·sitemap·JSON-LD는 원본 openentry.io를 가리키므로 독립 운영 배포 승인 시 배포 도메인에 맞게 검토해야 합니다.

지갑·연구자료 외부 링크, 보안 헤더·캐시·배포 도메인은 배포 전 검토 사항입니다. Cloudtype에서 실제 빌드·배포하지 않았으므로 플랫폼 검증 완료를 주장하지 않습니다.
