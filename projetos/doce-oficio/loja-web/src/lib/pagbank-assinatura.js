/** Assinatura ECDSA SHA-256 de notificações PagBank: funções testáveis sem segredos. */
export function derToP1363(signature, length = 32) {
  const bytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
  let index = 0;
  if (bytes[index++] !== 0x30) throw new Error("Assinatura DER inválida");
  function readLength() {
    let n = bytes[index++];
    if (n < 128) return n;
    const count = n & 0x7f;
    if (count < 1 || count > 2 || index + count > bytes.length) throw new Error("DER inválido");
    n = 0;
    for (let i = 0; i < count; i++) n = n * 256 + bytes[index++];
    return n;
  }
  // Capturar o índice depois de consumir o campo Length do ASN.1 DER.
  // A avaliação index + readLength() usava o índice antigo e rejeitava todas as assinaturas.
  const sequenceLength = readLength();
  const end = index + sequenceLength;
  if (end !== bytes.length) throw new Error("DER inválido");
  const halves = [];
  for (let half = 0; half < 2; half++) {
    if (bytes[index++] !== 0x02) throw new Error("Inteiro DER inválido");
    const n = readLength();
    if (n < 1 || index + n > end) throw new Error("Inteiro DER inválido");
    let value = bytes.slice(index, index + n);
    index += n;
    while (value.length > length && value[0] === 0) value = value.slice(1);
    if (value.length > length) throw new Error("Inteiro DER excede tamanho");
    const part = new Uint8Array(length);
    part.set(value, length - value.length);
    halves.push(part);
  }
  if (index !== end) throw new Error("DER contém dados extras");
  const result = new Uint8Array(length * 2);
  result.set(halves[0], 0);
  result.set(halves[1], length);
  return result;
}

function decodeB64(s) {
  const base64 = String(s).trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error("Base64 inválido");
  const str = atob(base64);
  return Uint8Array.from(str, c => c.charCodeAt(0));
}

export async function validarAssinaturaECDSA(rawBody, signatures, publicKey) {
  if (!publicKey || !rawBody || !signatures) return false;
  let imported;
  try {
    imported = await crypto.subtle.importKey("spki", decodeB64(publicKey),
      { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  } catch {
    console.error("Chave pública PagBank mal configurada.");
    return false;
  }
  const body = new TextEncoder().encode(rawBody);
  const list = Array.isArray(signatures) ? signatures : [signatures];
  for (const chunk of list.flatMap(s => String(s).split(","))) {
    try {
      const rawSignature = derToP1363(decodeB64(chunk.trim()));
      if (await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" },
        imported, rawSignature, body)) return true;
    } catch { /* tentar a próxima assinatura */ }
  }
  return false;
}

