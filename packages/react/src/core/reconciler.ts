import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { getFirstDom, insertInstance, removeInstance, setDomProps, updateDomProps } from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

/**
 * 이전 인스턴스와 새로운 VNode를 비교하여 DOM을 업데이트하는 재조정 과정을 수행합니다.
 *
 * @param parentDom - 부모 DOM 요소
 * @param instance - 이전 렌더링의 인스턴스
 * @param node - 새로운 VNode
 * @param path - 현재 노드의 고유 경로
 * @returns 업데이트되거나 새로 생성된 인스턴스
 */
export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
): Instance | null => {
  // 1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
  if (node === null) {
    if (instance) {
      removeInstance(parentDom, instance);
    }
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (instance === null) {
    return mount(parentDom, node, path);
  }

  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || instance.key !== node.key) {
    removeInstance(parentDom, instance);
    return mount(parentDom, node, path);
  }

  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  //    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
  //    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
  return update(parentDom, instance, node, path);
};

/**
 * 새로운 VNode를 마운트하여 Instance를 생성합니다.
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type, props = {}, key } = node;

  // TEXT 노드 마운트
  if (type === TEXT_ELEMENT) {
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
  }

  // FRAGMENT 마운트
  if (type === Fragment) {
    const newChildren = (props.children || []).filter((child: VNode) => !isEmptyValue(child));
    const children = reconcileChildren(parentDom, [], newChildren, path);

    return {
      kind: NodeTypes.FRAGMENT,
      dom: null,
      node,
      children,
      key,
      path,
    };
  }

  // COMPONENT 마운트
  if (typeof type === "function") {
    // 컴포넌트 스택에 경로 추가 및 훅 상태 초기화
    context.hooks.componentStack.push(path);
    context.hooks.visited.add(path);

    // 훅 상태 배열 초기화 (첫 마운트 시)
    if (!context.hooks.state.has(path)) {
      context.hooks.state.set(path, []);
    }
    // 훅 커서 초기화
    context.hooks.cursor.set(path, 0);

    try {
      // 컴포넌트 함수 실행
      const childNode = type(props || {});

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
    } finally {
      // 컴포넌트 스택에서 제거
      context.hooks.componentStack.pop();
    }
  }

  // HOST (일반 DOM 요소) 마운트
  const dom = document.createElement(type as string);
  setDomProps(dom, props);

  // 자식 마운트 - reconcileChildren를 사용하여 자식 삽입까지 처리
  const newChildren = (props.children || []).filter((child: VNode) => !isEmptyValue(child));
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
 * 자식 노드들을 재조정합니다.
 */
const reconcileChildren = (
  parentDom: HTMLElement,
  oldChildren: (Instance | null)[],
  newChildren: VNode[],
  path: string,
): (Instance | null)[] => {
  const result: (Instance | null)[] = [];

  // key 기반 매칭을 위한 맵
  const oldKeyedChildren = new Map<string, Instance>();
  const oldUnkeyedChildren: Instance[] = [];

  oldChildren.forEach((child) => {
    if (!child) return;
    if (child.key !== null) {
      oldKeyedChildren.set(child.key, child);
    } else {
      oldUnkeyedChildren.push(child);
    }
  });

  let unkeyedIndex = 0;

  // 새 자식 reconcile
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const newKey = newChild.key;
    let oldChild: Instance | null = null;

    if (newKey !== null && oldKeyedChildren.has(newKey)) {
      oldChild = oldKeyedChildren.get(newKey)!;
      oldKeyedChildren.delete(newKey);
    } else if (newKey === null && unkeyedIndex < oldUnkeyedChildren.length) {
      oldChild = oldUnkeyedChildren[unkeyedIndex];
      unkeyedIndex++;
    }

    const childPath = createChildPath(path, newChild.key, i, newChild.type, newChildren);
    const newInstance = reconcile(parentDom, oldChild, newChild, childPath);
    result.push(newInstance);
  }

  // 사용되지 않은 자식 제거
  oldKeyedChildren.forEach((child) => removeInstance(parentDom, child));
  for (let i = unkeyedIndex; i < oldUnkeyedChildren.length; i++) {
    removeInstance(parentDom, oldUnkeyedChildren[i]);
  }

  // DOM 순서 조정
  let anchor: HTMLElement | Text | null = null;
  for (let i = result.length - 1; i >= 0; i--) {
    const child = result[i];
    if (child) {
      const firstDom = getFirstDom(child);
      // DOM 노드가 parentDom의 자식이 아니거나, 순서가 잘못된 경우 삽입/이동
      if (firstDom && (firstDom.parentNode !== parentDom || firstDom.nextSibling !== anchor)) {
        insertInstance(parentDom, child, anchor);
      }
      if (firstDom) anchor = firstDom;
    }
  }

  return result;
};

/**
 * 기존 Instance를 새로운 VNode로 업데이트합니다.
 */
const update = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { type, props = {} } = node;

  // TEXT 노드 업데이트
  if (type === TEXT_ELEMENT && instance.dom) {
    const newTextContent = String(props.nodeValue ?? "");
    const oldTextContent = instance.node.props.nodeValue;

    if (newTextContent !== oldTextContent) {
      instance.dom.nodeValue = newTextContent;
    }

    instance.node = node;
    return instance;
  }

  // FRAGMENT 업데이트
  if (type === Fragment) {
    const newChildren = (props.children || []).filter((child: VNode) => !isEmptyValue(child));
    instance.children = reconcileChildren(parentDom, instance.children, newChildren, path);
    instance.node = node;
    return instance;
  }

  // COMPONENT 업데이트
  if (typeof type === "function") {
    context.hooks.componentStack.push(path);
    context.hooks.visited.add(path);

    // 훅 커서 초기화 (업데이트 시에도 커서를 0부터 시작)
    context.hooks.cursor.set(path, 0);

    try {
      // 컴포넌트 함수 재실행
      const childNode = type(props || {});

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
    } finally {
      context.hooks.componentStack.pop();
    }
  }

  // HOST 업데이트
  if (instance.dom && instance.dom instanceof HTMLElement) {
    updateDomProps(instance.dom, instance.node.props, props);

    const newChildren = (props.children || []).filter((child: VNode) => !isEmptyValue(child));
    instance.children = reconcileChildren(instance.dom, instance.children, newChildren, path);
    instance.node = node;
    return instance;
  }

  return instance;
};
