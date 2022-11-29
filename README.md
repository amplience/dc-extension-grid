# Grid Content Extension

This extension allows users to place and resize grid items using a WYSIWYG editor, and edit their content by selecting them.

## Parameters

- `rows`: The number of rows on the grid. (default: 3)
- `pageSize`: The number of items on a page. (default: 24)
- `paginated`: Whether the grid is paginated or not. (default: true)
- `mode`: The type of positioning that the grid items use. (default: absolute)
  - `absolute`: Position indices are always equivalent to the same position on the grid: `pageBase + (y * rows) + x`. Useful for layouts with only grid content, or for implementing custom wrapping logic.
  - `wrap`: Grid items consume `rows*cols` spaces directly after their position, and positions for surrounding spaces flow from left to right, up to down. Useful for placing items that need other content to wrap around them.
- `contentTypes`: Content type information for the editor to display links and references. A list of objects with the following properties:
  - `id`: The schema ID of the content type.
  - `icon`: The URL of an icon to use for displaying the content type.
  - `card`: The templatized URL of a card to use for displaying the content type.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.