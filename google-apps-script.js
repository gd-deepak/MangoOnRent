/**
 * MangoOnRent — Google Apps Script v4
 *
 * HOW TO UPDATE:
 * 1. Go to https://script.google.com → open your project
 * 2. Replace ALL code with this file
 * 3. Deploy → Manage deployments → Edit → New version → Deploy
 * 4. Run testSetup() once to create all sheets and seed default admin
 *
 * NOTE: Emails send FROM the Google account that owns this script.
 *       To send from mangoonrent@gmail.com, deploy from that account.
 *       replyTo is always set to mangoonrent@gmail.com.
 */

var SPREADSHEET_ID         = '1lMIL4_5oenBWdDLoWiHUYSZixOJasDsqZItmFLv0jv0'
var DEFAULT_ADMIN_USERNAME = 'mangoOnRent'
var DEFAULT_ADMIN_PASSWORD = 'Mango@1288'
var REPLY_TO_EMAIL         = 'mangoonrent@gmail.com'
var SUPPORT_PHONE          = '+91 90963 65035'

var HEADERS = {
  Contacts: ['timestamp','name','email','phone','subject','message'],
  Bookings: ['timestamp','booking_id','tree_ids','tree_count','tree_mode','name','email','phone','city','package_id','package_name','amount_paid','pincode','address','notes','txn_id','payment_status','payment_screenshot_url'],
  Payments: ['timestamp','booking_id','tree_ids','tree_count','name','phone','email','package_name','amount','txn_id','payment_status','payment_screenshot_url'],
  Users:    ['timestamp','name','email','phone','city','address','password_hash','password_plain','updated_at'],
  Admins:   ['timestamp','username','name','email','password_plain','added_by'],
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────

function getOrCreateSheet(name) {
  var SS    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = SS.getSheetByName(name)
  if (!sheet) {
    sheet = SS.insertSheet(name)
    var headers = HEADERS[name] || []
    if (headers.length) {
      sheet.appendRow(headers)
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold').setBackground('#F59E0B')
        .setFontColor('#FFFFFF').setHorizontalAlignment('center')
      sheet.setFrozenRows(1)
      sheet.autoResizeColumns(1, headers.length)
    }
  }
  return sheet
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  var headers = data[0]
  return data.slice(1).map(function(row) {
    var obj = {}
    headers.forEach(function(h, i) {
      obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i]
    })
    return obj
  })
}

function ok(data) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON)
}
function err(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON)
}

function updateRowByKey(sheetName, keyCol, keyVal, updates) {
  var sheet   = getOrCreateSheet(sheetName)
  var allData = sheet.getDataRange().getValues()
  var headers = allData[0]
  var keyIdx  = headers.indexOf(keyCol)
  if (keyIdx < 0) return err('Key column not found: ' + keyCol)
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][keyIdx]) === String(keyVal)) {
      Object.keys(updates).forEach(function(key) {
        var col = headers.indexOf(key)
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(updates[key])
      })
      return ok({ message: 'Updated!' })
    }
  }
  return err('Record not found')
}

function seedDefaultAdmin() {
  var sheet = getOrCreateSheet('Admins')
  var rows  = sheetToObjects(sheet)
  var exists = rows.some(function(r) {
    return String(r.username).toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase()
  })
  if (!exists) {
    sheet.appendRow([new Date().toISOString(), DEFAULT_ADMIN_USERNAME, 'System Admin', REPLY_TO_EMAIL, DEFAULT_ADMIN_PASSWORD, 'system'])
    sheet.autoResizeColumns(1, HEADERS.Admins.length)
  }
}

// ── Drive helpers (for payment screenshots) ────────────────────────────────────

function getOrCreatePaymentFolder() {
  var folders = DriveApp.getFoldersByName('MangoOnRent Payments')
  if (folders.hasNext()) return folders.next()
  return DriveApp.createFolder('MangoOnRent Payments')
}

function saveScreenshotToDrive(base64Data, bookingId) {
  try {
    if (!base64Data || base64Data.length < 100) return ''
    var parts    = base64Data.split(',')
    var mime     = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg'
    var clean    = parts[1] || parts[0]
    var decoded  = Utilities.base64Decode(clean)
    var blob     = Utilities.newBlob(decoded, mime, 'payment-' + bookingId + '.jpg')
    var folder   = getOrCreatePaymentFolder()
    var file     = folder.createFile(blob)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
    return 'https://drive.google.com/file/d/' + file.getId() + '/view'
  } catch (e) {
    Logger.log('Screenshot upload error: ' + e.toString())
    return ''
  }
}

// ── Email helpers ─────────────────────────────────────────────────────────────

function sendEmail(to, subject, htmlBody) {
  try {
    MailApp.sendEmail({ to: to, replyTo: REPLY_TO_EMAIL, subject: subject, htmlBody: htmlBody })
  } catch (e) { Logger.log('Email error: ' + e.toString()) }
}

function emailHeader(color) {
  return '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">'
    + '<div style="background:' + (color || '#F59E0B') + ';padding:22px;border-radius:12px 12px 0 0;text-align:center">'
    + '<h1 style="color:#fff;margin:0;font-size:22px">🥭 MangoOnRent</h1></div>'
    + '<div style="background:#fff;padding:28px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">'
}
function emailFooter() {
  return '<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">'
    + 'Questions? Email <a href="mailto:' + REPLY_TO_EMAIL + '">' + REPLY_TO_EMAIL + '</a>'
    + ' or WhatsApp <strong>' + SUPPORT_PHONE + '</strong></p>'
    + '</div></div>'
}

function sendWelcomeEmail(name, email) {
  var body = emailHeader('#F59E0B')
    + '<h2 style="color:#1f2937">Welcome, ' + name + '! 🎉</h2>'
    + '<p style="color:#6b7280;line-height:1.7">Your MangoOnRent account is ready. You can now book Keshar mango trees and track all your bookings.</p>'
    + '<div style="text-align:center;margin:28px 0"><a href="https://mangoonrent.netlify.app/booking" style="background:#F59E0B;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Book Your Tree 🌳</a></div>'
    + emailFooter()
  sendEmail(email, 'Welcome to MangoOnRent, ' + name + '! 🥭', body)
}

function sendBookingEmail(name, email, bookingId, treeIds, packageName, amount, txnId) {
  var chips = String(treeIds || '').split(',').map(function(t) {
    return '<span style="display:inline-block;background:#FEF3C7;color:#92400E;padding:2px 8px;margin:2px;border-radius:4px;font-family:monospace;font-weight:bold">' + t.trim() + '</span>'
  }).join(' ')
  var body = emailHeader('#F59E0B')
    + '<h2 style="color:#1f2937">Booking Received, ' + name + '! ✅</h2>'
    + '<p style="color:#6b7280">Your payment is under verification. We\'ll confirm within 24 hours.</p>'
    + '<div style="background:#f9fafb;border-radius:10px;padding:20px;margin:20px 0"><table style="width:100%;border-collapse:collapse">'
    + '<tr><td style="padding:7px;color:#9ca3af;font-size:13px">Booking ID</td><td style="padding:7px;font-family:monospace;font-weight:bold;color:#111827">' + bookingId + '</td></tr>'
    + '<tr><td style="padding:7px;color:#9ca3af;font-size:13px">Package</td><td style="padding:7px;font-weight:bold">' + packageName + '</td></tr>'
    + '<tr><td style="padding:7px;color:#9ca3af;font-size:13px">Amount</td><td style="padding:7px;font-weight:bold;color:#D97706;font-size:18px">₹' + Number(amount || 0).toLocaleString('en-IN') + '</td></tr>'
    + '<tr><td style="padding:7px;color:#9ca3af;font-size:13px">TXN ID</td><td style="padding:7px;font-family:monospace">' + (txnId || '—') + '</td></tr>'
    + '<tr><td style="padding:7px;color:#9ca3af;font-size:13px;vertical-align:top">Trees</td><td style="padding:7px">' + chips + '</td></tr>'
    + '</table></div>'
    + emailFooter()
  sendEmail(email, '✅ Booking Confirmed — ' + bookingId + ' | MangoOnRent', body)
}

function sendPaymentVerifiedEmail(name, email, bookingId, treeIds, packageName) {
  var chips = String(treeIds || '').split(',').map(function(t) {
    return '<span style="display:inline-block;background:#D1FAE5;color:#065F46;padding:2px 8px;margin:2px;border-radius:4px;font-family:monospace;font-weight:bold">' + t.trim() + '</span>'
  }).join(' ')
  var body = emailHeader('#10B981')
    + '<h2 style="color:#065F46">🎉 Payment Verified, ' + name + '!</h2>'
    + '<p style="color:#6b7280;line-height:1.7">Your payment has been verified. Your Keshar mango trees are officially booked for the 2026 season!</p>'
    + '<div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:20px;margin:20px 0">'
    + '<p style="margin:0 0 8px;color:#065F46;font-weight:bold">Booking: ' + bookingId + '</p>'
    + '<p style="margin:0 0 8px;color:#065F46">Package: ' + packageName + '</p>'
    + '<p style="margin:0;color:#065F46">Trees: ' + chips + '</p></div>'
    + '<p style="color:#6b7280">Mango delivery will be coordinated between <strong>March – June 2026</strong>. 🥭</p>'
    + emailFooter()
  sendEmail(email, '🎉 Payment Verified — ' + bookingId + ' | MangoOnRent', body)
}

function sendPaymentCancelledEmail(name, email, bookingId) {
  var body = emailHeader('#EF4444')
    + '<h2 style="color:#991B1B">Payment Cancelled — ' + bookingId + '</h2>'
    + '<p style="color:#6b7280;line-height:1.7">Your payment for booking <strong>' + bookingId + '</strong> has been marked as cancelled by our team.</p>'
    + '<p style="color:#6b7280">If you believe this is a mistake or wish to re-submit payment, please contact us.</p>'
    + emailFooter()
  sendEmail(email, 'Payment Cancelled — ' + bookingId + ' | MangoOnRent', body)
}

function sendForgotPasswordEmail(name, email, password) {
  var body = emailHeader('#6366F1')
    + '<h2 style="color:#1f2937">Password Recovery</h2>'
    + '<p style="color:#6b7280;line-height:1.7">Hi ' + name + ', here is your MangoOnRent account password:</p>'
    + '<div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:20px;text-align:center;margin:20px 0">'
    + '<p style="font-family:monospace;font-size:20px;font-weight:bold;color:#4C1D95;margin:0;letter-spacing:2px">' + password + '</p></div>'
    + '<p style="color:#6b7280;font-size:13px">After logging in, please update your password from your dashboard for security.</p>'
    + emailFooter()
  sendEmail(email, 'Your MangoOnRent Password', body)
}

// ── doGet ─────────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    seedDefaultAdmin()
    var action = e.parameter.action
    if (action === 'getBookingsByEmail') return getBookingsByEmail(e.parameter.email)
    if (action === 'getAllBookings')     return getAllRows('Bookings')
    if (action === 'getAllUsers')        return getAllUsers(false)
    if (action === 'getAllUsersAdmin')   return getAllUsers(true)
    if (action === 'getAllPayments')     return getAllRows('Payments')
    if (action === 'getAdmins')         return getAdmins()
    return err('Unknown action: ' + action)
  } catch (ex) { return err(ex.toString()) }
}

function getBookingsByEmail(email) {
  if (!email) return err('email required')
  var rows = sheetToObjects(getOrCreateSheet('Bookings'))
  return ok(rows.filter(function(r) { return String(r.email).toLowerCase() === email.toLowerCase() }))
}
function getAllRows(name) { return ok(sheetToObjects(getOrCreateSheet(name))) }
function getAllUsers(includePasswords) {
  var rows = sheetToObjects(getOrCreateSheet('Users'))
  return ok(rows.map(function(r) {
    var o = { timestamp: r.timestamp, name: r.name, email: r.email, phone: r.phone, city: r.city, address: r.address, updated_at: r.updated_at }
    if (includePasswords) o.password_plain = r.password_plain
    return o
  }))
}
function getAdmins() { return ok(sheetToObjects(getOrCreateSheet('Admins'))) }

// ── doPost ────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    seedDefaultAdmin()
    var raw  = (e.postData && e.postData.contents) ? e.postData.contents : '{}'
    var data = JSON.parse(raw)

    if (data.action === 'registerUser')        return registerUser(data)
    if (data.action === 'loginUser')           return loginUser(data)
    if (data.action === 'updateProfile')       return updateProfile(data)
    if (data.action === 'changeUserPassword')  return changeUserPassword(data)
    if (data.action === 'forgotPassword')      return forgotPassword(data)
    if (data.action === 'adminLogin')          return adminLogin(data)
    if (data.action === 'addAdmin')            return addAdmin(data)
    if (data.action === 'confirmPayment')      return confirmPayment(data)
    if (data.action === 'cancelPayment')       return cancelPayment(data)
    if (data.action === 'adminChangePassword') return adminChangePassword(data)
    if (data.action === 'submitBooking')       return submitBooking(data)
    if (data.action === 'updateBooking')       return updateBooking(data)
    if (data.action === 'updateUser')          return updateUser(data)
    if (data.action === 'updateAdmin')         return updateAdminRecord(data)
    return legacySubmit(data)
  } catch (ex) { return err(ex.toString()) }
}

// ── User auth ─────────────────────────────────────────────────────────────────

function registerUser(data) {
  var sheet = getOrCreateSheet('Users')
  var rows  = sheetToObjects(sheet)
  var exists = rows.some(function(r) { return String(r.email).toLowerCase() === String(data.email).toLowerCase() })
  if (exists) return err('This email is already registered. Please log in.')
  sheet.appendRow([new Date().toISOString(), data.name || '', data.email || '', data.phone || '', data.city || '', data.address || '', data.passwordHash || '', data.passwordPlain || '', ''])
  if (sheet.getLastRow() <= 5) sheet.autoResizeColumns(1, HEADERS.Users.length)
  if (data.email && data.name) sendWelcomeEmail(data.name, data.email)
  return ok({ message: 'Account created!' })
}

function loginUser(data) {
  var rows = sheetToObjects(getOrCreateSheet('Users'))
  var user = null
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].email).toLowerCase() === String(data.email).toLowerCase()) { user = rows[i]; break }
  }
  if (!user) return err('No account found with this email. Please register first.')
  if (user.password_hash !== data.passwordHash) return err('Incorrect password. Please try again.')
  return ok({ name: user.name, email: user.email, phone: user.phone, city: user.city, address: user.address })
}

function updateProfile(data) {
  var updates = {}
  ;['name','phone','city','address'].forEach(function(f) { if (data[f] !== undefined) updates[f] = data[f] })
  updates.updated_at = new Date().toISOString()
  return updateRowByKey('Users', 'email', data.email, updates)
}

function changeUserPassword(data) {
  var rows = sheetToObjects(getOrCreateSheet('Users'))
  var user = null
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].email).toLowerCase() === String(data.email).toLowerCase()) { user = rows[i]; break }
  }
  if (!user) return err('User not found.')
  if (data.currentHash && user.password_hash !== data.currentHash) return err('Current password is incorrect.')
  return updateRowByKey('Users', 'email', data.email, {
    password_hash:  data.newPasswordHash  || '',
    password_plain: data.newPasswordPlain || '',
    updated_at:     new Date().toISOString(),
  })
}

function forgotPassword(data) {
  var email = String(data.email || '').toLowerCase()
  if (!email) return err('Email is required.')
  var rows = sheetToObjects(getOrCreateSheet('Users'))
  var user = null
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].email).toLowerCase() === email) { user = rows[i]; break }
  }
  if (!user) return err('No account found with this email address.')
  var password = user.password_plain
  if (!password) {
    sendEmail(email, 'MangoOnRent Password Reset', emailHeader('#6366F1')
      + '<p style="color:#6b7280">Hi ' + user.name + ', we could not retrieve your password automatically. Please contact us at '
      + '<a href="mailto:' + REPLY_TO_EMAIL + '">' + REPLY_TO_EMAIL + '</a> or WhatsApp ' + SUPPORT_PHONE + ' for a manual reset.</p>'
      + emailFooter())
    return ok({ message: 'Check your email for instructions.' })
  }
  sendForgotPasswordEmail(user.name, email, password)
  return ok({ message: 'Your password has been sent to your email.' })
}

// ── Admin auth ────────────────────────────────────────────────────────────────

function adminLogin(data) {
  if (data.username === DEFAULT_ADMIN_USERNAME && data.password === DEFAULT_ADMIN_PASSWORD) {
    return ok({ username: DEFAULT_ADMIN_USERNAME, name: 'System Admin', role: 'admin' })
  }
  var rows = sheetToObjects(getOrCreateSheet('Admins'))
  var admin = null
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].username).toLowerCase() === String(data.username).toLowerCase()) { admin = rows[i]; break }
  }
  if (!admin) return err('Admin not found.')
  if (admin.password_plain !== data.password) return err('Incorrect password.')
  return ok({ username: admin.username, name: admin.name, email: admin.email, role: 'admin' })
}

function addAdmin(data) {
  if (!data.username || !data.password) return err('Username and password are required.')
  var sheet = getOrCreateSheet('Admins')
  var rows  = sheetToObjects(sheet)
  var exists = rows.some(function(r) { return String(r.username).toLowerCase() === String(data.username).toLowerCase() })
  if (exists) return err('An admin with this username already exists.')
  sheet.appendRow([new Date().toISOString(), data.username, data.name || '', data.email || '', data.password, data.addedBy || 'admin'])
  if (sheet.getLastRow() <= 5) sheet.autoResizeColumns(1, HEADERS.Admins.length)
  return ok({ message: 'Admin added!' })
}

function adminChangePassword(data) {
  if (!data.identifier || !data.newPassword) return err('Identifier and new password required.')
  if (data.userType === 'admin') {
    if (String(data.identifier).toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase()) {
      return err('Default admin password must be changed in the script code directly.')
    }
    return updateRowByKey('Admins', 'username', data.identifier, { password_plain: data.newPassword })
  }
  return updateRowByKey('Users', 'email', data.identifier, {
    password_hash:  data.newPasswordHash  || '',
    password_plain: data.newPassword,
    updated_at:     new Date().toISOString(),
  })
}

// ── Payment actions ───────────────────────────────────────────────────────────

function setPaymentStatus(bookingId, newStatus) {
  if (!bookingId) return err('bookingId required')
  var bSheet  = getOrCreateSheet('Bookings')
  var bData   = bSheet.getDataRange().getValues()
  var bH      = bData[0]
  var bidIdx  = bH.indexOf('booking_id')
  var stIdx   = bH.indexOf('payment_status')
  var emIdx   = bH.indexOf('email')
  var nmIdx   = bH.indexOf('name')
  var tiIdx   = bH.indexOf('tree_ids')
  var pkIdx   = bH.indexOf('package_name')
  var found   = false
  var info    = {}
  for (var i = 1; i < bData.length; i++) {
    if (String(bData[i][bidIdx]) === String(bookingId)) {
      bSheet.getRange(i + 1, stIdx + 1).setValue(newStatus)
      info = { email: bData[i][emIdx], name: bData[i][nmIdx], treeIds: bData[i][tiIdx], pkg: bData[i][pkIdx] }
      found = true; break
    }
  }
  if (!found) return err('Booking not found: ' + bookingId)
  // Mirror to Payments sheet
  var pSheet = getOrCreateSheet('Payments')
  var pData  = pSheet.getDataRange().getValues()
  var pH     = pData[0]
  var pBidIdx = pH.indexOf('booking_id')
  var pStIdx  = pH.indexOf('payment_status')
  for (var j = 1; j < pData.length; j++) {
    if (String(pData[j][pBidIdx]) === String(bookingId)) {
      pSheet.getRange(j + 1, pStIdx + 1).setValue(newStatus); break
    }
  }
  return { found: true, info: info }
}

function confirmPayment(data) {
  var result = setPaymentStatus(data.bookingId, 'Verified & Confirmed ✓')
  if (result.ok === false) return err(result.error || 'Not found')
  if (!result.found) return err('Booking not found')
  var info = result.info
  if (info.email) sendPaymentVerifiedEmail(info.name, info.email, data.bookingId, info.treeIds, info.pkg)
  return ok({ message: 'Payment confirmed and customer notified.' })
}

function cancelPayment(data) {
  var result = setPaymentStatus(data.bookingId, 'Cancelled by Admin')
  if (!result || !result.found) return err('Booking not found')
  var info = result.info
  if (info.email) sendPaymentCancelledEmail(info.name, info.email, data.bookingId)
  return ok({ message: 'Payment cancelled and customer notified.' })
}

// ── Record updates (admin) ────────────────────────────────────────────────────

function updateBooking(data) {
  var updates = {}
  ;['name','email','phone','city','tree_ids','tree_count','package_name','amount_paid','notes','txn_id','payment_status'].forEach(function(f) {
    if (data[f] !== undefined) updates[f] = data[f]
  })
  return updateRowByKey('Bookings', 'booking_id', data.booking_id, updates)
}

function updateUser(data) {
  var updates = {}
  ;['name','phone','city','address'].forEach(function(f) { if (data[f] !== undefined) updates[f] = data[f] })
  updates.updated_at = new Date().toISOString()
  return updateRowByKey('Users', 'email', data.email, updates)
}

function updateAdminRecord(data) {
  var updates = {}
  ;['name','email'].forEach(function(f) { if (data[f] !== undefined) updates[f] = data[f] })
  if (data.password) updates.password_plain = data.password
  return updateRowByKey('Admins', 'username', data.username, updates)
}

// ── Submit booking with email ─────────────────────────────────────────────────

function submitBooking(data) {
  // Check for double-booking: reject if any requested tree is already booked
  var requestedIds = String(data.tree_ids || '').split(',').map(function(s) { return s.trim() }).filter(Boolean)
  if (requestedIds.length > 0) {
    var existingBookings = sheetToObjects(getOrCreateSheet('Bookings'))
    var bookedSet = {}
    existingBookings.forEach(function(b) {
      var status = String(b.payment_status || '').toLowerCase()
      if (!status.includes('cancel') && !status.includes('failed')) {
        String(b.tree_ids || '').split(',').forEach(function(id) {
          var t = id.trim(); if (t) bookedSet[t] = true
        })
      }
    })
    var conflicts = requestedIds.filter(function(id) { return bookedSet[id] })
    if (conflicts.length > 0) {
      return err('Tree(s) already booked: ' + conflicts.join(', ') + '. Please choose different trees.')
    }
  }

  // Save screenshot to Drive if provided
  var screenshotUrl = ''
  if (data.screenshot_base64 && data.screenshot_base64.length > 100) {
    screenshotUrl = saveScreenshotToDrive(data.screenshot_base64, data.booking_id || 'UNKNOWN')
  }

  var bSheet = getOrCreateSheet('Bookings')
  var bHeaders = HEADERS.Bookings
  var bRow = bHeaders.map(function(h) {
    if (h === 'payment_screenshot_url') return screenshotUrl
    return data[h] !== undefined ? data[h] : ''
  })
  bSheet.appendRow(bRow)

  var pSheet = getOrCreateSheet('Payments')
  var pRow = HEADERS.Payments.map(function(h) {
    if (h === 'payment_screenshot_url') return screenshotUrl
    return data[h] !== undefined ? data[h] : ''
  })
  pSheet.appendRow(pRow)

  if (data.email && data.name) {
    sendBookingEmail(data.name, data.email, data.booking_id, data.tree_ids, data.package_name, data.amount_paid, data.txn_id)
  }
  return ok({ message: 'Booking saved and confirmation sent.' })
}

// ── Legacy form submit ────────────────────────────────────────────────────────

function legacySubmit(data) {
  var sheetName = data.sheet
  if (!sheetName || !HEADERS[sheetName]) return err('Unknown sheet: ' + sheetName)
  var sheet   = getOrCreateSheet(sheetName)
  var headers = HEADERS[sheetName]
  var row     = headers.map(function(h) { return data[h] !== undefined ? data[h] : '' })
  sheet.appendRow(row)
  if (sheet.getLastRow() <= 5) sheet.autoResizeColumns(1, headers.length)
  return ok({ message: 'Saved to ' + sheetName })
}

// ── Test / setup ──────────────────────────────────────────────────────────────

/**
 * Run this ONCE to authorize DriveApp (screenshot uploads won't work without it).
 * Check the Execution log — it should say "Drive access OK".
 */
function testDriveAccess() {
  try {
    var folder = getOrCreatePaymentFolder()
    Logger.log('Drive access OK — folder: ' + folder.getName() + ' (' + folder.getId() + ')')
    // Upload a tiny test file to confirm write access
    var blob = Utilities.newBlob('test', 'text/plain', 'drive-test.txt')
    var file = folder.createFile(blob)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
    Logger.log('Test file created: https://drive.google.com/file/d/' + file.getId() + '/view')
    file.setTrashed(true) // clean up
    Logger.log('✅ DriveApp fully authorized and working!')
  } catch (e) {
    Logger.log('❌ Drive error: ' + e.toString())
  }
}

function testSetup() {
  ['Contacts','Bookings','Payments','Users','Admins'].forEach(function(name) {
    Logger.log(name + ': ' + getOrCreateSheet(name).getName())
  })
  seedDefaultAdmin()
  Logger.log('✅ All sheets ready! Default admin seeded.')
}

/**
 * Run this ONCE after updating the script to add any missing columns to existing sheets.
 * Safe to run on sheets that already have the correct headers — it only adds missing ones.
 */
function migrateSheets() {
  var SS = SpreadsheetApp.openById(SPREADSHEET_ID)
  Object.keys(HEADERS).forEach(function(sheetName) {
    var sheet = SS.getSheetByName(sheetName)
    if (!sheet) {
      Logger.log(sheetName + ': does not exist yet, skipping (run testSetup to create)')
      return
    }
    var expectedHeaders = HEADERS[sheetName]
    var lastCol = sheet.getLastColumn()
    var currentHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : []

    expectedHeaders.forEach(function(h, expectedIdx) {
      var existingIdx = currentHeaders.indexOf(h)
      if (existingIdx >= 0) return // already exists

      // Header missing — insert a new column at the correct position
      var insertAt = expectedIdx + 1 // 1-based
      if (insertAt > sheet.getLastColumn()) {
        // Append at end
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h)
      } else {
        sheet.insertColumnBefore(insertAt)
        sheet.getRange(1, insertAt).setValue(h)
        // Shift currentHeaders array so subsequent lookups are accurate
        currentHeaders.splice(insertAt - 1, 0, h)
      }
      Logger.log(sheetName + ': added missing column "' + h + '" at position ' + insertAt)
    })
    Logger.log(sheetName + ': ✅ done')
  })
  seedDefaultAdmin()
  Logger.log('Migration complete!')
}
