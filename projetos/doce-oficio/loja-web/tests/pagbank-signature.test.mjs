import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { Buffer } from "node:buffer";
import { validarAssinaturaECDSA, derToP1363 } from "../src/lib/pagbank-assinatura.js";

const {publicKey,privateKey}=generateKeyPairSync("ec",{namedCurve:"P-256"});
const pub=publicKey.export({format:"der",type:"spki"}).toString("base64");
const body='{"id":"ORDE_ABC123","status":"PAID"}';
const signature=sign("sha256", Buffer.from(body),{key:privateKey,dsaEncoding:"der"}).toString("base64");

test("aceita assinatura PagBank ECDSA DER válida para o corpo original",async()=>{
 assert.equal(await validarAssinaturaECDSA(body,signature,pub),true);
});
test("rejeita corpo modificado, sem assinatura e chave pública inválida",async()=>{
 assert.equal(await validarAssinaturaECDSA(body+" ",signature,pub),false);
 assert.equal(await validarAssinaturaECDSA(body,"",pub),false);
 assert.equal(await validarAssinaturaECDSA(body,signature,"invalida"),false);
});
test("permite rotação de chaves: ao menos uma assinatura válida",async()=>{
 assert.equal(await validarAssinaturaECDSA(body,"NÃO-É-BASE64,"+signature,pub),true);
 assert.equal(await validarAssinaturaECDSA(body,"NÃO-É-BASE64,FFFF",pub),false);
});
test("não aceita DER truncado ou dados extras",()=>{
 const buf=Buffer.from(signature,"base64");
 assert.throws(()=>derToP1363(buf.subarray(0,buf.length-1)),/DER/);
 assert.throws(()=>derToP1363(Buffer.concat([buf,Buffer.from([0x00])])),/DER/);
});
