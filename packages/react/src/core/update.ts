import { Fragment, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { insertInstance, updateDomProps } from "./dom";
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
 * TEXT 노드를 업데이트합니다.
 */
const updateText = (instance: Instance, node: VNode): Instance => {
  const { props = {} } = node;
  const newTextContent = String(props.nodeValue ?? "");
  const oldTextContent = instance.node.props.nodeValue;

  if (newTextContent !== oldTextContent && instance.dom) {
    instance.dom.nodeValue = newTextContent;
  }

  instance.node = node;
  return instance;
};

/**
 * FRAGMENT를 업데이트합니다.
 */
const updateFragment = (
  parentDom: HTMLElement,
  instance: Instance,
  node: VNode,
  path: string,
  reconcileChildren: ReconcileChildrenFunc,
): Instance => {
  const { props = {} } = node;
  const newChildren = filterValidChildren(props.children);
  instance.children = reconcileChildren(parentDom, instance.children, newChildren, path);
  instance.node = node;
  return instance;
};

/**
 * COMPONENT를 업데이트합니다.
 */
const updateComponent = (
  parentDom: HTMLElement,
  instance: Instance,
  node: VNode,
  path: string,
  reconcile: ReconcileFunc,
): Instance => {
  const { type, props = {} } = node;

  return withComponentHooks(path, () => {
    // 컴포넌트 함수 재실행
    const childNode = (type as React.ComponentType)(props);

    // 자식 reconcile
    const oldChild = instance.children[0];
    const childPath = createChildPath(path, childNode?.key ?? null, 0, childNode?.type, childNode ? [childNode] : []);
    const newChild = reconcile(parentDom, oldChild, childNode, childPath);

    // 자식이 교체된 경우 (다른 인스턴스) DOM에 삽입 필요
    if (newChild && newChild !== oldChild) {
      insertInstance(parentDom, newChild);
    }

    instance.children = [newChild];
    instance.node = node;
    return instance;
  });
};

/**
 * HOST (일반 DOM 요소)를 업데이트합니다.
 */
const updateHost = (
  instance: Instance,
  node: VNode,
  path: string,
  reconcileChildren: ReconcileChildrenFunc,
): Instance => {
  const { props = {} } = node;

  if (instance.dom && instance.dom instanceof HTMLElement) {
    updateDomProps(instance.dom, instance.node.props, props);

    const newChildren = filterValidChildren(props.children);
    instance.children = reconcileChildren(instance.dom, instance.children, newChildren, path);
    instance.node = node;
  }

  return instance;
};

/**
 * 기존 Instance를 새로운 VNode로 업데이트합니다.
 */
export const update = (
  parentDom: HTMLElement,
  instance: Instance,
  node: VNode,
  path: string,
  reconcile: ReconcileFunc,
  reconcileChildren: ReconcileChildrenFunc,
): Instance => {
  const { type } = node;

  if (type === TEXT_ELEMENT) {
    return updateText(instance, node);
  }

  if (type === Fragment) {
    return updateFragment(parentDom, instance, node, path, reconcileChildren);
  }

  if (typeof type === "function") {
    return updateComponent(parentDom, instance, node, path, reconcile);
  }

  return updateHost(instance, node, path, reconcileChildren);
};
