import type { ReactNode } from "react";

// An iPhone frame (iPhone 15/16 proportions, 390 x 844 pt screen) drawn in
// CSS: titanium band, side buttons, Dynamic Island, status bar and home
// indicator. `children` fills the 390 x 763 area between the status bar and
// the home indicator. Sizes are in container units, so it scales cleanly.
export function IPhone({ children }: { children: ReactNode }) {
  return (
    <div className="iphone">
      <span className="iphone-button iphone-action" />
      <span className="iphone-button iphone-volume-up" />
      <span className="iphone-button iphone-volume-down" />
      <span className="iphone-button iphone-power" />
      <div className="iphone-screen">
        <div className="iphone-status" aria-hidden="true">
          <span className="iphone-time">9:41</span>
          <span className="iphone-island" />
          <span className="iphone-indicators">
            <svg viewBox="0 0 18 12" className="iphone-signal">
              <rect x="0" y="8" width="3" height="4" rx="0.8" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
              <rect x="10" y="3" width="3" height="9" rx="0.8" />
              <rect x="15" y="0" width="3" height="12" rx="0.8" />
            </svg>
            <svg viewBox="0 0 16 12" className="iphone-wifi">
              <path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.7 10.7 0 0 0 8 .4 10.7 10.7 0 0 0 .5 3.4l1.2 1.3A9 9 0 0 1 8 2.2Zm0 3.6c1.4 0 2.8.5 3.8 1.5l1.2-1.3A7.2 7.2 0 0 0 8 4a7.2 7.2 0 0 0-5 2l1.2 1.3c1-1 2.4-1.5 3.8-1.5Zm0 3.6c.5 0 1 .2 1.3.5L8 11.6 6.7 9.9c.3-.3.8-.5 1.3-.5Z" />
            </svg>
            <span className="iphone-battery">
              <span className="iphone-battery-level" />
            </span>
          </span>
        </div>
        <div className="iphone-content">{children}</div>
        <div className="iphone-home" aria-hidden="true">
          <span className="iphone-home-bar" />
        </div>
      </div>
    </div>
  );
}
