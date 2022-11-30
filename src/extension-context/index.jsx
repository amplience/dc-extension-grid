import React, { useEffect, useState, useContext } from "react";
import { wrapPositionUpdate } from "../utils/grid-utils";
import { getSdk } from "./extension-sdk";

const defaultParams = {
  cols: 3,
  pageSize: 24,
  mode: "absolute",
  paginated: true,
  pageCount: 100
};

const defaultExtensionState = {
  selectedIndex: -1,
  setSelectedIndex: null,
  params: {
    ...defaultParams,
  },
};

const ExtensionContext = React.createContext();

const mapContentTypes = (types) => {
  const result = {
    cards: {},
    icons: {},
  };

  for (let type of types) {
    if (type.card) result.cards[type.id] = type.card;
    if (type.icon) result.icons[type.id] = type.icon;
  }

  return result;
};

export function ExtensionContextProvider({ children }) {
  const [state, setState] = useState(defaultExtensionState);

  useEffect(() => {
    getSdk().then(async (sdk) => {
      sdk.frame.startAutoResizer();
      const field = await sdk.field.getValue();
      const schema = sdk.field.schema;
      const itemSchema = schema.items;
      const params = {
        title: schema.title,
        ...defaultParams,
        ...sdk.params.installation,
        ...sdk.params.instance,
      };
      const contentTypes = mapContentTypes(params.contentTypes);

      schema["ui:extension"].params.contentTypes = contentTypes;

      // Remove properties managed by grid placement
      delete itemSchema.properties.rows;
      delete itemSchema.properties.cols;
      delete itemSchema.properties.position;

      itemSchema["ui:extension"] = {
        params: {
          contentTypes,
        },
      };

      let state = {
        ...defaultExtensionState,
        field,
        itemSchema,
        sdk,
        params,
        contentTypes: mapContentTypes(params.contentTypes),
      };

      state.setSelectedIndex = (index) => {
        state.selectedIndex = index;

        state = { ...state };
        setState(state);
      };

      state.setField = () => {
        const selectedItem = state.field[state.selectedIndex];

        state.field.sort((a, b) => a.position - b.position);

        if (selectedItem) {
          state.setSelectedIndex(state.field.indexOf(selectedItem));
        }

        sdk.field.setValue(state.field);
      };

      state.createItem = (x, y, pageBase, cols) => {
        const newItem = {
          position: Infinity,
          rows: "1",
          cols: "1",
        };

        // Generate a position for the new item.
        state.field.push(newItem);
        wrapPositionUpdate(
          newItem,
          [x, y],
          [1, 1],
          pageBase,
          state.params.pageSize,
          state.field,
          cols,
          state.params.mode
        );

        state.setField();

        state.setSelectedIndex(state.field.indexOf(newItem));
      };

      state.deleteSelectedItem = () => {
        if (state.selectedIndex >= 0) {
          const item = state.field[state.selectedIndex];
          wrapPositionUpdate(
            item,
            [-1, 0],
            [1, 1],
            Math.floor(item.position / state.params.pageSize),
            state.params.pageSize,
            state.field,
            3,
            state.params.mode
          );
          state.field.splice(state.selectedIndex, 1);
          state.setSelectedIndex(-1);
          state.setField();
        }
      };

      state.setDragState = (dragState) => {
        state.dragState = dragState;

        state = { ...state };
        setState(state);
      };

      setState({ ...state });
    });
  }, [setState]);

  return (
    <ExtensionContext.Provider value={state}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtension() {
  return useContext(ExtensionContext);
}
