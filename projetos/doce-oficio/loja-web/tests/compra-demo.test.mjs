import test from "node:test";
import assert from "node:assert/strict";
import { montarCompraDemonstrativa } from "../src/lib/compra-demo.js";

const uuid = "a3b4c5d6-7890-4321-aabb-ccddee112233";
const form = {
  nome_cliente: "Pessoa Fictícia", telefone: "(41) 99999-0000",
  tipo_entrega: "retirada", data_desejada: "2026-11-22",
  periodo: "tarde", observacoes: "Demonstração",
};
const itens = [{id: "bolo-1",nome: "Bolo de chocolate",preco: 25.50,quantidade: 2}];

test("simulação gera recibo explícito e não declara pagamento confirmado", () => {
  const pedido = montarCompraDemonstrativa({form,itens,taxaEntrega:12,metodo:"pix",uuid});
  assert.equal(pedido.id,"SIM-A3B4C5D67890");
  assert.equal(pedido.demonstracao,true);
  assert.equal(pedido.pagamento,"pix");
  assert.equal(pedido.pagamento_status,"pendente");
  assert.equal(pedido.total,51);
  assert.equal(pedido.nome_cliente,"Cliente de demonstração");
  assert.equal(pedido.email,"");
  assert.equal(pedido.telefone,"");
  assert.equal(pedido.observacoes,"");
});

test("cálculo do frete é feito somente para entrega e aceita cartão fictício", () => {
  const pedido = montarCompraDemonstrativa({
    form:{...form,tipo_entrega:"entrega",endereco:"Rua Fictícia, 12 - Centro"},
    itens,taxaEntrega:12,metodo:"credito",uuid,
  });
  assert.equal(pedido.pagamento,"credito");
  assert.equal(pedido.subtotal,51);
  assert.equal(pedido.taxa_entrega,12);
  assert.equal(pedido.total,63);
  assert.equal(pedido.endereco,"Endereço demonstrativo (não enviado)");
});

test("não permite carrinho vazio, quantidades e métodos inválidos", () => {
  assert.throws(()=>montarCompraDemonstrativa({form,itens:[],taxaEntrega:12,metodo:"pix",uuid}),/Adicione um produto/);
  assert.throws(()=>montarCompraDemonstrativa({form,itens:[{...itens[0],quantidade:0}],taxaEntrega:12,metodo:"pix",uuid}),/Item do carrinho/);
  assert.throws(()=>montarCompraDemonstrativa({form,itens,taxaEntrega:12,metodo:"dinheiro",uuid}),/Selecione Pix/);
  assert.throws(()=>montarCompraDemonstrativa({form,itens,taxaEntrega:12,metodo:"pix",uuid:"x"}),/identificador/);
});
