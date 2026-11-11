import test from 'node:test';
import assert from 'node:assert/strict';
import {money,cartCount,cartSubtotal,deliveryPrice,safeText,validateQty} from '../app/static/logic.mjs';
test('formata preços em reais',()=>{assert.match(money(1590),/15,90/);assert.match(money(0),/0,00/)});
test('contabiliza carrinho e subtotal',()=>{assert.equal(cartCount({'1':2,'2':3}),5);assert.equal(cartSubtotal({'1':2,'2':3},[{id:1,price_cents:1000},{id:2,price_cents:750}]),4250)});
test('frete grátis a partir de R$80',()=>{assert.equal(deliveryPrice(7999),990);assert.equal(deliveryPrice(8000),0)});
test('protege interpolação HTML de dados do catálogo',()=>{assert.equal(safeText('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')});
test('limita quantidade ao estoque e ao máximo por pedido',()=>{assert.equal(validateQty(2,3),true);assert.equal(validateQty(4,3),false);assert.equal(validateQty(-1,10),false);assert.equal(validateQty(31,999),false)});
