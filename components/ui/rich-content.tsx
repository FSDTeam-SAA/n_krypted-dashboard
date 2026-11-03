import sanitizeHtml from "sanitize-html";
export function RichContent({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const value = /<[a-z]/i.test(html)
    ? html
    : `<p>${html.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\n", "<br>")}</p>`;
  const clean = sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "span",
    ],
    allowedAttributes: { a: ["href"], "*": ["class", "style"] },
    allowedClasses: {
      "*": ["ql-align-center", "ql-align-right", "ql-align-justify"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|center|right|justify)$/] } },
    allowedSchemes: ["https", "http", "mailto", "tel"],
  });
  return (
    <div
      className={`rich-content ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
