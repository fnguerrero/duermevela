# TODO — tanda 6: el celular, que es donde lo va a jugar

Relevamiento propio del 03/09/2026: jugado en 375x812 y en escritorio, con las
verificaciones del proyecto corridas y 25 partidas simuladas. Escritorio está
bien; casi todo lo que sale mal, sale mal en celular. Ordenado por lo que Bel
nota primero.

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado

## A · Lo que dice el juego de sí mismo

- [x] A1 · La portada explica la mecánica vieja: "Tocá cuando llegue a la marca" y "Si errás no perdés el turno: perdés lo que había abajo". Hoy se sostiene apretado, no hay marca ni error. Reescribir los tres pasos con la mecánica de verdad · verif: ningún texto de la portada nombra puntería, marca, acierto ni error

## B · Layout en celular

- [x] B1 · El rótulo del lugar se superpone con el marcador en los 8 pasos (en la cama se lee `oIoA o IDIE N APASO 2`). El marcador aplanado ocupa ~70% del ancho en top:10px y el rótulo va centrado en top:16px · verif: medir las cajas de `#rotulo` y `#marcador` en los 14 lugares y en 4 anchos de celular, 0 solapamientos
- [x] B2 · Dos carteles con el mismo texto a la vez durante la transformación: la barra `MANTENÉ APRETADO PARA QUEDARTE MIRANDO` y la guía sobre la escena que repite la frase — y la guía tapa las piezas volando, que es lo que hay que mirar · verif: durante la mutación hay un solo aviso en pantalla, y no se cruza con la figura
- [x] B3 · El contador del mazo se monta sobre el dibujo: encima de la tercera carta de la mano, y encima de la mesa de luz en la cama · verif: la caja de `#restan` no se cruza con ninguna carta ni con la zona de la figura
- [x] B4 · Bel queda cortada por el borde izquierdo en la escena de la cama · verif: en los 14 lugares y 4 anchos, la figura de Bel entera dentro del cuadro
- [x] B5 · Con un relato corto queda medio pantalla vacía: la franja alta está reservada al texto largo y la figura anclada abajo (medido: 480 px de hueco en "Se puso enorme y todo lo demás me quedó chiquito") · verif: la distancia entre el pie del relato y el alto de la figura no pasa de un umbral, con el texto más corto y el más largo

## C · Estructura del recorrido

- [x] C1 · `verificarTramos()` da `ok:false`: apareció la ruina en el tramo de los recuerdos, dos pasos antes de que la estructura la fuerce. `repartir()` prioriza las cartas del tramo pero completa con las de otro cuando no alcanzan · verif: 60 partidas simuladas sin un solo "fuera del tramo"
- [x] C2 · `bandada` es el único de los 14 lugares que no pertenece a ningún tramo. Tiene carta propia (El Mundo) desde el último commit, así que se llega ahí siempre fuera de estructura y solo por relleno · verif: los 14 lugares están asignados, y la bandada aparece con una frecuencia parecida a la de sus compañeras de tramo

## D · Cierre

- [x] D1 · `auditarTodo()` en verde de punta a punta · verif: todos los sub-resultados ok
- [x] D2 · Reempaquetar `dist/` e informe · verif: el `.html` suelto abre y juega en celular

## Medido

- `verificarCelular()` en 375x812: 0 choques de cajas, 0 salidas de cuadro, huecos de 146 a 220 px (antes 178 a 252).
- `verificarReparto(120)`: 11.760 repartos, 0 cartas fuera de su tramo (antes 323).
- `auditarTodo()`: bases, dibujo, contenido, textos, rotulo, tramos, reparto, frecuencias y dibujoLimpio, todos en verde.
- `frecuenciaLugares(600)`: la bandada pasa de suelta a 32%, igual que faro (32), reloj (32), puerta (33), platillo (34) y casa (38).
