"""Teste E2E real de navegador com Playwright + Chromium. Execute com servidor ativo.

Este script produz capturas locais em docs/evidencias/ quando E2E_SCREENSHOTS=1.
"""
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

URL=os.environ.get('E2E_BASE_URL','http://127.0.0.1:8771')
CAPTURES=Path('docs/evidencias')
if os.getenv('E2E_SCREENSHOTS')=='1':CAPTURES.mkdir(parents=True,exist_ok=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda exc:errors.append(str(exc)))
    page.goto(URL,wait_until='networkidle',timeout=35000)
    page.locator('.product-card').first.wait_for(timeout=12000)
    assert page.locator('.product-card').count()==8
    if os.getenv('E2E_SCREENSHOTS')=='1':page.screenshot(path=str(CAPTURES/'01-home-desktop.png'),full_page=True)
    print('PASS 01: página inicial, vitrine e oito produtos')
    page.get_by_role('button',name='Frutados').first.click()
    assert page.locator('.product-card').count()==3
    page.get_by_role('button',name='Todos os sabores').click()
    page.locator('.product-card .add-button').first.click()
    assert page.locator('#cartCount').inner_text()=='1'
    page.locator('#cartBtn').click()
    assert page.get_by_text('Finalizar pedido',exact=True).count()>=1
    page.locator('#checkoutBtn').click()
    assert page.locator('#authForm').count()==1
    print('PASS 02: filtro, carrinho e autenticação obrigatória')
    page.locator('#switchAuth').click()
    email=f'e2e_{int(time.time())}@example.test'
    page.locator('#f_name').fill('Cliente E2E')
    page.locator('#f_email').fill(email)
    page.locator('#f_password').fill('SenhaForte123!')
    page.get_by_role('button',name='Criar conta',exact=True).last.click()
    page.locator('#authForm').wait_for()
    page.locator('#f_email').fill(email)
    page.locator('#f_password').fill('SenhaForte123!')
    page.get_by_role('button',name='Entrar na conta').click()
    page.locator('#addrForm').wait_for(timeout=8000)
    print('PASS 03: cadastro e login')
    page.locator('#f_street').fill('Rua das Flores')
    page.locator('#f_number').fill('25')
    page.locator('#f_neighborhood').fill('Centro')
    page.locator('#f_city').fill('Curitiba')
    page.locator('#f_state').fill('PR')
    page.locator('#f_postal_code').fill('80000000')
    page.get_by_role('button',name='Salvar endereço').click()
    page.locator('#checkoutForm').wait_for(timeout=8000)
    page.get_by_role('button',name='Confirmar pedido de demonstração').click()
    page.get_by_text('Pedido confirmado!').wait_for(timeout=8000)
    assert 'Pedido #' in page.locator('#modalContent').inner_text()
    if os.getenv('E2E_SCREENSHOTS')=='1':page.screenshot(path=str(CAPTURES/'02-pedido-confirmado.png'))
    page.locator('#trackOrder').click()
    assert 'Pedido #' in page.locator('#modalContent').inner_text()
    print('PASS 04: endereço, checkout, persistência e acompanhamento')
    page.locator('#closeModal').click()
    assert errors==[],errors
    print('PASS 05: sem erros JavaScript no console')
    admin_ctx=browser.new_context(viewport={'width':1280,'height':800})
    a=admin_ctx.new_page()
    a.goto(URL,wait_until='networkidle')
    a.locator('.product-card').first.wait_for()
    a.locator('#accountBtn').click()
    a.locator('#f_email').fill('admin@cupcake.test')
    a.locator('#f_password').fill('SenhaForte123!')
    a.get_by_role('button',name='Entrar na conta').click()
    a.locator('#adminBtn').click()
    a.get_by_text('Painel administrativo').wait_for()
    a.locator('[data-admin=products]').click()
    assert a.locator('[data-edit-product]').count()>=8
    if os.getenv('E2E_SCREENSHOTS')=='1':a.screenshot(path=str(CAPTURES/'03-painel-administrativo.png'))
    print('PASS 06: acesso administrador e catálogo administrativo')
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    mobile.goto(URL,wait_until='networkidle')
    mobile.locator('.product-card').first.wait_for()
    assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
    if os.getenv('E2E_SCREENSHOTS')=='1':mobile.screenshot(path=str(CAPTURES/'04-home-mobile.png'),full_page=True)
    print('PASS 07: layout mobile sem rolagem horizontal')
    browser.close()
