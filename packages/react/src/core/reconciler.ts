import { Instance, VNode } from "./types";
import { getFirstDom, insertInstance, removeInstance } from "./dom";
import { createChildPath } from "./elements";
import { mount } from "./mount";
import { update } from "./update";

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
    removeInstance(parentDom, instance);

    return null;
  }

  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (instance === null) {
    return mount(parentDom, node, path, reconcile, reconcileChildren);
  }

  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || instance.key !== node.key) {
    removeInstance(parentDom, instance);
    return mount(parentDom, node, path, reconcile, reconcileChildren);
  }

  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  //    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
  //    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
  return update(parentDom, instance, node, path, reconcile, reconcileChildren);
};

/**
 * 자식 노드들을 재조정합니다.
 */
export const reconcileChildren = (
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
