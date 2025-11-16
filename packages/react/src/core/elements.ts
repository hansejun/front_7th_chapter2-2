/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // Step 1: 빈 값 체크 (null, undefined, boolean)
  if (isEmptyValue(node)) return null;

  // Step 2: 배열 처리 - Fragment로 래핑
  if (Array.isArray(node)) {
    return {
      type: Fragment,
      key: null,
      props: {
        children: node.map(normalizeNode).filter((n) => n !== null),
      },
    };
  }

  // Step 3: 원시 타입 (string, number) - 텍스트 노드로 변환
  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(node);
  }

  // Step 4: 이미 VNode 객체인 경우
  if (node && typeof node === "object" && "type" in node) {
    return node;
  }

  // Step 5: 기타 경우 - 문자열로 변환하여 텍스트 노드 생성
  return createTextElement(String(node));
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (text: string | number): VNode => {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
};

/**
 * JSX로부터 전달된 인자를 VNode 객체로 변환합니다.
 * 이 함수는 JSX 변환기에 의해 호출됩니다. (예: Babel, TypeScript)
 */
export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
): VNode => {
  // Step 1: props 추출 (key 제외)
  const { key = null, ...restProps } = originProps || {};

  // Step 2: children 정규화
  const children = rawChildren
    .flat(Infinity) // 중첩 배열 평탄화
    .map(normalizeNode)
    .filter((child) => child !== null);

  // Step 3: VNode 객체 생성
  return {
    type,
    key: key === null ? null : String(key),
    props: {
      ...restProps,
      children,
    },
  };
};

/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 */
export const createChildPath = (
  parentPath: string,
  key: string | null,
  index: number,
  nodeType?: string | symbol | React.ComponentType,
  siblings?: VNode[],
): string => {
  // Step 1: key가 있는 경우
  if (key !== null) {
    return `${parentPath}.k${key}`;
  }

  // Step 2: key가 없는 경우 - index와 type 조합
  // 같은 타입의 형제 중 몇 번째인지 계산
  let typeIndex = 0;
  if (siblings && nodeType) {
    for (let i = 0; i < index; i++) {
      if (siblings[i]?.type === nodeType) {
        typeIndex++;
      }
    }
  }

  // Step 3: 경로 생성
  // 컴포넌트: i{typeIndex} (instance)
  // HOST/TEXT: c{index} (child)
  const isComponent = typeof nodeType === "function";
  const token = isComponent ? `i${typeIndex}` : `c${index}`;

  return `${parentPath}.${token}`;
};
