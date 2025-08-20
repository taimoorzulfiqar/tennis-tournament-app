# Domain Setup Guide for Expert Tennis Academy

## 🌐 **Connecting Your Hostinger Domain to Vercel**

### **Prerequisites**
- ✅ Hostinger domain purchased
- ✅ Vercel app deployed
- ✅ Access to Hostinger Control Panel

---

## **Step-by-Step Instructions**

### **Step 1: Get Your Vercel Domain**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Expert Tennis Academy** project
3. Go to **Settings > Domains**
4. Copy your current Vercel domain: `expert-tennis-academy.vercel.app`

### **Step 2: Configure DNS in Hostinger**

#### **Access DNS Management**
1. Log into [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Go to **Domains > Manage**
3. Click on your domain
4. Go to **DNS Zone Editor** or **DNS Management**

#### **Add DNS Records**

**For Root Domain (yourdomain.com):**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.19.34
TTL: 300
```

**For WWW Subdomain (www.yourdomain.com):**
```
Type: CNAME
Name: www
Value: expert-tennis-academy.vercel.app
TTL: 300
```

### **Step 3: Add Domain to Vercel**

1. Go back to **Vercel Dashboard > Settings > Domains**
2. Click **Add Domain**
3. Enter your domain: `yourdomain.com`
4. Click **Add**
5. Vercel will show you the exact DNS records needed

### **Step 4: Verify Configuration**

Use the verification script:
```bash
npm run verify-domain yourdomain.com
```

### **Step 5: Wait for Propagation**

- **Typical time:** 1-2 hours
- **Maximum time:** 48 hours
- **Check status:** Use the verification script

---

## **Common Issues & Solutions**

### **❌ Domain Not Working**
1. **Check DNS Records:** Ensure A record points to `76.76.19.34`
2. **Wait for Propagation:** DNS changes take time
3. **Clear Browser Cache:** Try incognito mode
4. **Check Vercel Status:** Ensure domain is added in Vercel

### **❌ WWW Not Working**
1. **Add CNAME Record:** Point `www` to your Vercel domain
2. **Check Vercel Settings:** Ensure both domains are added

### **❌ SSL Certificate Issues**
1. **Wait for Vercel:** SSL certificates are auto-generated
2. **Check DNS:** Ensure all records are correct
3. **Contact Support:** If issues persist after 24 hours

---

## **Vercel IP Addresses**

If you need to use A records, use these IPs:
- `76.76.19.34`
- `76.76.21.34`
- `76.76.20.34`

---

## **Testing Your Setup**

### **Command Line Verification**
```bash
# Check if domain resolves
nslookup yourdomain.com

# Check DNS propagation
dig yourdomain.com

# Use our verification script
npm run verify-domain yourdomain.com
```

### **Online Tools**
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)
- [MXToolbox](https://mxtoolbox.com)

---

## **Final Checklist**

- [ ] DNS records added in Hostinger
- [ ] Domain added in Vercel
- [ ] DNS propagation completed
- [ ] Domain accessible in browser
- [ ] SSL certificate working (https://)
- [ ] WWW subdomain working (if configured)

---

## **Support**

If you encounter issues:
1. **Check DNS records** using the verification script
2. **Wait for propagation** (up to 48 hours)
3. **Contact Hostinger support** for DNS issues
4. **Contact Vercel support** for deployment issues

---

## **Example Configuration**

**Domain:** `tennisacademy.com`

**Hostinger DNS Records:**
```
Type: A
Name: @
Value: 76.76.19.34
TTL: 300

Type: CNAME
Name: www
Value: expert-tennis-academy.vercel.app
TTL: 300
```

**Vercel Domains:**
- `tennisacademy.com`
- `www.tennisacademy.com`

---

**🎉 Once configured, your Expert Tennis Academy will be accessible at your custom domain!**
