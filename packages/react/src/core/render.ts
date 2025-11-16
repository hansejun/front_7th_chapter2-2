import { context } from "./context";
import { insertInstance } from "./dom";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { withEnqueue } from "../utils";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  // 1. 훅 컨텍스트를 초기화합니다.
  context.hooks.visited.clear();

  // 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  const { container, node, instance } = context.root;

  if (!container || !node) return;

  const newInstance = reconcile(container, instance, node, "0");
  context.root.instance = newInstance;

  // DOM에 삽입 (첫 렌더링 시)
  if (newInstance && !instance) {
    insertInstance(container, newInstance);
  }

  // 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.
  cleanupUnusedHooks();
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
