# noneroll
archive low priority emails and send daily summary (unroll.me without 3rd party access)

# Setup
1. Create a new spreadsheet in google sheets that keeps track of low-priority email addresses
2. Create a new gmail folder. Mine is called ```zbulk```. If you name it differently, replace ```zbulk``` in the ```noneroll.gs``` file to the  folder you want. As you add emails to this folder, the spreadhsheet gets populated with email addresses that will regularly be archived
2. Create a new google app scripts project
  - copy code from ```noneroll.gs``` to the existing ```Code.gs``` or a new file if you choose
  - replace ```sheetID``` with the id of the sheet created in step 1
  - replace ```zbulk``` in the functions ```arch```, ```addEmail```, and ```getEmails``` to your bulk folder label
3. Create project triggers. I run
  - ```arch``` every 30 mins
  - ```addEmail``` between midnight and 1am
  - ```noneroll``` between 5 and 6am
