export function printAsPdf(title: string, htmlContent: string) {
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Please allow pop-ups to download the PDF.");
    return;
  }

  newWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
    h1 { font-size: 24px; margin-bottom: 24px; border-bottom: 2px solid #e5e5e5; padding-bottom: 12px; }
    h2 { font-size: 18px; margin-top: 28px; margin-bottom: 12px; color: #333; }
    h3 { font-size: 15px; margin-top: 16px; margin-bottom: 8px; color: #444; }
    p, li { font-size: 13px; margin-bottom: 6px; }
    ul { padding-left: 20px; }
    .section { margin-bottom: 24px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; }
    .badge { display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 6px; }
    .quote { border-left: 3px solid #ccc; padding-left: 12px; font-style: italic; color: #555; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${htmlContent}
</body>
</html>`);
  newWindow.document.close();

  setTimeout(() => {
    newWindow.print();
  }, 500);
}
