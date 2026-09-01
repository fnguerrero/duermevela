# Informe — tanda 5: relevamiento de bugs

Auditoría profunda del juego entero. No "arreglar lo que se veía mal": buscar
clases enteras de fallas con herramientas que quedan puestas.

## Los tres bugs reales encontrados

**1. El audio podía congelar la pantalla.** Las funciones de sonido no saneaban
sus parámetros: un valor no finito llegaba a un `AudioParam` y tiraba excepción.
Como todo eso se llama desde adentro del bucle de dibujo, esa excepción mata el
cuadro entero y deja la pantalla congelada con lo último que se alcanzó a
pintar. Solo aparece **con el sonido encendido**, que es como lo va a jugar Bel
y como nunca lo había probado.

**2. El juego quedaba paralizado después de correr una prueba.** El adelanto de
cuadros empuja el reloj interno al futuro — 4,2 segundos en una partida — y como
el delta está acotado a cero por abajo (para que la cabeza de Bel no gire), el
juego no avanzaba hasta que el tiempo real lo alcanzara.

**3. `auditarTodo()` estaba rota en su primera línea.** Encadenaba
`verificarBases()` como si devolviera una promesa, y devuelve el objeto directo:
la auditoría entera tiraba `TypeError` antes de correr nada.

## Las herramientas que quedan

| Herramienta | Qué caza |
|---|---|
| `centinelaDibujo(fn)` | NaN, Infinity, radios negativos y `save`/`restore` desbalanceados en el canvas |
| `centinelaConsola(fn)` | errores, warnings y rechazos sin atrapar, incluidos los de callbacks |
| `verificarTextos()` | palabras pegadas, campos vacíos, tercera persona, algo real nombrado |
| `verFinal(n)` | salta al cierre con los indicios que se pidan, para probar las cuatro ramas |
| `auditarTodo()` | corre las siete verificaciones y da un veredicto |

## Verificación

| Área | Resultado |
|---|---|
| Dibujo estático | 14 lugares en reposo y en transformación, 18 cartas + dorso en 3 tamaños, 12 relaciones de pantalla — **0 alertas** |
| Geometría | 1920x1080, 1366x768, 1600x500, 375x812, 360x640 — **0 superposiciones, 0 desbordes** |
| Resize en caliente | a mitad de mutación, con el instante abierto y en el cierre, en 5 tamaños — **0 alertas** |
| Dobles disparos | doble ENTRAR, triple click en cartas, doble instante — **avanza 1 paso, suma 1 indicio** |
| Las 4 ramas del final | cierre → arcano → sobre → carta, las cuatro completas |
| Textos | 42 textos medidos contra su caja en 2 tamaños — **ninguno se corta** |
| Audio | basura contra 5 funciones con el sonido prendido — **0 caídas**; voces vuelven a 0 |
| Partida con sonido | 8 pasos, 8 indicios, cierre, **0 errores** |
| `auditarTodo()` | **las 7 áreas en verde** |

## Tres pruebas que estaban mal, y cómo se supo

Esto es lo que más valor tuvo de la tanda, porque cada una habría dado un
veredicto falso:

- **La geometría dio 12 de 12 en rojo** y estaba mal la prueba: cambiaba el
  tamaño del canvas y del body, pero el texto, el marcador y la mano son
  `position:fixed` y se posicionan contra el viewport. Medía cajas reales contra
  un ancho imaginario.
- **`verificarTextos()` tenía dos bugs propios.** Los `\b` del patrón quedaron
  escritos como caracteres de **backspace literales** — Python los interpretó al
  escribir el archivo — así que no cazaba nada y parecía estar en verde. Y aun
  bien escritos habrían fallado: en JavaScript `\b` no cierra sobre una vocal
  acentuada, así que `\bmama\b` nunca caza "mamá". Se descubrió inyectando
  corrupciones a propósito en vez de confiar en que pasara.
- **La cadena de tres partidas simuladas** parecía mostrar que el juego se
  trababa al reiniciar. Era el simulador: con la pestaña oculta el navegador
  frena los timers a uno por segundo. Jugando a mano, el juego avanza normal.

La lección repetida: **una prueba en verde no vale nada si nunca se comprobó que
sepa ponerse en rojo.**

## Decisiones tomadas por criterio propio

- **Eliminado el snapshot de textos en JSON.** Duplicaba los textos y quedaba
  viejo cuando el guion cambiaba, acusando diferencias que eran suyas. El guion
  es la fuente y no puede haber dos.
- **Conservado el texto nuevo de `faro.llegada`.** La diferencia que apareció
  era del snapshot, no del juego: ese texto lo cambié a propósito en el commit
  `f894c9c`.
- **El audio sanea en vez de fallar.** Que un sonido no suene es un problema
  chico; que el juego se congele por un NaN, no.

## Desvíos respecto de lo planeado

- **B1 y B3 se verificaron distinto de lo previsto.** El plan era encadenar
  partidas simuladas; el entorno no lo permite de forma fiable. Se verificaron
  jugando a mano y por el recorrido completo del final.
- **E1 se planeó como "contar nodos" y terminó encontrando un bug.** La primera
  medición dio 0 voces siempre, lo que parecía perfecto y en realidad era que el
  audio ni había arrancado: el navegador exige un gesto del usuario.

## Bloqueado

Nada.

## Iteraciones

De la #128 a la #142, quince, sobre un presupuesto de 40.
