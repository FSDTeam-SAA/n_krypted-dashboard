const extensionAttribute = 'bis_skin_checked'

const removeExtensionAttribute = (root: Document | Element) => {
  root
    .querySelectorAll(`[${extensionAttribute}]`)
    .forEach((element) => element.removeAttribute(extensionAttribute))

  if (root instanceof Element) {
    root.removeAttribute(extensionAttribute)
  }
}

try {
  // Some security extensions inject this private attribute before React starts.
  // Removing it synchronously keeps the server HTML and hydration input identical.
  removeExtensionAttribute(document)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as Element
        target.removeAttribute(extensionAttribute)
      } else {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) removeExtensionAttribute(node)
        })
      }
    }
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [extensionAttribute],
    childList: true,
    subtree: true,
  })

  window.addEventListener('load', () => observer.disconnect(), { once: true })
} catch {
  // Client instrumentation must never prevent the application from hydrating.
}
