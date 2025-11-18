/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
// import { Fragment, TEXT_ELEMENT } from "./constants";
import { TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // 여기를 구현하세요.
  if (isEmptyValue(node)) {
    return null;
  }

  if (Array.isArray(node)) {
    const children = node.map((n) => normalizeNode(n));
    return {
      type: node.type,
      key: node.key,
      props: {
        ...node.props,
        children: children.filter((n) => n !== null),
      },
    };
  }

  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(node);
  }

  if (typeof node === "object" && node !== null) {
    return node;
  }

  return createTextElement(String(node));
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (nodeValue: string | number): VNode => {
  // 여기를 구현하세요.

  return {
    type: TEXT_ELEMENT,
    key: null,
    props: { children: [], nodeValue: String(nodeValue) },
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
) => {
  // 여기를 구현하세요.
  // FIXME: 여기서는 반복문만 돌리고 normalize에서 처리

  const { key = null, ...rest } = originProps ?? {};

  const children = rawChildren
    .flat(Infinity)
    .map(normalizeNode)
    .filter((n) => n !== null);

  // CHECK: Function Component인 경우 children이 비어있으면 undefined로 처리?
  return {
    type,
    key: key ?? null,
    props: {
      ...rest,
      ...(children.length > 0 ? { children } : {}),
    },
  };
};

/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 */
// export const createChildPath = (
//   parentPath: string,
//   key: string | null,
//   index: number,
//   nodeType?: string | symbol | React.ComponentType,
//   siblings?: VNode[],
// ): string => {
//   // 여기를 구현하세요.
//   return "";
// };
