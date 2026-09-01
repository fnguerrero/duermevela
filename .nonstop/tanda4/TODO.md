# TODO — El segundo de más, tanda 4: la portada y lo que falta del guion

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado

## A · Portada

- [x] P1 · El fondo (la montaña rusa) sube hasta el título y le compite. Bajarlo, atenuarlo o correrlo para que el título quede sobre fondo limpio · archivos: index.html, js/juego.js · verif: captura de portada + medir cuánta tinta del fondo cae dentro de la caja del título
- [x] P2 · Los números 1/2/3 de las tres reglas se ven mal: círculos chicos con cifra ilegible. Rehacerlos legibles sin agrandar el bloque · archivos: index.html · verif: medir cuerpo en px del número y contraste contra su fondo
- [x] P3 · Revisar la portada entera en escritorio y en móvil tras P1 y P2 · verif: capturas en 1272x727 y 375x812, sin desborde horizontal

## B · Los ocho lugares que quedaron cortos

Todos en primera persona, un poco más largos, sin nombrar nunca nada real.

- [x] T1 · `cama` — es la revelación final y hoy tiene el texto más corto de los catorce (105 caracteres). Merece ser el mejor · verif: largo > 400 y que el `esconde` siga siendo el golpe
- [x] T2 · `ruina` — segundo paso del tramo del dolor, hoy genérico · verif: largo > 400
- [x] T3 · `luna` y `laguna` · verif: largo > 400 cada uno
- [x] T4 · `calesita` y `montania` · verif: largo > 400 cada uno
- [x] T5 · `puerta` y `bandada` · verif: largo > 400 cada uno
- [x] T6 · `barca` quedó en 359, justo abajo del resto del tramo · verif: largo > 400
- [x] T7 · Ningún texto nuevo se escapó a la tercera persona ni nombra nada real · verif: detector sobre los 14 lugares, revisando a mano cada acierto (los falsos positivos son la norma)

## C · La luna como hilo

- [x] L1 · La fase de la luna del cielo cambia con los indicios encontrados: de nueva a llena · archivos: js/luna.js, js/cielo.js, js/juego.js · verif: forzar 0, 4 y 8 indicios y capturar las tres
- [x] L2 · La fase que quedó al final coincide con el arcano XXII que toca · verif: correr las cuatro franjas de resultado y comparar fase contra carta
- [x] L3 · La luna del hilo no pisa a `luna` como lugar del recorrido · verif: partida que pase por el lugar luna con el hilo activo

## D · Cierre

- [x] Z1 · Verificación final: bases, dibujo, auditoría, rótulo, tramos · verif: las cinco en verde
- [x] Z2 · Reempaquetar dist/ y escribir INFORME.md · verif: el .html suelto abre y juega
