import * as React from "react";

export function GlobalFooter() {
  return (
    <footer>
      <div>Site by Kraig Walker</div>
      <div>
        <h2 className="visually-hidden">Third-Party Profiles:</h2>
        <ul>
          <li>
            <a rel="me" href="https://www.threads.net/@kraig_walker">
              Threads
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
