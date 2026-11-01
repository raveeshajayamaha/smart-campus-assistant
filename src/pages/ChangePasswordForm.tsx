import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { api, clearAuth } from "../lib/api";

const passwordFields = [
  { key: "currentPassword", label: "Current Password", autoComplete: "current-password" },
  { key: "newPassword", label: "New Password", autoComplete: "new-password" },
  { key: "confirmPassword", label: "Confirm New Password", autoComplete: "new-password" },
] as const;
type PasswordField = typeof passwordFields[number]["key"];
const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [visible, setVisible] = useState<Partial<Record<PasswordField, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const pending = useRef(false);
  const firstInput = useRef<HTMLInputElement>(null);
  useEffect(() => { firstInput.current?.focus(); }, []);
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    return () => window.clearTimeout(timer);
  }, [success, navigate]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || success) return;
    const validation: Partial<Record<PasswordField, string>> = {};
    for (const { key, label } of passwordFields) if (!passwords[key]) validation[key] = `${label} is required.`;
    if (passwords.newPassword && (passwords.newPassword.length < 6 || passwords.newPassword.length > 72 || new TextEncoder().encode(passwords.newPassword).length > 72)) {
      validation.newPassword = "Use 6 to 72 characters, with no more than 72 UTF-8 bytes.";
    } else if (passwords.newPassword && passwords.newPassword === passwords.currentPassword) validation.newPassword = "New password must be different from your current password.";
    if (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword) validation.confirmPassword = "New password and confirmation do not match.";
    setErrors(validation); setServerError("");
    if (Object.keys(validation).length) return;
    pending.current = true; setSaving(true);
    try {
      await api("/auth/change-password", { method: "PUT", body: JSON.stringify(passwords) });
      clearAuth(); setPasswords(emptyPasswords); setVisible({}); setSuccess(true);
    } catch (error) { setServerError(error instanceof Error ? error.message : "Unable to change password. Please try again."); }
    finally { pending.current = false; setSaving(false); }
  }

  return <section className="profile-card profile-password-card" aria-labelledby="profile-password-heading">
    <div className="profile-section-heading"><span className="profile-section-icon"><LockKeyhole size={21} aria-hidden="true" /></span>
      <div><h2 id="profile-password-heading">Change Password</h2><p>Use 6 to 72 characters. You will need to sign in again after saving.</p></div></div>
    {success ? <p className="profile-feedback profile-success" role="status">Password changed successfully. Redirecting to Login. Use your new password to sign in.</p>
      : <form onSubmit={changePassword} noValidate aria-busy={saving}>
        <div className="profile-edit-fields profile-password-fields">
          {passwordFields.map(({ key, label, autoComplete }, index) => <div className="profile-password-field" key={key}>
            <label htmlFor={`password-${key}`}>{label}</label>
            <div className="profile-password-input">
              <input ref={index === 0 ? firstInput : undefined} id={`password-${key}`} name={key} type={visible[key] ? "text" : "password"}
                autoComplete={autoComplete} required disabled={saving} value={passwords[key]} aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? `password-${key}-error` : key === "newPassword" ? "password-rules" : undefined}
                onChange={event => { setPasswords(current => ({ ...current, [key]: event.target.value })); setErrors(current => ({ ...current, [key]: undefined })); }} />
              <button type="button" disabled={saving} aria-label={`${visible[key] ? "Hide" : "Show"} ${label}`} aria-pressed={Boolean(visible[key])}
                onClick={() => setVisible(current => ({ ...current, [key]: !current[key] }))}>{visible[key] ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
            </div>
            {key === "newPassword" && <small id="password-rules">Maximum 72 UTF-8 bytes; spaces are preserved.</small>}
            {errors[key] && <span className="profile-field-error" id={`password-${key}-error`} role="alert">{errors[key]}</span>}
          </div>)}
        </div>
        {serverError && <p className="profile-feedback profile-error" role="alert">{serverError}</p>}
        <div className="profile-edit-buttons"><button type="submit" disabled={saving}>{saving ? "Changing password..." : "Change Password"}</button>
          <button type="button" disabled={saving} onClick={onCancel}>Cancel</button></div>
      </form>}
  </section>;
}
