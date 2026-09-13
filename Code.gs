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

    const pdfUrl = fetchPDFurl(noticeUrl);
    Logger.log(pdfUrl);

    if (lastSeenId === noticeId) {
      Logger.log(`No new notices. Current latest ID is still ${noticeId}.`);
      return;
    }

    const subject = `IOST Notice Alert: ${noticeTitle}`;
    const hasPdfUrl = !!pdfUrl;
    const emailBody = `Latest CSIT Notice Details:\n\nTitle: ${noticeTitle}\nNotice ID: ${noticeId}\nLink: ${noticeUrl}${hasPdfUrl ? `\nPDF link: ${pdfUrl}` : '\nPDF link: Not available at the moment.'}`;
    const safeTitle = escapeHtml(noticeTitle);
    const htmlBody = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;padding:24px 12px;font-family:Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:#1e293b;color:#ffffff;padding:20px 24px;font-size:22px;font-weight:700;">
                  IOST CSIT Notice Alert
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <div style="font-size:22px;line-height:1.4;font-weight:700;color:#0f172a;margin-bottom:12px;">
                    ${safeTitle}
                  </div>
                  <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:13px;font-weight:600;margin-bottom:20px;">
                    Notice ID: ${noticeId}
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                    <tr>
                      <td style="padding:0 8px 8px 0;">
                        <a href="${noticeUrl}" style="display:inline-block;background:#334155;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">View Notice Link</a>
                      </td>
                      ${hasPdfUrl ? `<td style="padding:0 0 8px 0;"><a href="${pdfUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:700;">Open Notice PDF</a></td>` : ''}
                    </tr>
                  </table>
                  ${hasPdfUrl ? '' : '<div style="color:#64748b;font-size:14px;line-height:1.5;">Notice PDF is not available at the moment.</div>'}
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #e2e8f0;padding:16px 24px;color:#64748b;font-size:12px;line-height:1.6;background:#f8fafc;">
                  This is an automated alert generated for Tribhuvan University IOST CSIT notices.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: subject,
      body: emailBody,
      htmlBody: htmlBody
    });

    scriptProperties.setProperty("LAST_SEEN_NOTICE_ID", noticeId);
    Logger.log(`New notice detected! Email sent for Notice ID ${noticeId}. Saved state updated.`);

  } catch (err) {
    Logger.log("Error fetching or processing notices: " + err.toString());
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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