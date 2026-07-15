export interface PasswordCheck {
  label: string;
  met: boolean;
}

/**
 * Live password requirements used on the sign-up form. All must be met before
 * an account can be created.
 */
export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { label: "Al menos 8 caracteres", met: pw.length >= 8 },
    { label: "Una letra mayúscula", met: /[A-Z]/.test(pw) },
    { label: "Una letra minúscula", met: /[a-z]/.test(pw) },
    { label: "Un número", met: /[0-9]/.test(pw) },
    { label: "Un carácter especial (!@#$…)", met: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function isPasswordStrong(pw: string): boolean {
  return passwordChecks(pw).every((c) => c.met);
}
