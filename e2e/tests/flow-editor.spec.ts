import { test, expect } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL, video: 'off' });
test('edita o fluxo com arraste, inserção, exclusão e revisão antes de salvar',async({page})=>{
  const menu=[{id:1,codigo:'OS_FLUXO_ESTACOES',nome:'Gerenciar estações',rota:'/os/fluxo/estacoes',ativo:true}];
  const user={id:999,tenantId:1,email:'qa@aerosuite.test',nome:'Gestor',role:'ADMIN',perfil:{id:1,nome:'Administrador',codigo:'ADMIN'},funcionalidadeCodigos:['OS_FLUXO_ESTACOES'],menuFuncionalidades:menu,modulosHabilitados:['MRO','os'],tenantFeatures:[]};
  const dados={versaoFluxo:'v1',setores:['Oficina','Qualidade'],etapasDisponiveis:[{id:1,nome:'Limpeza',setor:'Oficina',cor:'#0891b2',ordem:1},{id:2,nome:'Montagem',setor:'Oficina',cor:'#059669',ordem:2},{id:3,nome:'Inspeção final',setor:'Qualidade',cor:'#0d9488',ordem:3}],estacoes:[],maquinas:[],pendentes:[]};
  let enviado:any;
  await page.addInitScript(({user})=>{localStorage.setItem('aerosuite_token','eyJhbGciOiJub25lIn0.'+btoa(JSON.stringify({exp:9999999999,sub:'999',tid:1}))+'.qa');localStorage.setItem('aerosuite_user',JSON.stringify(user));localStorage.setItem('aerosuite_tenant_codigo','default');},{user});
  await page.route('**/api/**',async route=>{
    const url=new URL(route.request().url()).pathname;let body:unknown=[];
    if(url.includes('/auth/me'))body=user;
    else if(url.endsWith('/etapas/configuracao')){enviado=route.request().postDataJSON();body={...dados,versaoFluxo:'v2'};}
    else if(url.includes('/os-fluxo/estacoes'))body=dados;
    else if(url.includes('menu')||url.includes('funcionalidades'))body=menu;
    else if(url.includes('status'))body={needsCompletion:false,canEdit:false};
    else if(url.includes('features'))body={enabled:[]};
    else if(url.includes('health'))body={ok:true,database:'UP'};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto('/os/fluxo/estacoes');
  await page.getByRole('button',{name:/Editar fluxo/}).click();
  const dialog=page.locator('.flow-editor');await expect(dialog).toBeVisible();
  const rows=dialog.locator('.flow-row');
  const handle=rows.nth(0).locator('.flow-drag');
  await handle.scrollIntoViewIfNeeded();const from=await handle.boundingBox();const to=await rows.nth(1).boundingBox();
  await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await page.mouse.down();
  await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2+8,{steps:3});
  await page.mouse.move(from!.x+from!.width/2,to!.y+to!.height-15,{steps:12});await page.mouse.up();
  await expect(rows.nth(0).locator('.flow-row-name')).toHaveText('Montagem');
  await rows.nth(1).locator('input[id^="flow-name-"]').fill('Limpeza revisada');
  await rows.nth(0).getByRole('button',{name:/Inserir etapa após/}).click();
  await rows.nth(1).locator('input[id^="flow-name-"]').fill('Pintura');
  await dialog.getByRole('button',{name:'Excluir etapa Inspeção final',exact:true}).click();
  await expect(dialog.locator('.flow-removed')).toContainText('Inspeção final');
  expect(enviado).toBeUndefined();
  await page.setViewportSize({width:390,height:844});
  await rows.nth(1).getByRole('button',{name:'Mover Pintura para cima',exact:true}).click();
  await expect(rows.nth(0).locator('.flow-row-name')).toHaveText('Pintura');
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await dialog.getByRole('button',{name:'Revisar alterações',exact:true}).click();
  await expect(dialog.locator('.flow-review')).toContainText('Pintura');expect(enviado).toBeUndefined();
  await dialog.getByRole('button',{name:'Aplicar alterações no fluxo',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  expect(enviado.versao).toBe('v1');expect(enviado.etapas.map((e:any)=>e.nome)).toEqual(['Pintura','Montagem','Limpeza revisada']);
  expect(enviado.etapas.map((e:any)=>e.id)).toEqual([null,2,1]);
});
