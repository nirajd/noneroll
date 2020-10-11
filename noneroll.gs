//run every hour to archive any new email from email in sheet
function arch() {
  var sheet = SpreadsheetApp.openById('sheetID');
  var range = sheet.getDataRange();
  var values = range.getValues();
  values = [].concat.apply([], values);
  //Logger.log(values)
  var threads = GmailApp.getInboxThreads();
  var label = GmailApp.getUserLabelByName('zbulk')
  for (var i = 0; i < threads.length; i++) {
    if(threads[i].isInInbox()){
      var msg = threads[i].getMessages()[0];
      var email = msg.getFrom().replace(/^.+<([^>]+)>$/, "$1");
      if(values.indexOf(email) > -1){
        threads[i].addLabel(label);
        threads[i].markRead();
        threads[i].moveToArchive();
      }
    } 
  }
}

//run every day to add any emails added to zbulk folder to sheet
function addEmail() {
  var sheet = SpreadsheetApp.openById('sheetID');
  var range = sheet.getDataRange();
  var values = range.getValues();
  values = [].concat.apply([], values);
  var label = GmailApp.getUserLabelByName('zbulk')
  var threads = label.getThreads();
  for (var i = 0; i < threads.length; i++) {
    var msg = threads[i].getMessages()[0];
    var email = msg.getFrom().replace(/^.+<([^>]+)>$/, "$1")
    if(values.indexOf(email) < 0){
      sheet.appendRow([email])
    }
  }
}

function getEmails() {
  var delayDays = 2
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - delayDays);
  var label = GmailApp.getUserLabelByName("zbulk");
  var threads = label.getThreads();
  var data = []
  for (var i = 0; i < threads.length; i++) {
    if (threads[i].getLastMessageDate()>maxDate){
      var d = {}
      d.permalink = threads[i].getPermalink()
      d.subject = threads[i].getFirstMessageSubject()
      var from = threads[i].getMessages()[0].getFrom()
      d.from = from.replace(/\"|<.*>/g,'')
      d.date = threads[i].getLastMessageDate()
      if (from.match(/<(.*)>/)!==null){
        d.email = from.match(/<(.*)>/)[1]
      } else {
        d.email = from
      }
      d.uns = null
      
      var uns = threads[i].getMessages()[0].getRawContent().match(/^list\-unsubscribe:(.|\r\n\s)+<(https?:\/\/[^>]+)>/im);
      if(uns) {
        d.uns = uns[uns.length-1]
      } else {
        var rex = /.*?<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?[Uu]nsubscribe.*?)<\/a>.*?/gi
        body_t = threads[i].getMessages()[0].getBody()
        while(u = rex.exec(body_t)){
          Logger.log("regmatch" + u.length)
          if(u[0].toLowerCase().indexOf('unsubscribe')!==-1){
            for(var j = u.length-1; j >=0; j--){
              if(u[j].substring(0,4)=="http"){
                d.uns=u[j]
                break
              }
            }
            if(d.uns){
              break
            }
            
          }
        }
      }
      data.push(d)
    } else {
      break
    }
  }
  return data;
}


//run every day to send summary email including emails from last 24 hours
function noneroll() {
  emails = getEmails()
  if(emails.length > 0) {
    var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var subject = "Bulk Emails: " + date;
    var t = HtmlService
      .createTemplateFromFile('email');
    t.data = emails;
    var hB = t.evaluate().getContent();
    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: subject,
      htmlBody: hB
    });
  }
}
