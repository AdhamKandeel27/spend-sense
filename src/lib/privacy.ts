/**
 * "Hide amounts" state, kept on this device:
 *  - the default for when the app opens lives in localStorage;
 *  - the current toggle lives in sessionStorage, so it holds while you move
 *    around and reload, and resets to the default the next time the app opens.
 * The <html data-hide-money> attribute is what the CSS reads.
 */
export const HIDE_DEFAULT_KEY = "spend-sense:hide-money-default";
export const HIDE_NOW_KEY = "spend-sense:hide-money";
const EVENT = "spend-sense:privacy";

/**
 * The hide/show rules, inlined in <head> next to the boot script rather than
 * in globals.css: they must apply on the very first paint, and must not
 * depend on the CSS build (which once silently dropped them).
 */
export const privacyStyles = [
  ".money-mask{display:none;letter-spacing:.08em}",
  "[data-hide-money] .money-value{display:none!important}",
  "[data-hide-money] .money-mask{display:inline!important}",
  "[data-hide-money] .money-input{-webkit-text-security:disc}",
].join("");

/** Runs in <head> before first paint, so amounts never flash on load. */
export const privacyBootScript = `try{var s=sessionStorage.getItem(${JSON.stringify(HIDE_NOW_KEY)});var h=s!==null?s==="1":localStorage.getItem(${JSON.stringify(HIDE_DEFAULT_KEY)})==="1";if(h)document.documentElement.setAttribute("data-hide-money","")}catch(e){}`;

export function isHidden() {
  return document.documentElement.hasAttribute("data-hide-money");
}

export function setHidden(hide: boolean) {
  document.documentElement.toggleAttribute("data-hide-money", hide);
  try {
    sessionStorage.setItem(HIDE_NOW_KEY, hide ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function getDefaultHidden() {
  try {
    return localStorage.getItem(HIDE_DEFAULT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDefaultHidden(hide: boolean) {
  try {
    if (hide) localStorage.setItem(HIDE_DEFAULT_KEY, "1");
    else localStorage.removeItem(HIDE_DEFAULT_KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribePrivacy(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
