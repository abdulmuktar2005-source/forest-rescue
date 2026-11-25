import { test, expect } from '@playwright/test';

test('loads the forest, handles controls and completes all three rescues', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(`${message.text()} (${message.location().url})`); });
  page.on('response', response => { if (response.status() >= 400) pageErrors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => pageErrors.push(`Request failed ${request.url()}: ${request.failure()?.errorText}`));
  await page.goto('/');
  await page.waitForFunction(() => window.forestRescue?.renderer.info.render.calls > 0, null, { timeout: 15_000 });
  await page.waitForFunction(() => window.forestRescue?.getState().loadedModels.length >= 20, null, { timeout: 30_000 });
  await expect(page.locator('.brand')).toContainText('FERNWOOD');
  await expect(page.locator('#loading-screen')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.how-to li')).toHaveCount(4);
  await expect(page.locator('.how-to')).toContainText('gold compass arrow');
  await expect(page.locator('.how-to')).toContainText('golden camp ring');
  const initialShot = await page.screenshot();
  expect(initialShot.byteLength).toBeGreaterThan(20_000);
  const loaded = await page.evaluate(() => window.forestRescue.getState());
  expect(loaded.loadedModels).toContain('bridge');
  expect(loaded.loadedModels).toContain('station');
  expect(loaded.loadedModels).toContain('fox');
  expect(loaded.drawCalls).toBeLessThan(100);
  expect(loaded.triangles).toBeLessThan(800_000);

  await page.locator('#start-button').click();
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#mission-copy')).toContainText('any order');
  await expect(page.locator('#task-return')).toContainText('Locked');
  await expect(page.locator('#objective-distance')).toContainText('m');
  await expect(page.locator('#mini-map')).toBeVisible();
  await page.screenshot({ path: 'test-results/forest-rescue-live.png' });
  await page.evaluate(() => { window.__prevented = {}; window.addEventListener('keydown', e => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) window.__prevented[e.code] = e.defaultPrevented; }, true); });
  const initial = await page.evaluate(() => window.forestRescue.getState().position);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(520);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(520);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowUp');
  const afterForward = await page.evaluate(() => window.forestRescue.getState());
  expect(afterForward.position.z).toBeLessThan(initial.z - 1.8);
  expect(afterForward.speed).toBeLessThan(4.8); // Holding both forward bindings does not double speed.
  expect(await page.evaluate(() => window.__prevented.ArrowUp)).toBe(true);

  const xBeforeArrow = afterForward.position.x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(550);
  await page.keyboard.up('ArrowRight');
  expect((await page.evaluate(() => window.forestRescue.getState().position.x))).toBeGreaterThan(xBeforeArrow + .5);
  const xAfterArrowRight=await page.evaluate(()=>window.forestRescue.getState().position.x);
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(350);await page.keyboard.up('ArrowLeft');
  expect(await page.evaluate(()=>window.forestRescue.getState().position.x)).toBeLessThan(xAfterArrowRight);
  const xBeforeWasd = await page.evaluate(() => window.forestRescue.getState().position.x);
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(450);
  await page.keyboard.up('KeyA');
  const xAfterA=await page.evaluate(()=>window.forestRescue.getState().position.x);
  expect(xAfterA).toBeLessThan(xBeforeWasd);
  await page.keyboard.down('KeyD');await page.waitForTimeout(350);await page.keyboard.up('KeyD');
  expect(await page.evaluate(()=>window.forestRescue.getState().position.x)).toBeGreaterThan(xAfterA);
  const zBeforeDown=await page.evaluate(()=>window.forestRescue.getState().position.z);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(350);await page.keyboard.up('ArrowDown');
  expect(await page.evaluate(()=>window.forestRescue.getState().position.z)).toBeGreaterThan(zBeforeDown);
  const zBeforeS=await page.evaluate(()=>window.forestRescue.getState().position.z);
  await page.keyboard.down('KeyS');await page.waitForTimeout(350);await page.keyboard.up('KeyS');
  expect(await page.evaluate(()=>window.forestRescue.getState().position.z)).toBeGreaterThan(zBeforeS);

  await page.keyboard.down('KeyW');await page.keyboard.down('KeyD');await page.waitForTimeout(350);
  expect(await page.evaluate(()=>window.forestRescue.getState().speed)).toBeLessThan(4.8);
  await page.keyboard.up('KeyW');await page.keyboard.up('KeyD');

  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(550);
  const sprintSpeed = await page.evaluate(() => window.forestRescue.getState().speed);
  const sprintAnimation = await page.evaluate(() => window.forestRescue.getState().animation);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ShiftLeft');
  expect(sprintSpeed).toBeGreaterThan(5.8);
  expect(sprintAnimation).toBe('Run');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.keyboard.press('Space');
  await page.waitForTimeout(180);
  const jumpHeight = await page.evaluate(() => window.forestRescue.getState().position.y - window.forestRescue.terrainHeight(window.forestRescue.player.position.x, window.forestRescue.player.position.z));
  expect(jumpHeight).toBeGreaterThan(.45);
  expect(await page.evaluate(() => window.__prevented.Space)).toBe(true);
  await page.waitForTimeout(950);
  expect(await page.evaluate(() => Math.abs(window.forestRescue.getState().position.y - window.forestRescue.terrainHeight(window.forestRescue.player.position.x, window.forestRescue.player.position.z)))).toBeLessThan(.03);

  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-screen')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-screen')).toBeHidden();

  const collision = await page.evaluate(() => {
    const g=window.forestRescue,b=g.blockers[0],z=b.z,x=b.x-2.1,cx=g.creekX(1);
    return {treeBlocked:!g.canMoveTo(b.x,z),approachOpen:g.canMoveTo(x,z),riverBlocked:!g.canMoveTo(cx,1),bridgeOpen:g.canMoveTo(g.creekX(9),9)};
  });
  expect(collision).toEqual({treeBlocked:true,approachOpen:true,riverBlocked:true,bridgeOpen:false});
  const firstBlocker=await page.evaluate(()=>({x:window.forestRescue.blockers[0].x,z:window.forestRescue.blockers[0].z}));
  await page.evaluate(({x,z})=>{const g=window.forestRescue;g.player.position.set(x-2.1,g.terrainHeight(x-2.1,z),z);},firstBlocker);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(900);await page.keyboard.up('ArrowRight');
  const afterCollision=await page.evaluate(()=>window.forestRescue.getState().position);
  expect(afterCollision.x).toBeLessThan(firstBlocker.x-1.25);

  await page.evaluate(()=>{const g=window.forestRescue;g.player.position.set(0,g.terrainHeight(0,0),0);});
  const canvasBox=await page.locator('#world').boundingBox();
  const dragX=canvasBox.x+canvasBox.width*.7,dragY=canvasBox.y+canvasBox.height*.55;
  const yawBefore=await page.evaluate(()=>window.forestRescue.getState().cameraYaw);
  await page.mouse.move(dragX,dragY);await page.mouse.down();await page.mouse.move(dragX+125,dragY+25,{steps:6});await page.mouse.up();
  await expect.poll(async()=>Math.abs((await page.evaluate(()=>window.forestRescue.getState().cameraYaw))-yawBefore)).toBeGreaterThan(.4);
  const zoomBefore=await page.evaluate(()=>window.forestRescue.getState().targetCameraDistance);
  await page.mouse.wheel(0,260);
  await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().targetCameraDistance)).toBeGreaterThan(zoomBefore);
  const cameraYaw=await page.evaluate(()=>window.forestRescue.getState().cameraYaw);
  const moveStart=await page.evaluate(()=>window.forestRescue.getState().position);
  await page.keyboard.down('KeyW');await page.waitForTimeout(450);await page.keyboard.up('KeyW');
  const moveEnd=await page.evaluate(()=>window.forestRescue.getState().position);
  expect((moveEnd.x-moveStart.x)*-Math.sin(cameraYaw)+(moveEnd.z-moveStart.z)*-Math.cos(cameraYaw)).toBeGreaterThan(.7);

  const acornsBefore = await page.evaluate(()=>window.forestRescue.getState().acorns);
  await page.evaluate(()=>{const g=window.forestRescue,a=g.acorns.find(x=>!x.collected);g.player.position.set(a.x,g.terrainHeight(a.x,a.z),a.z);});
  await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().acorns)).toBe(acornsBefore+1);

  // Fruit and wood can be gathered before any animals are rescued.
  await page.evaluate(()=>{const g=window.forestRescue,p=g.pickups.find(x=>x.kind==='fruit'&&!x.collected);g.player.position.set(p.x,g.terrainHeight(p.x,p.z),p.z);});
  await page.keyboard.press('KeyE');await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().food)).toBe(1);
  await page.evaluate(()=>{const g=window.forestRescue,p=g.pickups.find(x=>x.kind==='wood'&&!x.collected);g.player.position.set(p.x,g.terrainHeight(p.x,p.z),p.z);});
  await page.keyboard.press('KeyE');await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().wood)).toBe(1);
  await expect(page.locator('#task-animals')).toContainText('0 / 3');

  // Rescue all three, then complete the food, bridge and return missions through real E input.
  for(let i=0;i<3;i++){
    await page.evaluate(index=>{const g=window.forestRescue,a=g.animals[index];g.player.position.set(a.root.position.x-1.3,g.terrainHeight(a.root.position.x-1.3,a.root.position.z),a.root.position.z);},i);
    await expect(page.locator('#prompt')).toBeVisible();
    await expect(page.locator('#prompt')).toContainText('Press E to rescue');
    await page.keyboard.press('KeyE');
    await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().following)).toBe(i+1);
    await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().rescued)).toBe(i+1);
  }
  for(let i=0;i<4;i++){
    await page.evaluate(index=>{const g=window.forestRescue,p=g.pickups.filter(x=>x.kind==='fruit'&&!x.collected)[0];g.player.position.set(p.x,g.terrainHeight(p.x,p.z),p.z);},i);
    await page.keyboard.press('KeyE');
  }
  await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().food)).toBe(5);
  for(let i=0;i<2;i++){
    await page.evaluate(()=>{const g=window.forestRescue,p=g.pickups.find(x=>x.kind==='wood'&&!x.collected);g.player.position.set(p.x,g.terrainHeight(p.x,p.z),p.z);});
    await page.keyboard.press('KeyE');
  }
  await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().wood)).toBe(3);
  await page.evaluate(()=>{const g=window.forestRescue,x=g.creekX(9)-1.4;g.player.position.set(x,g.terrainHeight(x,9),9);});
  await page.keyboard.press('KeyE');
  await expect.poll(async()=>page.evaluate(()=>window.forestRescue.getState().bridgeRepaired)).toBe(true);
  expect(await page.evaluate(()=>window.forestRescue.canMoveTo(window.forestRescue.creekX(9),9))).toBe(true);
  await expect(page.locator('#task-return')).toContainText('Ready');
  await page.evaluate(()=>{const g=window.forestRescue;g.player.position.set(0,g.terrainHeight(0,0),0);});
  await expect(page.locator('#victory-screen')).toBeVisible();
  expect(await page.evaluate(()=>window.forestRescue.getState().complete)).toBe(true);
  expect(await page.evaluate(()=>window.forestRescue.getState().delivered)).toBe(3);
  await page.locator('#play-again-button').click();
  await expect(page.locator('#victory-screen')).toBeHidden();
  expect(await page.evaluate(()=>window.forestRescue.getState().rescued)).toBe(0);
  expect(pageErrors).toEqual([]);
});
