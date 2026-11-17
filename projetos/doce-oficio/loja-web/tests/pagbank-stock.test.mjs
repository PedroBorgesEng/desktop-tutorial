import test from "node:test";
import assert from "node:assert/strict";
import { reservaContaNoEstoque, unidadesOcupadas, validarDisponibilidade, aplicarDisponibilidadeCatalogo, MODELO_ESTOQUE } from "../src/lib/estoque-ledger.server.js";
import { conferirPagamentoPagBank } from "../src/lib/pagbank-regras.js";

const now = Date.parse("2026-11-17T12:00:00.000Z");
const later = "2026-11-17T14:00:00.000Z";
const before = "2026-11-17T11:00:00.000Z";
const order = (overrides={}) => ({
  id: "pedidoA", estoque_modelo: MODELO_ESTOQUE, status: "novo",
  pagamento_status: "pendente", reserva_expira_em: later,
  itens: [{produto_id:"produto1", quantidade:2}], ...overrides,
});

test("reserva aberta ocupa unidades e expirada não", () => {
  assert.equal(reservaContaNoEstoque(order(), now), true);
  assert.equal(reservaContaNoEstoque(order({reserva_expira_em: before}), now), false);
});
test("pedido cancelado/legado não bloqueia saldo, mas pago permanece ocupado", () => {
  assert.equal(reservaContaNoEstoque(order({status:"cancelado"}), now), false);
  assert.equal(reservaContaNoEstoque(order({estoque_modelo:undefined}), now), false);
  assert.equal(reservaContaNoEstoque(order({pagamento_status:"pago", status:"cancelado", reserva_expira_em:before}), now), true);
});
test("reserva repetida não debita Produto.estoque nem duplica total", () => {
  const data=[order(), order({id:"pedidoB",pagamento_status:"pago",reserva_expira_em:before})];
  assert.equal(unidadesOcupadas(data,now).get("produto1"),4);
  assert.equal(unidadesOcupadas(data,now).get("produto1"),4);
});
const db=(rows, estoque=5)=>({entities:{
  Pedido:{filter:async()=>({items:rows})},
  Produto:{get:async()=>({id:"produto1",nome:"Bolo",estoque,disponivel:true})},
}});
test("não permite novo checkout quando reservas e pagamentos esgotam o lote",async()=>{
  await assert.rejects(
    validarDisponibilidade(db([order()]),[{produto_id:"produto1",quantidade:4}],now),
    /Restam 3/);
});
test("permite quantidade restante exata",async()=>{
  const out=await validarDisponibilidade(db([order()]),[{produto_id:"produto1",quantidade:3}],now);
  assert.equal(out.itensVerificados,1);
});
test("pedidos expirados liberam capacidade no livro-razão",async()=>{
  const out=await validarDisponibilidade(db([order({reserva_expira_em:before})]),[{produto_id:"produto1",quantidade:5}],now);
  assert.equal(out.itensVerificados,1);
});
test("falha fechada se consulta de pedidos truncar ou não tiver items",async()=>{
  await assert.rejects(validarDisponibilidade(db(Array.from({length:400},(_,i)=>order({id:String(i)}))),[{produto_id:"produto1",quantidade:1}],now),/conferir todas/);
  const invalid={entities:{Pedido:{filter:async()=>({})}}};
  await assert.rejects(validarDisponibilidade(invalid,[{produto_id:"produto1",quantidade:1}],now),/conferir todas/);
});
const pago={
  id:"ORDE_AAAAA-BBBBB", reference_id:"pedidoA",
  charges:[{status:"PAID",amount:{currency:"BRL",value:2500},payment_method:{type:"PIX"}}]
};
const pedido={id:"pedidoA",total:25};
test("aceita somente pagamento autenticado com referência e valor corretos",()=>{
  assert.deepEqual(conferirPagamentoPagBank(pago,pedido,"pedidoA"),{pagamento:"pix",pagbank_order_id:pago.id});
  assert.equal(conferirPagamentoPagBank(pago,pedido,"outro"),null);
  assert.equal(conferirPagamentoPagBank({...pago,reference_id:"outro"},pedido,"pedidoA"),null);
});
test("não confirma pagamento parcialmente pago, aguardando ou recusado",()=>{
  assert.equal(conferirPagamentoPagBank({...pago,charges:[{...pago.charges[0],amount:{currency:"BRL",value:2000}}]},pedido,"pedidoA"),null);
  assert.equal(conferirPagamentoPagBank({...pago,charges:[{...pago.charges[0],status:"WAITING"}]},pedido,"pedidoA"),null);
  assert.equal(conferirPagamentoPagBank({...pago,charges:[{...pago.charges[0],status:"DECLINED"}]},pedido,"pedidoA"),null);
});
test("rejeita pagamento em outra moeda, tipo não suportado ou valor inválido",()=>{
  assert.equal(conferirPagamentoPagBank({...pago,charges:[{...pago.charges[0],amount:{currency:"USD",value:2500}}]},pedido,"pedidoA"),null);
  assert.equal(conferirPagamentoPagBank({...pago,charges:[{...pago.charges[0],payment_method:{type:"BOLETO"}}]},pedido,"pedidoA"),null);
  assert.equal(conferirPagamentoPagBank({...pago,charges:[{...pago.charges[0],amount:{currency:"BRL",value:2500.5}}]},pedido,"pedidoA"),null);
});
test("confirma cartão pago e não aceita valor extra misturado de outra moeda",()=>{
  const card={...pago,charges:[{...pago.charges[0],payment_method:{type:"CREDIT_CARD"}}]};
  assert.equal(conferirPagamentoPagBank(card,pedido,"pedidoA")?.pagamento,"credito");
  assert.equal(conferirPagamentoPagBank({...pago,charges:[...pago.charges,{...pago.charges[0],amount:{currency:"USD",value:500}}]},pedido,"pedidoA"),null);
});

test("catálogo mostra saldo líquido das reservas sem alterar o estoque bruto",async()=>{
  const produto={id:"produto1",nome:"Bolo",estoque:5,disponivel:true};
  const produtos=await aplicarDisponibilidadeCatalogo(db([order()]),[produto],now);
  assert.equal(produtos[0].estoque,3);
  assert.equal(produto.estoque,5);
});
test("catálogo mantém itens sem limite de estoque",async()=>{
  const produto={id:"produto1",nome:"Bolo",estoque:null};
  const produtos=await aplicarDisponibilidadeCatalogo(db([order()]),[produto],now);
  assert.equal(produtos[0].estoque,null);
});
