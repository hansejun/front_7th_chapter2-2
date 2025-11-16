import type { AnyFunction } from "../types";
import { useCallback } from "./useCallback";
import { useRef } from "./useRef";

/**
 * 항상 최신 상태를 참조하면서도, 함수 자체의 참조는 변경되지 않는 콜백을 생성합니다.
 *
 * @param fn - 최신 상태를 참조할 함수
 * @returns 참조가 안정적인 콜백 함수
 */
export const useAutoCallback = <T extends AnyFunction>(fn: T): T => {
  // useRef로 항상 최신 함수를 참조
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // useCallback으로 안정적인 참조를 반환 (의존성 배열 비움)
  return useCallback(((...args) => fnRef.current(...args)) as T, []);
};
