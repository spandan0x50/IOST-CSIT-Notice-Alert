function checkLatestIOSTNotice() {
  const TARGET_URL = "https://iost.tu.edu.np/notices?title=CSIT&start_date=&nep_start_date=&end_date=&nep_end_date=&notice_type=21";

  try {
    const response = UrlFetchApp.fetch(TARGET_URL, { muteHttpExceptions: true });
    const html = response.getContentText();

    const mainSectionMatch = html.match(/<div class="notices-warpper[\s\S]*?<\/ul>/i);
    const searchArea = mainSectionMatch ? mainSectionMatch[0] : html;

    const regex = /<a href="(https:\/\/iost\.tu\.edu\.np\/notices\/(\d+))">\s*<h5>([\s\S]*?)<\/h5>/gi;
    const match = regex.exec(searchArea);

    if (!match) {
      Logger.log("No notices found on the page.");
      return;
    }

    const noticeUrl = match[1];
    const noticeId = match[2];
    const noticeTitle = match[3].replace(/\s+/g, ' ').trim();

    const scriptProperties = PropertiesService.getScriptProperties();
    const lastSeenId = scriptProperties.getProperty("LAST_SEEN_NOTICE_ID");

    pdfUrl=fetchPDFurl(noticeUrl);
    Logger.log(pdfUrl);

    if (lastSeenId === noticeId) {
      Logger.log(`No new notices. Current latest ID is still ${noticeId}.`);
      return;
    }

    const subject = `IOST Notice Alert: ${noticeTitle}`;
    const emailBody = `Latest CSIT Notice Details:\n\nTitle: ${noticeTitle}\nNotice ID: ${noticeId}\nLink: ${noticeUrl} \nPDF link: ${pdfUrl}`;

    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: subject,
      body: emailBody
    });

    scriptProperties.setProperty("LAST_SEEN_NOTICE_ID", noticeId);
    Logger.log(`New notice detected! Email sent for Notice ID ${noticeId}. Saved state updated.`);

  } catch (err) {
    Logger.log("Error fetching or processing notices: " + err.toString());
  }
}

function fetchPDFurl(url) {
  const resp = UrlFetchApp.fetch(url);
  const html = resp.getContentText();

  const regexNotice =
    /<a\s+href=["'](https:\/\/portal\.tu\.edu\.np\/notice\/\d+\/\d+\.pdf)["'][^>]*>/gi;

  const pdfURL = regexNotice.exec(html);

  if (pdfURL) {
    return pdfURL[1]
  }
}