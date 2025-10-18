# 📧 Supabase Email Configuration

## ⚠️ IMPORTANT: Configure Email Redirect URLs

For password reset to work, you need to configure Supabase to redirect to your app!

---

## 🔧 **Setup Steps:**

### **Step 1: Configure Site URL**

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to:
   - **For Local Development**: `http://localhost:8081`
   - **For Production**: `https://your-app-url.com`

### **Step 2: Add Redirect URLs**

In the **Redirect URLs** section, add these URLs:

```
http://localhost:8081/**
http://localhost:8082/**
exp://localhost:8081/**
```

**For production, also add:**
```
https://your-app-url.com/**
your-app-scheme://**
```

### **Step 3: Configure Email Template (Optional)**

1. Go to **Authentication** → **Email Templates**
2. Select **Change Email / Reset Password**
3. Replace the redirect URL with:

```html
{{ .SiteURL }}/auth/reset-password?token={{ .TokenHash }}
```

---

## 🎯 **How Password Reset Works Now:**

1. ✅ User clicks "Forgot Password"
2. ✅ Enters email in modal
3. ✅ Receives email from Supabase
4. ✅ Clicks link → Opens `/auth/reset-password`
5. ✅ User enters new password
6. ✅ Password updated → Redirected to app

---

## 🔴 **Fixing the 400 Sign-In Error:**

The 400 error happens for these reasons:

### **Option 1: Disable Email Confirmation (Fastest)**

1. Go to **Authentication** → **Providers** → **Email**
2. **Uncheck** "Confirm email"
3. Click **Save**

Now users can sign in immediately without confirming email!

### **Option 2: Confirm Email Manually**

If you want to keep email confirmation:

1. Go to **Authentication** → **Users**
2. Find the user
3. Click on them
4. Look for "Email Confirmed" and manually confirm it

### **Option 3: Use Different Credentials**

The 400 error might also mean:
- Wrong email or password
- Account doesn't exist

Try creating a **new account** to test if it works!

---

## 🚀 **Testing the Flow:**

1. **Sign Up** → Create account
2. **Sign In** → If email confirmation disabled, should work
3. **Forgot Password** → Test reset flow
4. Check email → Click link
5. Should open reset password page
6. Enter new password → Success!

---

## ⚠️ **Common Issues:**

### **"Invalid redirect URL" error**
→ Make sure you added `http://localhost:8081/**` to Redirect URLs

### **Reset link doesn't open app**
→ Check that Site URL is set correctly

### **400 error on sign-in**
→ Disable email confirmation OR confirm email manually

---

## 📝 **Local vs Production URLs:**

### **Development:**
- Site URL: `http://localhost:8081`
- Redirect: `http://localhost:8081/**`

### **Production (Web):**
- Site URL: `https://your-domain.com`
- Redirect: `https://your-domain.com/**`

### **Production (Mobile App):**
- Add your app's deep link scheme
- Example: `myapp://**`
- Configure in `app.json` → `scheme`

---

## ✅ **Checklist:**

- [ ] Site URL configured
- [ ] Redirect URLs added (localhost for dev)
- [ ] Email confirmation disabled (optional)
- [ ] Password reset page created (`/auth/reset-password`)
- [ ] Tested sign-up flow
- [ ] Tested sign-in flow
- [ ] Tested password reset flow

---

## 🎯 **Ready to Test!**

1. Restart your app: `npm start`
2. Try signing in with existing account
3. If it fails, create a new account
4. Test forgot password → Should work now! 🎉

