/** Funções puras usadas pelo front-end e testadas sem DOM. */
export const money = (cents) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export function cartCount(cart){return Object.values(cart).reduce((n,q)=>n+Number(q||0),0)}
export function cartSubtotal(cart,products){return products.reduce((total,p)=>total+p.price_cents*(cart[p.id]||0),0)}
export function deliveryPrice(subtotal){return subtotal >= 8000 ? 0 : 990}
export function safeText(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
export function validateQty(quantity,stock){return Number.isInteger(quantity)&&quantity>=1&&quantity<=30&&quantity<=stock}
