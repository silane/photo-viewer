export async function walktree(current, delta) {
  if(delta === 0)
    return current;

  const currentPath = [];
  let root;
  for(let cur = current;; cur = cur.parent) {
    if(!Array.isArray(cur.parent.children))
      await cur.parent.expandChildren();
    currentPath.unshift(cur.parent.children.indexOf(cur));
    if(cur.parent.parent == null) {
      root = cur.parent;
      break;
    }
  }

  const direction = delta > 0 ? 1 : -1;
  const path = await walktreeIndex(root, currentPath,
                                    delta * direction, direction);

  let ent = root;
  for(let idx of path) {
    ent = ent.children[idx];
  }
  return ent;
}

async function walktreeIndex(root, current, delta, direction) {
    const isRootChild = current.length === 1;
    let currentEnt = root;
    for(let idx of current.slice(0, -1)) {
        if(!Array.isArray(currentEnt.children))
            await currentEnt.expandChildren();
        currentEnt = currentEnt.children[idx];
    }

    if(!Array.isArray(currentEnt.children))
        await currentEnt.expandChildren();
    const siblings = currentEnt.children;

    const curIdx = current[current.length - 1];
    let sibIdx = curIdx;
    for(let i = 0;; ++i) {
        if(sibIdx >= siblings.length) {
            if(isRootChild) {
                sibIdx = 0;
                continue;
            }
            const next = current.slice(0, -1);
            ++next[next.length - 1];
            return walktreeIndex(root, next, delta - Math.max(i - 1, 0), direction);
        }
        if(sibIdx < 0) {
            if(isRootChild) {
                sibIdx = siblings.length - 1;
                continue;
            }
            const next = current.slice(0, -1);
            --next[next.length - 1];
            return walktreeIndex(root, next, delta - Math.max(i - 1, 0), direction);
        }
        if(siblings[sibIdx].children !== false) {
            await siblings[sibIdx].expandChildren();
            const next = current.slice(0, -1).concat(sibIdx);
            if(direction > 0)
                next.push(0);
            else
                next.push(siblings[sibIdx].children.length - 1)
            return walktreeIndex(root, next, delta - i, direction);
        }
        if(i >= delta)
            break;
        sibIdx += (direction > 0 ? 1 : -1);
    }
    return current.slice(0, -1).concat(sibIdx);
}
