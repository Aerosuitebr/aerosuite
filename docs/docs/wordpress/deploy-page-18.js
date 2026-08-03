(async () => {
    await wp.apiFetch({ path: '/wp/v2/pages/18', method: 'POST', data: {"content":"<!-- wp:heading {\"level\":1} --><h1>Contato</h1><!-- /wp:heading -->\n<!-- wp:paragraph --><p>Agende demonstração ou solicite proposta. Respondemos em até um dia útil.</p><!-- /wp:paragraph -->\n<!-- wp:wpforms/form {\"formId\":\"12\"} /-->","status":"publish"} });
    return { ok: true, page: 'cont' };
  })()