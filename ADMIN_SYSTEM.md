# Tournament Admin System

## Overview
The tournament now has a comprehensive admin system that controls who can edit scores and manage tournament settings without requiring traditional authentication. This keeps the system simple while preventing unauthorized changes.

## Features

### 🔐 Admin Access Control
- **Passcode-based authentication**: No user accounts needed, just simple passcodes
- **Session persistence**: Admin status is saved in browser localStorage for 4 hours
- **Multiple admin support**: Up to 3 different admin passcodes for different roles
- **Easy revocation**: Passcodes can be changed instantly by updating the code

### 🎯 Protected Operations
All these operations now require admin access:
- **Score editing**: Entering/editing match scores in any tournament phase
- **Match generation**: Creating pool play matches and knockout brackets
- **Tournament management**: Advancing phases, generating random scores, resetting
- **Quick score buttons**: 21-0, 0-21, 21-19 shortcuts

### 🔑 Admin Passcodes (for tournament day)
```
july4admin   - Main tournament organizer
score2024    - For scorekeepers and volunteers  
official24   - For tournament officials
```

## How to Use

### For Tournament Organizers
1. **Share passcodes**: Give admin passcodes to trusted scorekeepers before the tournament
2. **Monitor admin access**: See who is logged in as admin in the top-right corner
3. **Change passcodes if needed**: Update `hooks/use-admin.ts` if access needs to be revoked

### For Scorekeepers
1. **Login**: Click the admin login card in the top-right corner
2. **Enter credentials**: Provide your name and one of the admin passcodes
3. **Keep session active**: Admin status lasts 4 hours, then you'll need to re-login
4. **Score matches**: Edit buttons will now work for updating match scores

### For Players/Spectators
- **Clean viewing experience**: See all tournament data without confusing buttons
- **Live updates**: Scores and standings update automatically
- **No accidental clicks**: Editing controls are completely hidden

## Visual Indicators

### 🟢 Admin Mode Active
- Green admin card showing logged-in user name
- All edit buttons and admin functions are enabled
- No warning messages about admin access

### 🟡 Non-Admin (Spectator) Mode  
- Clean interface with no editing buttons visible
- Helpful blue notices explaining spectator mode
- Live score updates as admins make changes

### 🔒 Security Features
- **Session timeout**: Auto-logout after 4 hours
- **Client-side only**: Admin state stored locally, not in database
- **Easy reset**: Tournament organizer can change passcodes anytime
- **No permanent accounts**: No user management needed

## Technical Implementation

### Files Modified
- `hooks/use-admin.ts` - Admin state management and passcode validation
- `components/admin-login.tsx` - Login/logout interface
- `components/pool-play.tsx` - Admin protection for pool play scoring
- `components/knockout-bracket.tsx` - Admin protection for knockout scoring  
- `components/ncaa-bracket.tsx` - Admin protection for NCAA bracket scoring
- `app/page.tsx` - Added admin login component to main page

### Admin Protection Pattern
All protected functions follow this pattern:
```typescript
const someAdminFunction = async () => {
  if (!isAdmin) {
    alert("Admin access required!")
    return
  }
  // ... rest of function
}
```

## Benefits

### ✅ For Tournament Day
- **No setup required**: No user accounts or complex authentication
- **Easy delegation**: Share passcodes with multiple scorekeepers
- **Instant access**: Login takes 10 seconds
- **Mobile friendly**: Works on phones and tablets
- **Foolproof**: Clear indicators when admin access is needed

### ✅ For Development
- **Simple to maintain**: No authentication backend needed
- **Easy to modify**: Passcodes can be changed in one file
- **Secure enough**: Prevents accidental changes during tournament
- **Scalable**: Can add more passcodes or features easily

## Emergency Procedures

### If someone unauthorized gets admin access:
1. **Change passcodes**: Update `hooks/use-admin.ts` and redeploy
2. **Have all admins re-login**: Old sessions will become invalid
3. **Check recent changes**: Review match scores for any suspicious updates

### If admin can't login:
1. **Verify passcode**: Check spelling and capitalization
2. **Clear browser data**: Try incognito/private browsing mode  
3. **Check console**: Browser dev tools may show connection issues
4. **Use backup passcode**: Try the other admin passcodes

## Future Enhancements

Possible improvements for future tournaments:
- **Audit log**: Track who changed what scores and when
- **Role-based access**: Different permissions for different admin types
- **Remote passcode changes**: Update passcodes through admin interface
- **Session management**: See all active admin sessions
- **Temporary access**: Generate time-limited admin codes

---

**Ready for Tournament Day!** 🏆🇺🇸

The admin system is now active and protecting all score editing functions. Tournament organizers can confidently delegate scoring responsibilities while maintaining control over the tournament data. 