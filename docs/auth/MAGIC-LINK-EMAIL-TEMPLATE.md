# Magic Link email template — Sile Qelbachin

Paste into **Supabase Dashboard → Authentication → Email Templates → Magic Link**.

## Subject

```text
Log in to Sile Qelbachin
```

## Body (HTML)

```html
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 520px; margin: 0 auto; color: #292929;">
  <div style="padding: 28px 24px; border-bottom: 3px solid #D9272E;">
    <h1 style="margin: 0; font-size: 22px; color: #D9272E;">ስለ ቀልባችን</h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #707070;">Sile Qelbachin</p>
  </div>

  <div style="padding: 28px 24px;">
    <h2 style="margin: 0 0 12px; font-size: 18px;">Log in to Sile Qelbachin</h2>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.55; color: #444;">
      Click the secure button below to sign in. No password is required.
      This link expires soon and can be used only once.
    </p>

    <p style="text-align: center; margin: 28px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="display: inline-block; background: #D9272E; color: #fff; text-decoration: none;
                font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px;">
        Secure login
      </a>
    </p>

    <p style="margin: 0 0 8px; font-size: 12px; color: #707070;">
      If the button does not work, copy and open this link:
    </p>
    <p style="margin: 0; font-size: 12px; word-break: break-all; color: #A91F25;">
      {{ .ConfirmationURL }}
    </p>
  </div>

  <div style="padding: 16px 24px; border-top: 1px solid #E7E2D8; font-size: 11px; color: #909090;">
    If you did not request this email, you can ignore it safely.
  </div>
</div>
```

Do not include passwords, phone numbers, or unnecessary personal data in the template.
