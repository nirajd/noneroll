// Global Constants
const SHEET_ID = 'sheetID';                                       // Replace with your spreadsheet ID
const SHEET_NAME = 'Sheet1';                                      // Update if your sheet is named differently
const ZBULK_LABEL = 'zbulk';                                      // Change if you use a different Gmail label
const DELAY_DAYS = 1;                                             // Number of days (1 = last 24 hours)

// Helper to extract the email address from a sender string.
function extractEmail(fromStr) {
  const match = fromStr.match(/<([^>]+)>/);
  return match ? match[1] : fromStr;
}

// Run every hour to archive any new email from email addresses in the sheet.
function arch() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  // Retrieve emails from the first column and convert to a Set for efficient lookups.
  const sheetData = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues().flat();
  const sheetEmails = new Set(sheetData);
  
  const threads = GmailApp.getInboxThreads();
  const label = GmailApp.getUserLabelByName(ZBULK_LABEL);
  
  for (const thread of threads) {
    if (thread.isInInbox()) {
      const msg = thread.getMessages()[0];
      const email = extractEmail(msg.getFrom());
      if (sheetEmails.has(email)) {
        thread.addLabel(label);
        thread.markRead();
        thread.moveToArchive();
      }
    }
  }
}

// Run every day to add any emails from the zbulk folder to the sheet.
function addEmail() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  // Retrieve emails from the first column and convert to a Set for efficient lookups.
  const sheetData = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues().flat();
  const sheetEmails = new Set(sheetData);
  
  const label = GmailApp.getUserLabelByName(ZBULK_LABEL);
  const threads = label.getThreads();
  
  // Collect new emails in an array for batch insertion.
  const newEmails = [];
  
  for (const thread of threads) {
    const msg = thread.getMessages()[0];
    const email = extractEmail(msg.getFrom());
    if (!sheetEmails.has(email)) {
      newEmails.push([email]);
      sheetEmails.add(email); // Update the set to avoid duplicates in this run.
    }
  }
  
  // Append all new emails at once.
  if (newEmails.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    const range = sheet.getRange(startRow, 1, newEmails.length, 1);
    range.setValues(newEmails);
  }
}

// Automatically deduplicate email addresses in your spreadsheet.
function dedupeEmails() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  // Read all email addresses from column A.
  const data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  const uniqueEmails = [];
  const seen = new Set();
  
  // Iterate over each row.
  for (let i = 0; i < data.length; i++) {
    let email = data[i][0].toString().trim();
    if (email && !seen.has(email)) {
      seen.add(email);
      uniqueEmails.push([email]);
    }
  }
  
  // Clear the existing data and write back only unique emails.
  sheet.clearContents();
  if (uniqueEmails.length > 0) {
    sheet.getRange(1, 1, uniqueEmails.length, 1).setValues(uniqueEmails);
  }
}

// Retrieve emails from the last 24 hours that are still in the zbulk label.
function getEmails() {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - DELAY_DAYS);
  
  const label = GmailApp.getUserLabelByName(ZBULK_LABEL);
  const threads = label.getThreads();
  const data = [];
  
  // Check every thread.
  for (const thread of threads) {
    const lastMsgDate = thread.getLastMessageDate();
    if (lastMsgDate > maxDate) {
      const msg = thread.getMessages()[0];
      const permalink = thread.getPermalink();
      const subject = thread.getFirstMessageSubject();
      const from = msg.getFrom();
      const fromClean = from.replace(/\"|<.*>/g, '');
      const emailMatch = from.match(/<([^>]+)>/);
      const email = emailMatch ? emailMatch[1] : from;
      let unsubscribe = null;
      
      // Try to extract the unsubscribe link from the raw content.
      const rawContent = msg.getRawContent();
      const unsMatch = rawContent.match(/^list\-unsubscribe:(.|\r\n\s)+<(https?:\/\/[^>]+)>/im);
      if (unsMatch) {
        unsubscribe = unsMatch[unsMatch.length - 1];
      } else {
        // If not found in raw content, search within the email body.
        const body = msg.getBody();
        const regex = /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
        let match;
        while ((match = regex.exec(body)) !== null) {
          if (match[2].toLowerCase().includes('unsubscribe')) {
            unsubscribe = match[1];
            break;
          }
        }
      }
      
      data.push({
        permalink,
        subject,
        from: fromClean,
        date: lastMsgDate,
        email,
        uns: unsubscribe
      });
    }
  }
  return data;
}

// Run every day to send a summary email including emails from the last 24 hours.
function noneroll() {
  const emails = getEmails();
  if (emails.length > 0) {
    const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const subject = "Bulk Emails: " + date;
    const template = HtmlService.createTemplateFromFile('email');
    template.data = emails;
    const htmlBody = template.evaluate().getContent();
    
    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: subject,
      htmlBody: htmlBody
    });
  }
}
