/** Helpers HTML para blocos wp:html no WordPress. */

export const WPFORMS_CONTACT_BLOCK = `<!-- wp:shortcode -->
[wpforms id="12"]
<!-- /wp:shortcode -->`;

export function htmlBlock(inner) {
  return '<!-- wp:html -->\n' + inner.trim() + '\n<!-- /wp:html -->';
}
