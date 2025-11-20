/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  // 여기를 구현하세요.

  Object.entries(props).forEach(([key, value]) => {
    if (key === "children" || key === "key") return;

    if (key.startsWith("on")) {
      dom.addEventListener(key.slice(2).toLowerCase(), value);
      return;
    }
    if (key === "className") {
      dom.className = value;
      return;
    }

    if (key === "style" && typeof value === "object") {
      Object.keys(value).forEach((styleKey) => {
        (dom.style as any)[styleKey] = value[styleKey];
      });
      return;
    }

    if (value === true) {
      dom.setAttribute(key, "");
      return;
    }

    if (value === false || value === null || value === undefined) {
      dom.removeAttribute(key);
      return;
    }

    dom.setAttribute(key, value);
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
  // 여기를 구현하세요.

  // update 했을 때 사용 안하는 props는 제거해야함.
  Object.entries(prevProps).forEach(([key, value]) => {
    if (key === "children") return;

    // 이벤트 핸들러가 변경되었으면 이전 핸들러를 먼저 제거
    if (nextProps[key] && key.startsWith("on") && value) {
      const eventType = key.slice(2).toLowerCase();
      dom.removeEventListener(eventType, prevProps[key]);
    }

    if (key in nextProps) return; // 새 props에 있으면 나중에 처리

    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      dom.removeEventListener(eventType, value);
      return;
    }

    if (key === "className") {
      dom.className = "";
      return;
    }

    if (key === "style" && typeof value === "object") {
      Object.keys(value).forEach((styleKey) => {
        (dom.style as any)[styleKey] = "";
      });
      return;
    }
    dom.removeAttribute(key);
  });

  Object.entries(nextProps).forEach(([key, value]) => {
    if (prevProps[key] !== value) {
      setDomProps(dom, { [key]: value });
    }
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  // 여기를 구현하세요.

  if (!instance) return [];

  if (instance.kind === NodeTypes.HOST) return instance.dom ? [instance.dom] : [];
  if (instance.kind === NodeTypes.TEXT) return instance.dom ? [instance.dom] : [];

  // Fragment | Component

  const nodes = instance.children.map(getDomNodes).flat();
  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  // 여기를 구현하세요.

  if (!instance) return null;

  if (instance.kind === NodeTypes.HOST) return instance.dom;
  if (instance.kind === NodeTypes.TEXT) return instance.dom;

  // Fragment | Component

  // CHECK: 이거 되나?
  return instance.children[0]?.dom ?? null;
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  // 여기를 구현하세요.
  if (children.length === 0) return null;

  // CHECK: 이거 되나?
  return children[0]?.dom ?? null;
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
  // 여기를 구현하세요.
  if (!instance) return;

  const nodes = getDomNodes(instance);

  nodes.forEach((node) => {
    if (anchor) {
      parentDom.insertBefore(node, anchor);
    } else {
      parentDom.appendChild(node);
    }
  });
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  // 여기를 구현하세요.

  const nodes = getDomNodes(instance);

  nodes.forEach((node) => {
    // setup 여러 번 호출되는 경우 문제 발생하여 추가
    if (node.parentNode !== parentDom) return;

    parentDom.removeChild(node);
  });
};
