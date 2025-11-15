## 과제 체크포인트

### 배포 링크

<!--
배포 링크를 적어주세요
예시: https://<username>.github.io/front-7th-chapter2-2/

배포가 완료되지 않으면 과제를 통과할 수 없습니다.
배포 후에 정상 작동하는지 확인해주세요.
-->

### 기본과제

#### Phase 1: VNode와 기초 유틸리티
- [ ] `core/elements.ts`: `createElement`, `normalizeNode`, `createChildPath`
- [ ] `utils/validators.ts`: `isEmptyValue`
- [ ] `utils/equals.ts`: `shallowEquals`, `deepEquals`

#### Phase 2: 컨텍스트와 루트 초기화
- [ ] `core/types.ts`: VNode/Instance/Context 타입 선언
- [ ] `core/context.ts`: 루트/훅 컨텍스트와 경로 스택 관리
- [ ] `core/setup.ts`: 컨테이너 초기화, 컨텍스트 리셋, 루트 렌더 트리거

#### Phase 3: DOM 인터페이스 구축
- [ ] `core/dom.ts`: 속성/스타일/이벤트 적용 규칙, DOM 노드 탐색/삽입/제거

#### Phase 4: 렌더 스케줄링
- [ ] `utils/enqueue.ts`: `enqueue`, `withEnqueue`로 마이크로태스크 큐 구성
- [ ] `core/render.ts`: `render`, `enqueueRender`로 루트 렌더 사이클 구현

#### Phase 5: Reconciliation
- [ ] `core/reconciler.ts`: 마운트/업데이트/언마운트, 자식 비교, key/anchor 처리
- [ ] `core/dom.ts`: Reconciliation에서 사용할 DOM 재배치 보조 함수 확인

#### Phase 6: 기본 Hook 시스템
- [ ] `core/hooks.ts`: 훅 상태 저장, `useState`, `useEffect`, cleanup/queue 관리
- [ ] `core/context.ts`: 훅 커서 증가, 방문 경로 기록, 미사용 훅 정리

**기본 과제 완료 기준**: `basic.equals.test.tsx`, `basic.mini-react.test.tsx` 전부 통과

### 심화과제

#### Phase 7: 확장 Hook & HOC
- [ ] `hooks/useRef.ts`: ref 객체 유지
- [ ] `hooks/useMemo.ts`, `hooks/useCallback.ts`: shallow 비교 기반 메모이제이션
- [ ] `hooks/useDeepMemo.ts`, `hooks/useAutoCallback.ts`: deep 비교/자동 콜백 헬퍼
- [ ] `hocs/memo.ts`, `hocs/deepMemo.ts`: props 비교 기반 컴포넌트 메모이제이션

## 과제 셀프회고

<!-- 과제에 대한 회고를 작성해주세요 -->

### 아하! 모먼트 (A-ha! Moment)
<!--
과제를 진행하며 "아!" 하고 깨달음을 얻었던 순간이 있다면 공유해주세요.
어떤 부분에서 어려움을 겪다가, 어떤 계기로 개념이 명확해졌나요?
(예: "useState의 클로저와 호출 순서의 관계를 디버깅하며 비로소 이해했습니다.")
-->

### 기술적 성장
<!--
- 이번 과제를 통해 새로 학습한 개념은 무엇인가요?
- 기존에 알고 있던 지식이 어떻게 더 깊어졌나요?
- 구현 과정에서 마주친 기술적 도전과, 이를 어떻게 해결했나요?
-->

### 코드 품질
<!-- 예시
- 특히 만족스러운 구현
- 리팩토링이 필요한 부분
- 코드 설계 관련 고민과 결정
-->

### 학습 효과 분석
<!-- 예시
- 가장 큰 배움이 있었던 부분
- 추가 학습이 필요한 영역
- 실무 적용 가능성
-->

### 과제 피드백
<!-- 예시
- 과제에서 모호하거나 애매했던 부분
- 과제에서 좋았던 부분
-->

## 리뷰 받고 싶은 내용

<!--
피드백 받고 싶은 내용을 구체적으로 남겨주세요
모호한 요청은 피드백을 남기기 어렵습니다.

참고링크: https://chatgpt.com/share/675b6129-515c-8001-ba72-39d0fa4c7b62

모호한 요청의 예시)
- 코드 스타일에 대한 피드백 부탁드립니다.
- 코드 구조에 대한 피드백 부탁드립니다.
- 개념적인 오류에 대한 피드백 부탁드립니다.
- 추가 구현이 필요한 부분에 대한 피드백 부탁드립니다.

구체적인 요청의 예시)
- 현재 함수와 변수명을 보면 직관성이 떨어지는 것 같습니다. 함수와 변수를 더 명확하게 이름 지을 수 있는 방법에 대해 조언해주실 수 있나요?
- 현재 파일 단위로 코드가 분리되어 있지만, 모듈화나 계층화가 부족한 것 같습니다. 어떤 기준으로 클래스를 분리하거나 모듈화를 진행하면 유지보수에 도움이 될까요?
- MVC 패턴을 따르려고 했는데, 제가 구현한 구조가 MVC 원칙에 맞게 잘 구성되었는지 검토해주시고, 보완할 부분을 제안해주실 수 있을까요?
- 컴포넌트 간의 의존성이 높아져서 테스트하기 어려운 상황입니다. 의존성을 낮추고 테스트 가능성을 높이는 구조 개선 방안이 있을까요?
-->
