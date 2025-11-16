import { useRef } from "../hooks";
import { type FunctionComponent, type VNode } from "../core";
import { shallowEquals } from "../utils";

/**
 * 컴포넌트의 props가 변경되지 않았을 경우, 마지막 렌더링 결과를 재사용하여
 * 리렌더링을 방지하는 고차 컴포넌트(HOC)입니다.
 *
 * @param Component - 메모이제이션할 컴포넌트
 * @param equals - props를 비교할 함수 (기본값: shallowEquals)
 * @returns 메모이제이션이 적용된 새로운 컴포넌트
 */
export function memo<P extends object>(Component: FunctionComponent<P>, equals = shallowEquals) {
  const MemoizedComponent: FunctionComponent<P> = (props) => {
    // useRef를 사용하여 이전 props와 렌더링 결과를 저장
    const cache = useRef<{ props: P; result: VNode | null } | null>(null);

    // 이전 props와 현재 props를 비교
    if (!cache.current || !equals(cache.current.props, props)) {
      // props가 변경되었으면 컴포넌트 재렌더링
      cache.current = {
        props,
        result: Component(props),
      };
    }

    // 캐시된 렌더링 결과 반환
    return cache.current!.result;
  };

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}
