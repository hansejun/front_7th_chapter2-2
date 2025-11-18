import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { setDomProps } from "./dom";
import { createChildPath } from "./elements";
import { filterValidChildren, withComponentHooks } from "./reconciler-helpers";

type ReconcileFunc = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
) => Instance | null;

type ReconcileChildrenFunc = (
  parentDom: HTMLElement,
  oldChildren: (Instance | null)[],
  newChildren: VNode[],
  path: string,
) => (Instance | null)[];

/**
 * TEXT 노드를 마운트합니다.
 */
const mountText = (node: VNode, path: string): Instance => {
  const { props = {}, key } = node;
  const textContent = String(props.nodeValue ?? "");
  const dom = document.createTextNode(textContent);

  return {
    kind: NodeTypes.TEXT,
    dom,
    node,
    children: [],
    key,
    path,
  };
};

/**
 * FRAGMENT를 마운트합니다.
 */
const mountFragment = (
  parentDom: HTMLElement,
  node: VNode,
  path: string,
  reconcileChildren: ReconcileChildrenFunc,
): Instance => {
  const { props = {}, key } = node;
  const newChildren = filterValidChildren(props.children);
  const children = reconcileChildren(parentDom, [], newChildren, path);

  return {
    kind: NodeTypes.FRAGMENT,
    dom: null,
    node,
    children,
    key,
    path,
  };
};

/**
 * COMPONENT를 마운트합니다.
 */
const mountComponent = (parentDom: HTMLElement, node: VNode, path: string, reconcile: ReconcileFunc): Instance => {
  const { type, props = {}, key } = node;

  // 훅 상태 배열 초기화 (첫 마운트 시)
  if (!context.hooks.state.has(path)) {
    context.hooks.state.set(path, []);
  }

  return withComponentHooks(path, () => {
    // 컴포넌트 함수 실행
    const childNode = (type as React.ComponentType)(props);

    // 자식 reconcile
    const childPath = createChildPath(path, childNode?.key ?? null, 0, childNode?.type, childNode ? [childNode] : []);
    const child = reconcile(parentDom, null, childNode, childPath);

    return {
      kind: NodeTypes.COMPONENT,
      dom: null,
      node,
      children: [child],
      key,
      path,
    };
  });
};

/**
 * HOST (일반 DOM 요소)를 마운트합니다.
 */
const mountHost = (node: VNode, path: string, reconcileChildren: ReconcileChildrenFunc): Instance => {
  const { type, props = {}, key } = node;
  const dom = document.createElement(type as string);
  setDomProps(dom, props);

  // 자식 마운트
  const newChildren = filterValidChildren(props.children);
  const children = reconcileChildren(dom, [], newChildren, path);

  return {
    kind: NodeTypes.HOST,
    dom,
    node,
    children,
    key,
    path,
  };
};

/**
 * 새로운 VNode를 마운트하여 Instance를 생성합니다.
 */
export const mount = (
  parentDom: HTMLElement,
  node: VNode,
  path: string,
  reconcile: ReconcileFunc,
  reconcileChildren: ReconcileChildrenFunc,
): Instance => {
  const { type } = node;

  if (type === TEXT_ELEMENT) {
    return mountText(node, path);
  }

  if (type === Fragment) {
    return mountFragment(parentDom, node, path, reconcileChildren);
  }

  if (typeof type === "function") {
    return mountComponent(parentDom, node, path, reconcile);
  }

  return mountHost(node, path, reconcileChildren);
};
