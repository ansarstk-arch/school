export function printElement(el) {
  if (!el) return;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(`<html><head><title>Print</title>`);
  document.querySelectorAll("link[rel=stylesheet], style").forEach((s) => {
    w.document.write(s.outerHTML);
  });
  w.document.write(`</head><body>${el.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}
