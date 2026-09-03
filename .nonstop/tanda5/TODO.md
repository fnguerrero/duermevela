# TODO — tanda 5: relevamiento profundo de bugs

No es "arreglar lo que se vea mal": es buscar clases enteras de fallas con
comprobaciones que queden puestas. Cada ítem deja su verificación en el código.

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado

## A · Herramientas de auditoría (van primero: sin esto no hay relevamiento)

- [x] A1 · Un `auditarTodo()` que corra en cadena todas las verificaciones que ya existen y devuelva un solo veredicto · verif: corre y da un objeto con cada resultado
- [x] A2 · Centinela de dibujo: envolver el contexto 2D y cazar NaN/Infinity en cualquier coordenada, radios negativos y save/restore desbalanceados · verif: renderizar los 14 lugares + 18 cartas + los 4 finales sin una sola alerta
- [x] A3 · Centinela de consola: registrar todo error o warning durante una partida completa · verif: partida entera con 0 entradas

## B · Estado y flujo

- [x] B1 · Reinicio limpio: jugar hasta el final, reiniciar y volver a jugar sin residuos (timers, guías repetidas, mazo, indicios) · verif: dos partidas seguidas con el mismo resultado estructural
- [x] B2 · Dobles disparos: doble click en carta, doble toque en el instante, click en botón del final dos veces · verif: contadores no se pasan de lo esperado
- [x] B3 · El juego no se traba en ningún estado: barrido de las combinaciones congelado/instante/espera · verif: máquina de estados recorrida sin bloqueos
- [x] B4 · Las cuatro ramas del final (0, 1-2, 3-5, 6-8 indicios) llegan hasta la carta manuscrita · verif: las 4 recorridas de punta a punta

## C · Geometría

- [x] C1 · Barrido de tamaños: nada se superpone ni se sale en 12 relaciones de pantalla · verif: Bel, figura, cartas, texto y marcador medidos en cada uno
- [x] C2 · Resize en momentos críticos (durante la mutación, con el instante abierto, en el final) · verif: sin errores y geometría coherente después

## D · Contenido

- [x] D1 · Los 14 lugares y las 18 cartas: textos exactos contra el origen, sin tercera persona, sin nada real nombrado · verif: comparación carácter por carácter
- [x] D2 · Ningún texto se corta ni se desborda de su caja, en escritorio y en móvil · verif: medición de cajas contra contenido

## E · Audio

- [x] E1 · No se acumulan nodos de audio en una partida larga · verif: contar nodos antes y después

## F · Cierre

- [x] F1 · Correr auditarTodo() completo y dejarlo en verde · verif: todos los sub-resultados ok
- [x] F2 · Reempaquetar dist/ e informe · verif: el .html suelto abre y juega
