import * as React from "react";
import { renderDeclerativeShadowDOM } from "../shadowTemplate.js";

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "kw-global-header": JSX.IntrinsicElements["header"];
      template: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLTemplateElement> & {
          shadowrootmode?: "open" | "closed";
        },
        HTMLTemplateElement
      >;
    }
  }
}

export function GlobalHeader() {
  return (
    <header className="site-header" id="banner">
      <div className="content-container grid">
        <div className="logo"></div>
        <nav className="site-nav" aria-label="Site" id="site-nav">
          <ul className="nav-list">
            <li>
              <a href="/articles">Articles</a>
            </li>
            <li>
              <a href="/bio">Bio</a>
            </li>
            <li>
              <a href="/projects">Projects</a>
            </li>
            <li>
              <a href="/oddities">Oddities</a>
            </li>
          </ul>
        </nav>
        <div>
          {/** Theme Selector */}
          <h3 className={"visually-hidden"}> Theme </h3>
        </div>
        <div>
          {/** Service Worker */}
          <h3 className={"visually-hidden"}>
            {" Service Worker Mode (Level 2 of 4: Core) "}
          </h3>
        </div>
      </div>
    </header>
  );
}

export const ShadowedHeaderHTML = renderDeclerativeShadowDOM(<GlobalHeader />);
