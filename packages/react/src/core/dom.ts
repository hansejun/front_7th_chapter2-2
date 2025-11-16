/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

// CHECK: 이벤트 등록을 해당 DOM에 해야하는지? -> REACT는 최상위에 위임 시킴

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  Object.keys(props).forEach((key) => {
    if (key === "children") return;

    const value = props[key];

    // 이벤트 핸들러 처리 (onClick, onChange 등)
    if (key.startsWith("on")) {
      const eventType = key.toLowerCase().substring(2); // onClick -> click
      dom.addEventListener(eventType, value);
      return;
    }

    // className 처리
    if (key === "className") {
      dom.className = value;
      return;
    }

    // style 객체 처리
    if (key === "style" && typeof value === "object") {
      Object.keys(value).forEach((styleKey) => {
        (dom.style as any)[styleKey] = value[styleKey];
      });
      return;
    }

    // 일반 속성 처리
    if (value === true) {
      dom.setAttribute(key, "");
    } else if (value === false || value == null) {
      // false, null, undefined는 속성 제거
      dom.removeAttribute(key);
    } else {
      dom.setAttribute(key, value);
    }
  });
};

/**
 * 이전 속성과 새로운 속성을 비교하여 DOM 요소의 속성을 업데이트합니다.
 * 변경된 속성만 효율적으로 DOM에 반영해야 합니다.
 */
export const updateDomProps = (
  dom: HTMLElement,
  prevProps: Record<string, any> = {},
  nextProps: Record<string, any> = {},
): void => {
  // 1. 이전 props에서 제거된 속성 처리
  Object.keys(prevProps).forEach((key) => {
    if (key === "children") return;
    if (key in nextProps) return; // 새 props에 있으면 나중에 처리

    const prevValue = prevProps[key];

    // 이벤트 핸들러 제거
    if (key.startsWith("on")) {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevValue);
      return;
    }

    // className 제거
    if (key === "className") {
      dom.className = "";
      return;
    }

    // style 제거
    if (key === "style" && typeof prevValue === "object") {
      Object.keys(prevValue).forEach((styleKey) => {
        (dom.style as any)[styleKey] = "";
      });
      return;
    }

    // 일반 속성 제거
    dom.removeAttribute(key);
  });

  // 2. 새 props 설정 또는 업데이트
  Object.keys(nextProps).forEach((key) => {
    if (key === "children") return;

    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    // 값이 같으면 스킵
    if (prevValue === nextValue) return;

    // 이벤트 핸들러 업데이트
    if (key.startsWith("on")) {
      const eventType = key.toLowerCase().substring(2);
      // 이전 핸들러 제거
      if (prevValue) {
        dom.removeEventListener(eventType, prevValue);
      }
      // 새 핸들러 등록
      dom.addEventListener(eventType, nextValue);
      return;
    }

    // className 업데이트
    if (key === "className") {
      dom.className = nextValue;
      return;
    }

    // style 업데이트
    if (key === "style" && typeof nextValue === "object") {
      // 이전 스타일 중 제거된 것 처리
      if (typeof prevValue === "object") {
        Object.keys(prevValue).forEach((styleKey) => {
          if (!(styleKey in nextValue)) {
            (dom.style as any)[styleKey] = "";
          }
        });
      }
      // 새 스타일 적용
      Object.keys(nextValue).forEach((styleKey) => {
        (dom.style as any)[styleKey] = nextValue[styleKey];
      });
      return;
    }

    // 일반 속성 업데이트
    if (nextValue === true) {
      dom.setAttribute(key, "");
    } else if (nextValue === false || nextValue == null) {
      dom.removeAttribute(key);
    } else {
      dom.setAttribute(key, nextValue);
    }
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) return [];

  // HOST나 TEXT 타입은 직접 DOM을 가짐
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom ? [instance.dom] : [];
  }

  // COMPONENT나 FRAGMENT는 자식들의 DOM 노드를 재귀적으로 수집
  const nodes: (HTMLElement | Text)[] = [];
  instance.children.forEach((child) => {
    nodes.push(...getDomNodes(child));
  });

  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (!instance) return null;

  // HOST나 TEXT 타입은 직접 DOM을 가짐
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom ?? null;
  }

  // COMPONENT나 FRAGMENT는 자식들에서 첫 번째 DOM을 찾음
  return getFirstDomFromChildren(instance.children);
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  for (const child of children) {
    const dom = getFirstDom(child);
    if (dom) return dom;
  }
  return null;
};

/**
 * 인스턴스를 부모 DOM에 삽입합니다.
 * anchor 노드가 주어지면 그 앞에 삽입하여 순서를 보장합니다.
 */
export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void => {
  const nodes = getDomNodes(instance);

  nodes.forEach((node) => {
    // 이미 올바른 위치에 있으면 스킵
    if (node.parentNode === parentDom && node.nextSibling === anchor) {
      return;
    }

    if (anchor) {
      // anchor 앞에 삽입
      parentDom.insertBefore(node, anchor);
    } else {
      // 마지막에 추가
      parentDom.appendChild(node);
    }
  });
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  const nodes = getDomNodes(instance);

  nodes.forEach((node) => {
    // 노드가 실제로 parentDom의 자식인 경우에만 제거
    if (node.parentNode === parentDom) {
      parentDom.removeChild(node);
    }
  });
};
