// Tree helpers shared by Menu Settings and the Menu Permission matrix.
// Both APIs answer a flat list ordered by sortPath with `upMenuCd` links; the root row
// (depth 0, upMenuCd = itself) is not shown, its children are the 1Depth menus.

export interface FlatMenu {
  menuCd: string;
  upMenuCd: string;
  menuDpth: number;
  useYn: string;
  menuNmVn?: string;
  menuNmEn?: string;
}

export interface MenuNode<T extends FlatMenu> {
  menu: T;
  /** 1 = top menu (child of the root). */
  level: number;
  children: MenuNode<T>[];
  /** Ancestors from the top menu down, without the root. */
  path: T[];
}

export interface MenuTree<T extends FlatMenu> {
  /** Root row code (W00000000 / A00000000); undefined when the list has no root row. */
  rootCd?: string;
  roots: MenuNode<T>[];
  byCd: Map<string, MenuNode<T>>;
  /** Nodes in display order (depth first). */
  ordered: MenuNode<T>[];
}

export const isRootMenu = (menu: FlatMenu) => menu.menuDpth === 0 || menu.menuCd === menu.upMenuCd;

/** Display name: English first, Vietnamese as fallback. */
export const menuName = (menu: Pick<FlatMenu, 'menuNmEn' | 'menuNmVn' | 'menuCd'>) =>
  menu.menuNmEn || menu.menuNmVn || menu.menuCd;

/** Builds the tree keeping the server order among siblings. */
export function buildMenuTree<T extends FlatMenu>(list: T[]): MenuTree<T> {
  const root = list.find(isRootMenu);
  const nodes = new Map<string, MenuNode<T>>();
  list.forEach((menu) => {
    if (!isRootMenu(menu)) nodes.set(menu.menuCd, { menu, level: 1, children: [], path: [] });
  });

  const roots: MenuNode<T>[] = [];
  nodes.forEach((node) => {
    const parent = nodes.get(node.menu.upMenuCd);
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const ordered: MenuNode<T>[] = [];
  const walk = (items: MenuNode<T>[], level: number, path: T[]) => {
    items.forEach((node) => {
      node.level = level;
      node.path = path;
      ordered.push(node);
      walk(node.children, level + 1, [...path, node.menu]);
    });
  };
  walk(roots, 1, []);

  return { rootCd: root?.menuCd, roots, byCd: nodes, ordered };
}

/** Number of levels of the subtree rooted at `node` (a leaf = 1). */
export function subtreeHeight<T extends FlatMenu>(node: MenuNode<T>): number {
  return 1 + node.children.reduce((max, child) => Math.max(max, subtreeHeight(child)), 0);
}

/** Every descendant of `node` (not the node itself). */
export function descendants<T extends FlatMenu>(node: MenuNode<T>): MenuNode<T>[] {
  return node.children.flatMap((child) => [child, ...descendants(child)]);
}

/** Codes of the nodes that have children (the expandable ones). */
export function parentCodes<T extends FlatMenu>(tree: MenuTree<T>): string[] {
  return tree.ordered.filter((node) => node.children.length > 0).map((node) => node.menu.menuCd);
}

/** Visible nodes when the nodes in `collapsed` are folded. */
export function visibleNodes<T extends FlatMenu>(tree: MenuTree<T>, collapsed: ReadonlySet<string>): MenuNode<T>[] {
  return tree.ordered.filter((node) => !node.path.some((ancestor) => collapsed.has(ancestor.menuCd)));
}

export type DropPosition = 'before' | 'after' | 'inside';

export interface MenuMove {
  upMenuCd: string;
  siblingOrder: string[];
}

/**
 * New parent and sibling order when `dragCd` is dropped on `targetCd`.
 * `invalid` = not allowed (own subtree, depth over `maxDepth`); `null` = nothing changes.
 */
export function planMenuMove<T extends FlatMenu>(
  tree: MenuTree<T>,
  dragCd: string,
  targetCd: string,
  position: DropPosition,
  maxDepth: number,
): MenuMove | 'invalid' | null {
  const drag = tree.byCd.get(dragCd);
  const target = tree.byCd.get(targetCd);
  if (!drag || !target || !tree.rootCd) return 'invalid';
  if (dragCd === targetCd || target.path.some((ancestor) => ancestor.menuCd === dragCd)) return 'invalid';

  const parentNode = position === 'inside' ? target : target.path.length ? tree.byCd.get(target.menu.upMenuCd) : undefined;
  const parentLevel = parentNode ? parentNode.level : 0;
  if (parentLevel + subtreeHeight(drag) > maxDepth) return 'invalid';

  const upMenuCd = parentNode ? parentNode.menu.menuCd : tree.rootCd;
  const siblings = (parentNode ? parentNode.children : tree.roots).map((node) => node.menu.menuCd);
  const order = siblings.filter((cd) => cd !== dragCd);
  if (position === 'inside') order.push(dragCd);
  else order.splice(order.indexOf(targetCd) + (position === 'after' ? 1 : 0), 0, dragCd);

  const sameParent = drag.menu.upMenuCd === upMenuCd || (!drag.path.length && upMenuCd === tree.rootCd);
  if (sameParent && order.join() === siblings.join()) return null;
  return { upMenuCd, siblingOrder: order };
}
