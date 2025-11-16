import { deepEquals } from "../utils";
import { DependencyList } from "./types";
import { useMemo } from "./useMemo";

/**
 * `deepEquals`를 사용하여 의존성을 깊게 비교하는 `useMemo` 훅입니다.
 */
export const useDeepMemo = <T>(factory: () => T, deps: DependencyList): T => {
  // useMemo와 deepEquals 함수를 사용하여 깊은 비교
  return useMemo(factory, deps, deepEquals);
};
