/**
 * VNode가 렌더링되지 않아야 하는 값인지 확인합니다.
 * (예: null, undefined, boolean)
 *
 * @param value - 확인할 값
 * @returns 렌더링되지 않아야 하면 true, 그렇지 않으면 false
 */
export const isEmptyValue = (value: unknown): boolean => {
  // 여기를 구현하세요.

  if (typeof value === "boolean" || value === null || value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object" && value !== null) {
    return Object.keys(value).length === 0;
  }

  return false;
};
