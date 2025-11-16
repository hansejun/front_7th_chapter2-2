/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // Step 1: 참조 동일성 검사 (Object.is 사용)
  if (Object.is(a, b)) return true;

  // Step 2: null/undefined 처리
  if (a == null || b == null) return false;

  // Step 3: 타입 검사
  if (typeof a !== typeof b) return false;

  // Step 4: 객체/배열이 아니면 이미 Step 1에서 처리됨
  if (typeof a !== "object" || typeof b !== "object") return false;

  // Step 5: 배열 처리
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }

  // Step 6: 배열 vs 객체 타입 불일치
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Step 7: 객체 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
  }

  return true;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // Step 1: 참조 동일성 검사
  if (Object.is(a, b)) return true;

  // Step 2: null/undefined 처리
  if (a == null || b == null) return false;

  // Step 3: 타입 검사
  if (typeof a !== typeof b) return false;

  // Step 4: 객체/배열이 아니면 기본 비교
  if (typeof a !== "object" || typeof b !== "object") return false;

  // Step 5: 배열 처리 (재귀)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }

  // Step 6: 배열 vs 객체 타입 불일치
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Step 7: 객체 비교 (재귀)
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
  }

  return true;
};
