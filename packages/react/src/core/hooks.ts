import { shallowEquals, withEnqueue } from "../utils";
import { context } from "./context";
import { EffectHook } from "./types";
import { enqueueRender } from "./render";
import { HookTypes } from "./constants";

/**
 * 이펙트 큐를 실행합니다.
 */
const flushEffects = (): void => {
  const effectsToRun = [...context.effects.queue];
  context.effects.queue = [];

  effectsToRun.forEach(({ path, cursor }) => {
    const hooks = context.hooks.state.get(path);
    if (!hooks) return;

    const hook = hooks[cursor];
    if (!hook || typeof hook !== "object" || !("kind" in hook) || hook.kind !== "effect") return;

    // 이전 cleanup 실행
    if ("cleanup" in hook && typeof hook.cleanup === "function") {
      hook.cleanup();
    }

    // 새 이펙트 실행
    if ("effect" in hook && typeof hook.effect === "function") {
      const cleanup = hook.effect();
      if (typeof cleanup === "function") {
        hook.cleanup = cleanup;
      } else {
        hook.cleanup = null;
      }
    }
  });
};

/**
 * 이펙트 실행을 스케줄링합니다.
 */
export const enqueueFlushEffects = withEnqueue(flushEffects);

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = () => {
  // 현재 렌더링에서 방문하지 않은 컴포넌트 찾기
  const pathsToRemove: string[] = [];

  context.hooks.state.forEach((hooks, path) => {
    // 현재 렌더링에서 방문하지 않은 path는 제거 대상
    if (!context.hooks.visited.has(path)) {
      pathsToRemove.push(path);

      // 이펙트 cleanup 함수 실행
      hooks.forEach((hook) => {
        if (hook && typeof hook === "object" && "kind" in hook && hook.kind === HookTypes.EFFECT) {
          const effectHook = hook as EffectHook;
          if (effectHook.cleanup) {
            effectHook.cleanup();
          }
        }
      });
    }
  });

  // 제거 대상 path의 상태와 커서 제거
  pathsToRemove.forEach((path) => {
    context.hooks.state.delete(path);
    context.hooks.cursor.delete(path);
  });
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  // 1. 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다.
  const path = context.hooks.currentPath;
  const cursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 2. 첫 렌더링이라면 초기값으로 상태를 설정합니다.
  if (cursor >= hooks.length) {
    // Lazy initialization: 초기값이 함수면 실행
    const value = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    hooks.push(value);
  }

  // 3. 현재 상태 가져오기
  const currentState = hooks[cursor] as T;

  // 4. 상태 변경 함수(setter)를 생성합니다.
  const setState = (nextValue: T | ((prev: T) => T)) => {
    // 새 값 계산 (함수형 업데이트 지원)
    const newValue = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(hooks[cursor] as T) : nextValue;

    // Object.is로 값 비교
    if (!Object.is(newValue, hooks[cursor])) {
      // 값이 다르면 상태 업데이트하고 재렌더링 예약
      hooks[cursor] = newValue;
      enqueueRender();
    }
  };

  // 5. 훅 커서를 증가시키고 [상태, setter]를 반환합니다.
  context.hooks.cursor.set(path, cursor + 1);

  return [currentState, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  // 1. 현재 컴포넌트 정보 가져오기
  const path = context.hooks.currentPath;
  const cursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 2. 이전 훅 정보 가져오기
  const oldHook = hooks[cursor] as EffectHook | undefined;

  // 3. 의존성 배열 비교
  const depsChanged =
    !oldHook || // 첫 렌더링
    deps === undefined || // deps가 없으면 매번 실행
    oldHook.deps === null || // 이전에 deps가 없었으면
    !shallowEquals(deps, oldHook.deps); // deps 비교

  // 4. 이펙트 실행 결정
  if (depsChanged) {
    // 이펙트 실행을 큐에 추가
    context.effects.queue.push({ path, cursor });

    // 이펙트 실행 스케줄링
    enqueueFlushEffects();
  }

  // 5. 훅 정보 저장
  const newHook: EffectHook = {
    kind: HookTypes.EFFECT,
    deps: deps ?? null,
    cleanup: oldHook?.cleanup ?? null,
    effect,
  };

  if (cursor >= hooks.length) {
    hooks.push(newHook);
  } else {
    hooks[cursor] = newHook;
  }

  // 6. 커서 증가
  context.hooks.cursor.set(path, cursor + 1);
};
