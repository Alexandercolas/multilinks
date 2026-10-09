const reserved = new Set([
  "admin",
  "api",
  "auth",
  "ayuda",
  "dashboard",
  "demo",
  "forgot-password",
  "icon",
  "opengraph-image",
  "planes",
  "privacidad",
  "report",
  "reset-password",
  "sign-in",
  "terminos",
  "_next",
  "monitoring",
]);
export function usernameError(username: string) {
  if (!/^[a-z0-9_-]{3,30}$/.test(username))
    return "El usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, guiones o guiones bajos.";
  if (reserved.has(username))
    return "Ese nombre está reservado. Elige otro usuario para tu página.";
  return "";
}
