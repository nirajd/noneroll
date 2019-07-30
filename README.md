# noneroll

This Google Apps Script moves your low priority (promotional, social, political, etc.) emails in Gmail to a custom label, and sends you a synopsis of recieved emails every morning for review.

Basically, this is `unroll.me` without any 3rd party access or [creepy data brokering](https://www.nytimes.com/2017/04/24/technology/personal-data-firm-slice-unroll-me-backlash-uber.html).

## Configuration

1. Create a new spreadsheet in Google Sheets. Name it whatever you'd like.

  - This spreadsheet will be used to keep track of low priority email addresses.

2. Create a new Gmail label. Mine is called `zbulk`, but you are more than welcome to be creative.

  - Should you decide on a different label, replace every instance of `zbulk` in the `noneroll.gs` file to whatever name you have choosen.

3. Create a new Google Apps Script project.

  - Copy code from `noneroll.gs` to the project's `Code.gs` file.
  - Replace `sheetID` with the ID of the sheet (everything after `spreadsheets/d/` and before `/edit#` in the sheet's URL) that you created in Step 1.

4. Create project triggers. I am currently using the following settings:

  - `arch` every 15 mins
  - `addEmail` between midnight and 1am
  - `noneroll` between 5 and 6am

## Notes

- Tag any emails that you wish to add to your low priority email digest with `zbulk` (or your custom label).
- Column A of your spreadhsheet will be populated with the email addresses of mail you consider low priority.
- It is a good idea to occasionally open your spreadsheet and select *"Data > Remove duplicates"* from the menu to prevent email addresses from appearing multiple times in your spreadsheet.
  - Pull requests to fix this (see: automagically deduping email addresses) are welcome.
- If you want to stop mail from being flagged as low priority, remove the corresponding email address(es) from your spreadsheet and (to be safe) remove the label from any messages in `zbulk` (or your custom label).
- Low priority emails will be archived, labeled, and marked as read every 15 minutes.

## Credits

Forked from [a GitHub project by Niraj D](https://github.com/nirajd/noneroll). Thanks for making this possible! 🙌🏻
