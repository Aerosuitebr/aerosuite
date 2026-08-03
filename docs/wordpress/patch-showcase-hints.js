(async () => {
  const hint = "<span class=\"as-ui-shot__hint\">Passe o mouse · clique para ampliar</span>";
  const results = [];
  for (const id of [21, 20]) {
    const page = await wp.apiFetch({ path: '/wp/v2/pages/' + id + '?context=edit' });
    let c = page.content.raw || '';
    if (!c.includes('as-showcase')) {
      results.push({ id, skip: true });
      continue;
    }
    c = c.replace(/ loading="lazy"/g, ' loading="eager"');
    if (!c.includes('as-ui-shot__hint')) {
      c = c.replace(
        /(<div class="as-ui-frame__bar">[\s\S]*?<\/div>)(\s*<img)/g,
        '$1\n        ' + hint + '\n        $2'
      );
    }
    await wp.apiFetch({ path: '/wp/v2/pages/' + id, method: 'POST', data: { content: c } });
    results.push({ id, ok: true });
  }
  return results;
})()