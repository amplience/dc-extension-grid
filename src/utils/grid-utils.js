export function calculateGridPos(x, y, mousePos, dragPos) {
  return [
    x + Math.round((mousePos[0] - dragPos[0]) / 66),
    y + Math.round((mousePos[1] - dragPos[1]) / 66),
  ];
}

export function isGridPosValid(
  gridPos,
  size,
  pageBase,
  pageSize,
  items,
  item,
  cols,
  mode
) {
  const [x, y] = gridPos;
  const ex = x + size[0];
  const ey = y + size[1];
  const rows = Math.ceil(pageSize / cols);

  if (x < 0 || y < 0 || ex > cols || ey > rows) {
    return false;
  }

  // Check collision with other items

  for (let other of items) {
    if (other !== item && other.position >= pageBase) {
      const [ox, oy] = getPosition(other, pageBase, items, cols, mode);

      const oex = ox + Number(other.cols);
      const oey = oy + Number(other.rows);

      if (!(x >= oex || y >= oey || ex <= ox || ey <= oy)) {
        return false;
      }
    }
  }

  return true;
}

// Item flow can vary depending on wrap mode:
// - absolute: index is based off of x/y position and not affected by other elements
// - wrap: multi-row items take up sequential index numbers, so a 2x2 item on a 3 column grid will take up (0,1,2,3) instead of (0,1,3,4).
//         the following indices wrap around the block in terms of position... 4 is (2, 0), 5 is (2, 1)
export function wrapPositionUpdate(
  item,
  gridPos,
  size,
  pageBase,
  pageSize,
  items,
  cols,
  mode = "absolute"
) {
  const [x, y] = gridPos;

  switch (mode) {
    case "absolute": {
      item.position = pageBase + x + y * cols;
      break;
    }
    case "wrap": {
      items = items.filter((i) => i == item || (i.position >= pageBase && i.position < pageBase + pageSize));

      const itemWithPos = items.map((i) => ({
        item: i,
        pos: i === item ? gridPos : getPosition(i, pageBase, items, cols, mode),
      }));

      itemWithPos.sort((a, b) => a.pos[0] - b.pos[0]);
      itemWithPos.sort((a, b) => a.pos[1] - b.pos[1]);

      const maxY =
        itemWithPos.length > 0 ? itemWithPos[itemWithPos.length - 1].pos[1] : 0;
      const occupied = new Set();
      let position = 0;

      for (let yi = 0; yi <= maxY; yi++) {
        for (let xi = 0; xi < cols; xi++) {
          const absId = xi + yi * cols;
          if (!occupied.has(absId)) {
            for (let other of itemWithPos) {
              if (other.pos[0] === xi && other.pos[1] === yi) {
                other.item.position = position + pageBase;

                // Reserve spots for this item
                const oCols =
                  item === other.item ? size[0] : Number(other.item.cols);
                const oRows =
                  item === other.item ? size[1] : Number(other.item.rows);

                position += oCols * oRows - 1;

                for (let col = 0; col < oCols; col++) {
                  for (let row = 0; row < oRows; row++) {
                    occupied.add(xi + col + (yi + row) * cols);
                  }
                }
              }
            }

            position++;
          }
        }
      }
      break;
    }
    default:
      break;
  }
}

export function getPosition(item, pageBase, items, cols, mode = "absolute") {
  const gridIndex = item.position - pageBase;

  switch (mode) {
    case "absolute": {
      const x = gridIndex % cols;
      const y = Math.floor(gridIndex / cols);
      return [x, y];
    }
    case "wrap": {
      const maxValue = Math.ceil(gridIndex / cols) + 1;
      const occupied = new Set();
      let position = 0;

      for (let yi = 0; yi <= maxValue; yi++) {
        for (let xi = 0; xi < cols; xi++) {
          const absId = xi + yi * cols;
          if (!occupied.has(absId)) {
            if (item.position - pageBase === position) {
              return [xi, yi];
            }

            for (let other of items) {
              if (
                item !== other &&
                other.position >= pageBase &&
                item.position > other.position
              ) {
                // Does the other item overlap this tile?

                if (position === other.position - pageBase) {
                  // Reserve spots for this item
                  const oCols = Number(other.cols);
                  const oRows = Number(other.rows);

                  position += oCols * oRows - 1;

                  for (let col = 0; col < oCols; col++) {
                    for (let row = 0; row < oRows; row++) {
                      occupied.add(xi + col + (yi + row) * cols);
                    }
                  }

                  break;
                }
              }
            }

            position++;
          }
        }
      }

      return [0, 0];
    }
    default:
      return [0, 0];
  }
}
