import { context } from "./context";
import { isEmptyValue } from "../utils";
import { VNode } from "./types";

/**
 * children에서 empty value를 필터링합니다.
 */
export const filterValidChildren = (children: VNode[] = []): VNode[] => {
  return children.filter((child: VNode) => !isEmptyValue(child));
};

/**
 * 컴포넌트 훅 스택 관리를 감싸는 래퍼 함수입니다.
 */
export const withComponentHooks = <T>(path: string, fn: () => T): T => {
  context.hooks.componentStack.push(path);
  context.hooks.visited.add(path);
  context.hooks.cursor.set(path, 0);

  try {
    return fn();
  } finally {
    context.hooks.componentStack.pop();
  }
};
