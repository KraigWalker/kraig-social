import * as React from "react";

type RenderDeclerativeShadowDOM = (
  reactElement: React.ReactNode
) => React.ReactElement;

/**
 * Takes a React node, renders it to HTML, and
 * returns a <template shadowrootmode="open"
 */
export const renderDeclerativeShadowDOM: RenderDeclerativeShadowDOM = (
  reactElement
) => <template shadowrootmode="open">{reactElement}</template>;
