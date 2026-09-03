# Informe — tanda 6: el celular, que es donde lo va a jugar

Relevamiento propio, sin lista de sugerencias: jugar el juego en 375x812 y en
escritorio, correr las verificaciones que ya tenía y medir lo que saliera. El
resultado es limpio de decir: **en escritorio no hay nada roto, y casi todo lo
que sale mal sale mal en vertical y angosto** — que es donde Bel lo va a abrir.

## Lo que estaba mal

**1. La portada explicaba una mecánica que ya no existe.** Decía *"Tocá cuando
llegue a la marca"* y *"Si errás no perdés el turno: perdés lo que había
abajo"*. Desde que mirar dejó de ser puntería y pasó a ser sostener el dedo, no
hay marca, no hay acierto y no hay error. Era lo primero que ella iba a leer, y
la mandaba a buscar reflejos a un juego que dejó de pedirlos.

**2. El nombre del lugar encima del marcador, en los ocho pasos.** En celular el
marcador se aplana a una línea y se lleva el 70% del ancho; el rótulo iba
centrado arriba del todo. En la cama se leía, literal, `oIoA o IDIE N APASO 2`.

**3. El mismo texto dos veces, tapando lo que hay que mirar.** Al transformarse
aparecían juntos el aviso *"mantené apretado para quedarte mirando"* y una guía
sobre la escena que repetía la frase — y esa guía caía justo encima de las
piezas volando y del anillo. El juego pedía mirar y se tapaba a sí mismo.

**4. El mazo montado sobre el tercer naipe.** Su posición era un 12% del alto
fijo, y en 812 px la mano se lleva 204: el contador caía adentro de las cartas.

**5. Bel cortada por el borde izquierdo.** Su tope de la izquierda contaba su
marca pero no su ancho: el centro entraba en el cuadro y el hombro quedaba
afuera. Se veía justo en la cama, la escena del final.

**6. Doscientos píxeles de nada en el medio de la pantalla.** El relato clavado
arriba, la figura anclada al piso y entre medio hasta el 31% del alto vacío,
mientras arriba no había más que el marcador.

**7. El arco del sueño se podía colar.** El recorrido tiene tres tramos —los
recuerdos, el dolor (forzado) y lo que queda—, y el reparto priorizaba las
cartas del tramo pero completaba con las de otro cuando no alcanzaban. La carta
que revela no tiene figura propia: su destino sale del lugar donde uno está, y
podía llevar a la ruina en pleno tramo de los recuerdos. Se llegaba al dolor dos
pasos antes de tiempo y después se volvía, porque el tramo lo fuerza igual.

**8. La bandada no pertenecía a ningún tramo.** Era el único de los catorce
lugares suelto. El commit anterior le había dado carta propia para que se viera
—aparecía en una partida de cada cien— pero al no estar en ningún tramo, llegar
ahí era siempre salirse de la estructura, y solo pasaba por relleno.

## Las herramientas que quedan

| Herramienta | Qué caza |
|---|---|
| `verificarCelular()` | rótulo, marcador, mazo y cartas que se pisan; Bel fuera del cuadro o encima de la figura; el hueco entre el relato y la escena. Mide las cajas de verdad, en los 14 lugares |
| `verificarReparto(n)` | una carta que lleve fuera de su tramo. Llama al reparto directo, sin jugar la partida: barre todos los pasos contra todos los lugares |
| `frecuenciaLugares(n)` | un lugar entero —con su texto, su dibujo y su anomalía— que nadie vaya a ver |

`verificarReparto` y `frecuenciaLugares` entran a `auditarTodo()`.
`verificarCelular` queda afuera a propósito: necesita que la ventana esté en el
tamaño a probar, así que se corre a mano en el tamaño que se quiera medir.

Y una trampa que costó encontrar: **la verificación no puede filtrar por
opacidad**. Estos elementos entran y salen con una transición de un segundo, y
con la pestaña en segundo plano esa transición no avanza nunca — filtrando por
opacidad, la verificación daba todo en verde porque no estaba midiendo nada.

## Medido

- `verificarCelular()` en 375x812: **0 solapamientos, 0 salidas de cuadro**, y
  el hueco entre el relato y la figura pasa de 178-252 px a 146-220.
- `verificarReparto(120)`: 11.760 repartos, **0 cartas fuera de su tramo**,
  contra 323 antes.
- `frecuenciaLugares(600)`: la bandada pasa de suelta a **32%**, igual que faro
  (32), reloj (32), puerta (33), platillo (34) y casa (38).
- `auditarTodo()`: bases, dibujo, contenido, textos, rótulo, tramos, reparto,
  frecuencias y dibujo limpio — **todos en verde**.
- `dist/el-segundo-de-mas.html` reempaquetado y jugado en 375x812.
