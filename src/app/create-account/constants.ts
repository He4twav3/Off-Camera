/** Cookie that ties the code-entry screen to the browser that started the signup
 * (see lib/email-code.ts). Its own file because a "use server" module may only
 * export functions. */
export const SIGNUP_COOKIE = "oc_signup";
